import {z} from "zod";
const inputSchema=z.object({
  scheduledAt:z.string().datetime({offset:true}).nullable(),
  approvedScheduledAt:z.string().datetime({offset:true}).nullable(),
}).strict();
/** A compact mobile schedule heading from the learner's authorized persisted round. */
export function learnerInterviewMobileSummary(raw:unknown):string{
  const value=inputSchema.parse(raw);
  const iso=value.approvedScheduledAt??value.scheduledAt;
  if(!iso)return "Awaiting a confirmed interview schedule from the placement team";
  const time=Date.parse(iso);
  if(!Number.isFinite(time))return "Interview schedule unavailable";
  const date=new Intl.DateTimeFormat("en-IN",{
    day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",
    timeZone:"Asia/Kolkata",
  }).format(new Date(time));
  return (value.approvedScheduledAt?"Approved reschedule · ":"Scheduled · ")+date+" IST";
}
