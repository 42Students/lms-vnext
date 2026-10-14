import {z} from "zod";
const schema=z.object({
  companyName:z.string().trim().min(1).max(200),
  roleTitle:z.string().trim().min(1).max(200),
  roundName:z.string().trim().min(1).max(200),
  originalScheduledAt:z.string().datetime({offset:true}).nullable(),
  approvedScheduledAt:z.string().datetime({offset:true}).nullable(),
  venue:z.string().trim().max(300).nullable(),
  mode:z.enum(["VIRTUAL","ON_CAMPUS"]).nullable(),
}).strict();
const formatter=new Intl.DateTimeFormat("en-IN",{
  dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
});
/** The text is for the learner to copy, not a notification or provider confirmation. */
export function learnerInterviewRescheduleSummary(raw:z.input<typeof schema>){
  const value=schema.parse(raw);
  if(!value.approvedScheduledAt)return null;
  const previous=value.originalScheduledAt
    ? formatter.format(new Date(value.originalScheduledAt))+" IST"
    : "Original time not recorded";
  const approved=formatter.format(new Date(value.approvedScheduledAt))+" IST";
  const location=value.mode==="ON_CAMPUS"
    ? value.venue??"Venue pending" : value.mode==="VIRTUAL"?"Virtual interview":"Mode pending";
  const copyText=[
    "Approved interview reschedule",
    value.companyName+" — "+value.roleTitle,
    "Round: "+value.roundName,
    "Previous: "+previous,
    "Approved: "+approved,
    "Location: "+location,
    "This is a personal schedule summary, not an attendance confirmation.",
  ].join("\n");
  return {previous,approved,location,copyText};
}
