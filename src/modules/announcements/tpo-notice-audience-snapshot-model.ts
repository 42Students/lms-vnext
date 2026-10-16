import {z} from "zod";
export const tpoNoticeAudienceSelectionSchema=z.discriminatedUnion("kind",[
 z.strictObject({kind:z.literal("COLLEGE")}),
 z.strictObject({kind:z.literal("PLACEMENTS")}),
 z.strictObject({kind:z.literal("BATCHES"),cohortIds:z.array(z.string().uuid()).min(1).max(100)}),
 z.strictObject({kind:z.literal("BRANCHES"),departmentIds:z.array(z.string().uuid()).min(1).max(100)}),
 z.strictObject({kind:z.literal("DRIVE"),jobId:z.string().uuid(),
  applicants:z.enum(["ALL_APPLICANTS","STILL_IN_DRIVE"])}),
]);
/** Never silently turn a targeted preview into a college-wide publication. */
export function canPublishTpoNoticeWithCurrentStorage(kind:string,registered=false):boolean{
 return kind==="COLLEGE"||(registered&&["PLACEMENTS","BATCHES","BRANCHES","DRIVE"].includes(kind));
}
/** Frozen UUID-only recipient snapshot, prepared after college authorization. */
export function freezeTpoNoticeRecipients(membershipIds:readonly string[]){
 const schema=z.string().uuid();
 const unique=new Set<string>();
 for(const raw of membershipIds){
  const value=schema.parse(raw);
  unique.add(value);
  if(unique.size>100_000)throw new Error("TPO_NOTICE_AUDIENCE_TOO_LARGE");
 }
 return [...unique].sort();
}
