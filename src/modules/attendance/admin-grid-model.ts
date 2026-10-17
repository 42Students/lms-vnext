export type AttendanceCellStatus =
  | "PRESENT"
  | "ABSENT"
  | "EXCUSED"
  | "MEDICAL"
  | "LATE";

type Session = {
  id: string;
  startsAt: string;
  attendanceStatus: string | null;
};

type Record = {
  scheduleEventId: string;
  membershipId: string;
  status: string;
};

const INDIA_OFFSET_MS = 330 * 60_000;

export function attendanceIndiaDay(iso: string) {
  const timestamp = new Date(iso).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new Error("Invalid attendance date");
  }
  return new Date(timestamp + INDIA_OFFSET_MS).toISOString().slice(0, 10);
}

export function shiftAttendanceMonth(month: string, offset: number) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isInteger(offset)) {
    throw new Error("Invalid attendance month");
  }
  const [year, number] = month.split("-").map(Number);
  const next = new Date(Date.UTC(year!, number! - 1 + offset, 1));
  return next.getUTCFullYear() + "-" + String(next.getUTCMonth() + 1).padStart(2, "0");
}

export function groupAttendanceDays<T extends { id: string; startsAt: string }>(
  sessions: readonly T[],
) {
  const days = new Map<string, T[]>();
  for (const session of [...sessions].sort((a, b) =>
    new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime() ||
    a.id.localeCompare(b.id)
  )) {
    const key = attendanceIndiaDay(session.startsAt);
    const group = days.get(key);
    if (group) group.push(session);
    else days.set(key, [session]);
  }
  return [...days].map(([day, sessions]) => ({ day, sessions }));
}

/** One column per calendar day, including days with no class. IST date keys
 * are computed from session timestamps; UTC arithmetic creates day labels
 * without depending on the server's locale or daylight-saving settings. */
export function attendanceMonthLabel(month:string){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))return "Choose a month";
 const [year,value]=month.split("-"),names=[
  "January","February","March","April","May","June","July",
  "August","September","October","November","December",
 ];
 return names[Number(value)-1]+" "+year;
}

export function attendanceMonthDays<T extends {id:string;startsAt:string}>(
 month:string,sessions:readonly T[],
){
 if(!/^\d{4}-(0[1-9]|1[0-2])$/.test(month))
  throw new Error("Invalid attendance month");
 const [year,m]=month.split("-").map(Number);
 const count=new Date(Date.UTC(year!,m!,0)).getUTCDate();
 const grouped=new Map(groupAttendanceDays(sessions).map(row=>[row.day,row.sessions]));
 return Array.from({length:count},(_,index)=>{
  const day=month+"-"+String(index+1).padStart(2,"0");
  const dow=new Date(Date.UTC(year!,m!-1,index+1)).getUTCDay();
  return {day,weekday:["S","M","T","W","T","F","S"][dow]!,
   isSunday:dow===0,sessions:grouped.get(day)??[]};
 });
}

export function adminAttendanceCellState(
  session: Session,
  record: Pick<Record, "status"> | undefined,
  now = new Date(),
) {
  if (new Date(session.startsAt).getTime() > now.getTime()) {
    return { code: "S", label: "Scheduled", counted: false, present: false };
  }
  // A session marked by faculty defaults every learner to PRESENT.
  // Only non-present learner exceptions have attendance_records rows.
  const facultyMarked = session.attendanceStatus === "MARKED";
  if (!facultyMarked && !record) {
    return { code: "—", label: "Not marked", counted: false, present: false };
  }
  const status = record?.status ?? "PRESENT";
  const states: { [key in AttendanceCellStatus]: [string, string] } = {
    PRESENT: ["P", "Present"],
    ABSENT: ["A", "Absent"],
    EXCUSED: ["E", "Excused"],
    MEDICAL: ["M", "Medical"],
    LATE: ["L", "Late"],
  };
  const state = states[status as AttendanceCellStatus];
  return {
    code: state?.[0] ?? "?",
    label: state?.[1] ?? status,
    counted: facultyMarked,
    present: facultyMarked && status === "PRESENT",
  };
}

export function adminAttendancePercent(
  membershipId: string,
  sessions: readonly Session[],
  records: readonly Record[],
  now = new Date(),
) {
  const byEvent = new Map(
    records.filter((record) => record.membershipId === membershipId)
      .map((record) => [record.scheduleEventId, record]),
  );
  let present = 0;
  let marked = 0;
  for (const session of sessions) {
    const state = adminAttendanceCellState(session, byEvent.get(session.id), now);
    if (!state.counted) continue;
    marked += 1;
    if (state.present) present += 1;
  }
  return marked === 0 ? null : Math.round((present / marked) * 100);
}

// Escape CSV quoting and neutralize spreadsheet formula injection from names.
export function attendanceCsvCell(value: string | number | null | undefined) {
  const raw = String(value ?? "");
  const safe = /^[\s]*[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replaceAll('"', '""') + '"';
}
