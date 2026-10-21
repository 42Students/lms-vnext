import { isCareerRoundVisible } from "./learner-round-visibility-policy";

export type CareerCalendarSourceRound = {
  applicationId: string;
  roundId: string;
  roundName: string;
  roundKind: string;
  companyName: string;
  roleTitle: string;
  scheduledAt: string | null;
  exception: {scheduledAt:string;mode?:string|null;venue?:string|null;meetingUrl?:string|null}|null;
  mode?:string|null;venue?:string|null;meetingUrl?:string|null;
  durationMinutes?:number|null;booked?:boolean;learnerConfirmedAt?:string|null;
};

export type CareerCalendarEvent = {
  key: string;
  applicationId: string;
  roundId: string;
  title: string;
  companyName: string;
  roleTitle: string;
  kind: "ASSESSMENT" | "INTERVIEW" | "OTHER";
  start: Date;
  dayKey: string;
  rescheduled: boolean;
  eventType?:"ROUND"|"APPLICATION_DEADLINE"|"EXAM_BLOCK"|"JOB_IMPORTANT_DATE";
  mode?:string|null;venue?:string|null;meetingUrl?:string|null;
  durationMinutes?:number|null;booked?:boolean;learnerConfirmedAt?:string|null;
  note?:string|null;
};

/** The caller must independently authorize blackout dates and supply only
 * un-applied, learner-visible deadlines. No arbitrary job IDs are queried. */
export type CareerCalendarSupplement={
 key:string;kind:"APPLICATION_DEADLINE"|"EXAM_BLOCK"|"JOB_IMPORTANT_DATE";day:string;title:string;
 companyName?:string;roleTitle?:string;visible?:boolean;applied?:boolean;
 note?:string|null;
};


/** The legacy adapter uses these copies in its response; no success toast on load. */
export const legacyJobCalendarSuccess="Calendar dates retrieved successfully";
export const legacyJobCalendarFailure="Failed to fetch calendar dates. Please try again or contact support.";
export const legacyJobImportantDateEventType="JOB_IMPORTANT_DATE" as const;
export type LegacyJobImportantDateDTO={
 label:string;eventType:typeof legacyJobImportantDateEventType;type:string;
 at:string;jobId:string;index:number;
};
/** Caller supplies authorized learner-visible job details only. The original
 * index is part of the identity; two entries for one job on one day survive.
 * Legacy naive dates are normalized to UTC midnight before reaching here;
 * we then present the resulting instant in the college's IST calendar.
 */
export function legacyJobImportantDatesToSupplements(
 job:{jobId:string;companyName?:string;roleTitle?:string;
  importantDates:readonly {label:string;at:string;type?:string}[]},
):CareerCalendarSupplement[]{
 return job.importantDates.flatMap((entry,index)=>{
  if(!entry.label.trim()||!Number.isFinite(Date.parse(entry.at)))return [];
  const record:LegacyJobImportantDateDTO={
   label:entry.label,eventType:legacyJobImportantDateEventType,
   type:entry.type??"IMPORTANT_DATE",at:entry.at,jobId:job.jobId,index,
  };
  return [{key:job.jobId+":"+index+":"+record.at,
   kind:legacyJobImportantDateEventType,day:careerDayKey(new Date(entry.at)),
   title:record.label,companyName:job.companyName,roleTitle:job.roleTitle,
   visible:true,note:record.type}];
 });
}
/** For SQL readers of rounds and job-important-dates: inclusive IST days become
 * one half-open UTC range. Both queries must also keep their own membership
 * and publication visibility restrictions.
 */
export function careerCalendarUtcRangeForIstDays(startDay:string,endDay:string){
 const valid=/^\d{4}-\d{2}-\d{2}$/;
 if(!valid.test(startDay)||!valid.test(endDay)||startDay>endDay)
  throw new Error("Invalid calendar range");
 const start=new Date(startDay+"T00:00:00+05:30");
 const end=new Date(Date.parse(endDay+"T00:00:00+05:30")+86_400_000);
 if(!Number.isFinite(start.getTime())||!Number.isFinite(end.getTime()))
  throw new Error("Invalid calendar range");
 return {from:start,toExclusive:end};
}

export type CareerCalendarView = "agenda" | "month" | "week" | "day";

