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
