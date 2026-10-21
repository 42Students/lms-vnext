import dayjs from "dayjs";
import { DAYS_OF_WEEK, ATTENDANCE_THRESHOLD, isHeldClassSession as isHeld } from "@/utils/attendanceConstants";

/** Backend uses zero-padded day keys "01"-"31"; normalize for lookup. */
function dayKey(dayIdx) {
  return String(dayIdx).padStart(2, "0");
}

/**
 * Builds a per-student, day-by-day attendance summary for one month from the same
 * attendeeOrgData shape TeacherAttendanceView's grid renders from.
 *
 * Kept as an independent pass over the raw data rather than sharing the grid's own render-time
 * computation, so this can be unit-tested and reused by the PDF export without depending on
 * component state. One simplification versus the on-screen grid: a day with multiple sessions
 * where the student missed at least one is rolled up as "Absent" here (the grid instead shows a
 * distinct "partial" cell with a per-session tooltip) -- a monthly summary needs one status per
 * day, and "missed part of the day" reads most honestly as an absence, not a present.
 */
export function buildMonthlyAttendanceReport(attendeeOrgData, monthDate) {
  const now = dayjs();
  const month = new Date(monthDate).getMonth();
  const year = new Date(monthDate).getFullYear();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const classesByDay = attendeeOrgData?.classes ?? {};
  const roster = attendeeOrgData?.absentees ?? [];

  const dates = [];
  let weekdayIdx = new Date(year, month, 1).getDay();
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push({ day, weekday: DAYS_OF_WEEK[weekdayIdx] });
    weekdayIdx = (weekdayIdx + 1) % 7;
  }

  const heldSessionsByDay = dates.map(({ day }) =>
    (classesByDay[dayKey(day)] ?? []).filter((cls) => isHeld(cls, now))
  );
  const scheduledDays = heldSessionsByDay.filter((sessions) => sessions.length > 0).length;
  const totalSessions = heldSessionsByDay.reduce((total, sessions) => total + sessions.length, 0);

  const students = roster.map((student) => {
    let present = 0;
    let absent = 0;
    let notMarked = 0;
    const daily = dates.map(({ day, weekday }, index) => {
      const dayClasses = heldSessionsByDay[index];
      if (dayClasses.length === 0) return { day, weekday, status: "X" };
      const sessionStatuses = dayClasses.map((cls) =>
        student?.absent?.includes(cls?.Id) ? "A" : cls?.attendanceMarked ? "P" : "N"
      );
      const allNotMarked = sessionStatuses.every((s) => s === "N");
      const status = allNotMarked ? "N" : sessionStatuses.includes("A") ? "A" : "P";
      return { day, weekday, status };
    });
    daily.forEach(({ status }) => {
      if (status === "P") present++;
      else if (status === "A") absent++;
      else if (status === "N") notMarked++;
    });
    const marked = present + absent;
    const percent = marked > 0 ? Math.round((present / marked) * 100) : null;
    return {
      name: student?.studentName || "—",
      rollNumber: student?.rollNumber ?? student?.roll_number ?? null,
      daily,
      present,
      absent,
      notMarked,
      percent,
      belowThreshold: percent != null && percent < ATTENDANCE_THRESHOLD,
    };
  });

  const markedTotal = students.reduce((sum, s) => sum + s.present + s.absent, 0);
  const presentTotal = students.reduce((sum, s) => sum + s.present, 0);
  const overallPercent = markedTotal > 0 ? Math.round((presentTotal / markedTotal) * 100) : null;

  return {
    monthLabel: dayjs(monthDate).format("MMMM YYYY"),
    dates,
    students,
    scheduledDays,
    totalSessions,
    overallPercent,
    generatedAt: dayjs().format("D MMM YYYY, h:mm A"),
  };
}