export function careerDayKey(value: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(value);
  const get = (part: string) => parts.find((row) => row.type === part)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function initialCareerCalendarDay(): string {
  return careerDayKey(new Date());
}

function dateUtc(key: string) {
  return new Date(key + "T12:00:00.000Z");
}

export function shiftCareerCalendarDay(
  dayKey: string, view: CareerCalendarView, step: number,
): string {
  const value = dateUtc(dayKey);
  if (view === "agenda") value.setUTCDate(value.getUTCDate() + step * 30);
  else if (view === "week") value.setUTCDate(value.getUTCDate() + step * 7);
  else if (view === "day") value.setUTCDate(value.getUTCDate() + step);
  else {
    const initialDay = value.getUTCDate();
    value.setUTCDate(1);
    value.setUTCMonth(value.getUTCMonth() + step);
    const lastDay = new Date(Date.UTC(
      value.getUTCFullYear(), value.getUTCMonth() + 1, 0,
    )).getUTCDate();
    value.setUTCDate(Math.min(initialDay, lastDay));
  }
  return value.toISOString().slice(0, 10);
}

export function careerCalendarEvents(
  rounds: readonly CareerCalendarSourceRound[],
  supplements:readonly CareerCalendarSupplement[]=[],
): CareerCalendarEvent[] {
  const base=rounds.flatMap((round) => {
    const raw = round.exception?.scheduledAt ?? round.scheduledAt;
    if (!raw) return [];
    const start = new Date(raw);
    if (!Number.isFinite(start.getTime())) return [];
    const kind: CareerCalendarEvent["kind"] = isCareerRoundVisible("ASSESSMENT", round.roundKind)
      ? "ASSESSMENT" : isCareerRoundVisible("INTERVIEW", round.roundKind)
        ? "INTERVIEW" : "OTHER";
    return [{
      key: `${round.applicationId}:${round.roundId}`,
      applicationId: round.applicationId,
      roundId: round.roundId,
      title: round.roundName,
      companyName: round.companyName,
      roleTitle: round.roleTitle,
      kind,
      start,
      dayKey: careerDayKey(start),
      rescheduled: round.exception !== null,
      eventType:"ROUND" as const,mode:round.exception?.mode??round.mode,
      venue:round.exception?.venue??round.venue,
      meetingUrl:round.exception?.meetingUrl??round.meetingUrl,
      durationMinutes:round.durationMinutes,booked:round.booked,
      learnerConfirmedAt:round.learnerConfirmedAt,
    }];
  });
  const extras:CareerCalendarEvent[]=supplements.flatMap(item=>{
    if(item.kind==="APPLICATION_DEADLINE" && (item.visible!==true||item.applied===true))return [];
    if(!/^\d{4}-\d{2}-\d{2}$/.test(item.day))return [];
    const start=new Date(item.day+"T00:00:00+05:30");
    if(!Number.isFinite(start.getTime())||careerDayKey(start)!==item.day)return [];
    return [{key:item.kind+":"+item.key,applicationId:"",roundId:"",
      title:item.kind==="EXAM_BLOCK"?"No drives run on it · "+item.title:item.title,
      companyName:item.companyName??"College calendar",roleTitle:item.roleTitle??"",
      kind:"OTHER" as const,start,dayKey:item.day,rescheduled:false,
      eventType:item.kind,note:item.note??null}];
  });
  return [...base,...extras].sort((a,b)=>a.start.getTime()-b.start.getTime()||a.key.localeCompare(b.key));
}

export function careerCalendarPeriod(
  events: readonly CareerCalendarEvent[],
  anchor: string, view: CareerCalendarView,
) {
  const date = dateUtc(anchor);
  let start: string, end: string;
  if (view === "day") {
    start = end = anchor;
  } else if (view === "agenda") {
    start = anchor;
    date.setUTCDate(date.getUTCDate() + 29);
    end = date.toISOString().slice(0, 10);
  } else if (view === "week") {
    const offset = (date.getUTCDay() + 6) % 7; // ISO Monday
    date.setUTCDate(date.getUTCDate() - offset);
    start = date.toISOString().slice(0, 10);
    date.setUTCDate(date.getUTCDate() + 6);
    end = date.toISOString().slice(0, 10);
  } else {
    start = anchor.slice(0, 7) + "-01";
    date.setUTCMonth(date.getUTCMonth() + 1, 0);
    end = date.toISOString().slice(0, 10);
  }
  return {
    start, end,
    events: events.filter((event) => event.dayKey >= start && event.dayKey <= end),
  };
}

function icalText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,").replace(/;/g, "\\;");
}
function icalInstant(value: Date) {
  return value.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/** Export only authenticated learner-visible round titles/dates.
 * Don't leak provider URLs, invite secrets, or invent interview durations.
 */
export function learnerCareerIcal(
  events: readonly CareerCalendarEvent[], issuedAt: Date,
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//42Students LMS//Learner Career Calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of [...events].sort((a,b)=>a.start.getTime()-b.start.getTime()||a.key.localeCompare(b.key))) {
    const uid = event.key.replace(/[^a-zA-Z0-9:-]/g, "") + "@42students.lms";
    lines.push(
      "BEGIN:VEVENT",
      "UID:" + uid,
      "DTSTAMP:" + icalInstant(issuedAt),
      "DTSTART:" + icalInstant(event.start),
      "SUMMARY:" + icalText(event.title + " · " + event.companyName),
      "DESCRIPTION:" + icalText(event.roleTitle + (event.rescheduled ? " (rescheduled)" : "")),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}
