import { z } from "zod";

export const learnerInterviewCalendarInputSchema = z.object({
  applicationId: z.string().uuid(),
  roundId: z.string().uuid(),
  companyName: z.string().trim().min(1).max(200),
  roleTitle: z.string().trim().min(1).max(200),
  roundName: z.string().trim().min(1).max(200),
  scheduledAt: z.string().datetime({offset:true}).nullable(),
  durationMinutes: z.number().int().min(1).max(1440).nullable(),
  venue: z.string().trim().max(300).nullable(),
  mode: z.enum(["VIRTUAL","ON_CAMPUS"]).nullable(),
}).strict();

type CalendarInput = z.input<typeof learnerInterviewCalendarInputSchema>;

function asUtcCalendarValue(value:Date):string {
  return value.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z$/,"Z");
}
function escapeCalendarText(value:string):string {
  // Escape CR/LF to avoid injecting an iCalendar field.
  return value.replace(/\\/g,"\\\\").replace(/\r\n|\r|\n/g,"\\n")
    .replace(/;/g,"\\;").replace(/,/g,"\\,");
}

/**
 * These values are derived solely from the learner's already authorized round.
 * No calendar links are shown until BOTH the persisted start and duration exist.
 * Meeting links/private feedback are intentionally excluded from external shares.
 */
export function learnerInterviewCalendarArtifacts(raw:CalendarInput, generatedAt:Date) {
  const input=learnerInterviewCalendarInputSchema.parse(raw);
  if (!input.scheduledAt || input.durationMinutes === null) return null;
  const start=new Date(input.scheduledAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(generatedAt.getTime()))return null;
  const end=new Date(start.getTime()+input.durationMinutes*60_000);
  const title=input.companyName+" · "+input.roundName;
  const details="Placement interview for "+input.roleTitle;
  const venue=input.mode==="ON_CAMPUS" ? input.venue ?? "" : "";
  const ics=[
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//42Students//Learner Interview//EN",
    "BEGIN:VEVENT",
    "UID:"+input.applicationId+"-"+input.roundId+"@lms.42students",
    "DTSTAMP:"+asUtcCalendarValue(generatedAt),
    "DTSTART:"+asUtcCalendarValue(start),
    "DTEND:"+asUtcCalendarValue(end),
    "SUMMARY:"+escapeCalendarText(title),
    "DESCRIPTION:"+escapeCalendarText(details),
    ...(venue?["LOCATION:"+escapeCalendarText(venue)]:[]),
    "END:VEVENT","END:VCALENDAR","",
  ].join("\r\n");
  const params=new URLSearchParams({
    action:"TEMPLATE",text:title,dates:asUtcCalendarValue(start)+"/"+asUtcCalendarValue(end),
    details, ...(venue?{location:venue}:{}),
  });
  return {
    ics,
    filename:"interview-"+input.roundId+".ics",
    googleUrl:"https://calendar.google.com/calendar/render?"+params.toString(),
  };
}
