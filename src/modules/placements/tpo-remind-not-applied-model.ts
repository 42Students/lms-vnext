import {createHash} from "node:crypto";
import {z} from "zod";
export const tpoRemindNotAppliedSchema=z.object({
 action:z.literal("REMIND"),confirmed:z.literal(true),
 expectedPreviewToken:z.string().length(64),
}).strict();
export function placementReminderDay(now:Date){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",year:"numeric",
  month:"2-digit",day:"2-digit"}).formatToParts(now);
 const find=(type:string)=>parts.find(x=>x.type===type)?.value??"";
 return find("year")+"-"+find("month")+"-"+find("day");
}
export function placementReminderPreviewToken(jobId:string,day:string,recipients:readonly string[]){
 return createHash("sha256").update(JSON.stringify([
  jobId,day,[...recipients].sort(),
 ])).digest("hex");
}

/** Legacy not-applied reminders suppress repeats for 20 elapsed hours, even
 * when the interval crosses midnight in IST. A day key is still retained for
 * unique insert idempotency, but it is not the eligibility/cooldown clock. */
export const PLACEMENT_REMINDER_COOLDOWN_MS=20*60*60*1000;
export function placementReminderCooldownCutoff(now:Date):Date{
 if(!Number.isFinite(now.getTime()))throw new Error("Invalid reminder clock");
 return new Date(now.getTime()-PLACEMENT_REMINDER_COOLDOWN_MS);
}
export function placementReminderWithinCooldown(sentAt:Date,now:Date):boolean{
 return Number.isFinite(sentAt.getTime())&&
  sentAt.getTime()>placementReminderCooldownCutoff(now).getTime();
}

/** Reminder eligibility is the same in preview and locked delivery. Outside
 * drives record participation after the event; they do not accept student
 * applications and must never receive non-applicant reminders. */
export function tpoNonApplicantReminderBlockReason(
 job:{status:string;recordedOutside:boolean;applicationDeadline:Date|null},now:Date,
):"Drive is not published"|"Outside drives do not accept applications"|"Application deadline has passed"|null{
 if(job.status!=="PUBLISHED")return "Drive is not published";
 if(job.recordedOutside)return "Outside drives do not accept applications";
 if(job.applicationDeadline&&job.applicationDeadline<=now)return "Application deadline has passed";
 return null;
}
