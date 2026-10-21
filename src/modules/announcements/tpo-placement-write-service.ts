import "server-only";
import {z} from "zod";
import {placementTpoNoticeAudiences,placementTpoNoticeRecipients} from "@/db/schema/placement-tpo-notice-audiences";
import {freezeTpoNoticeRecipients} from "./tpo-notice-audience-snapshot-model";
import {tpoTargetedRecipientQuery} from "./tpo-targeted-recipient-query";
import {getDb} from "@/db/client";
import {db10Announcements} from "@/db/schema/db10-announcements";
import {activityEvents} from "@/db/schema/activity";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {placementTableExists} from "@/modules/placements/staged-tables";
import {parseTpoNoticeSchedule} from "./tpo-notice-schedule-model";

export const tpoNoticeCreateSchema=z.object({
 title:z.string().trim().min(1,"Give the announcement a title").max(200),
 message:z.string().trim().min(1,"Write an announcement").max(8000,"Keep it under 8000 characters."),
 pinned:z.boolean().default(false),
 buttonLabel:z.string().trim().min(1).max(60).optional(),
 buttonUrl:z.string().trim().max(500).regex(/^https:\/\/[^\s]+$/,"The link has to start with https://").optional(),
 audience:z.preprocess(
  raw=>raw==="ALL"?"PLACEMENTS":raw,
  z.enum(["COLLEGE","PLACEMENTS","BATCHES","BRANCHES","DRIVE"]).default("PLACEMENTS")
 ),
 targetId:z.string().uuid().optional(),
 targetIds:z.array(z.string().uuid()).max(50).optional(),
 sendAt:z.string().max(16).optional(),showUntil:z.string().max(16).optional(),
}).strict().superRefine((data,ctx)=>{
 if(Boolean(data.buttonLabel)!==Boolean(data.buttonUrl))
  ctx.addIssue({code:"custom",path:["buttonUrl"],message:"The link has to start with https://"});
 const grouped=data.audience==="BATCHES"||data.audience==="BRANCHES";
 const targets=data.targetIds??[];
 if(grouped&&!targets.length&&!data.targetId)ctx.addIssue({code:"custom",path:["targetIds"],message:"Choose an audience target"});
 if(grouped&&targets.length&&data.targetId)ctx.addIssue({code:"custom",path:["targetId"],message:"Select targets in one format"});
 if(new Set(targets).size!==targets.length)ctx.addIssue({code:"custom",path:["targetIds"],message:"Choose distinct audience targets"});
 if(data.audience==="DRIVE"&&!data.targetId)ctx.addIssue({code:"custom",path:["targetId"],message:"Choose an audience target"});
 // The legacy COLLEGE audience legitimately has no explicit recipient IDs;
 // every other targeted audience is checked for a live tenant-scoped match
 // before commit. Never downgrade an empty targeted list to COLLEGE.
 if(["COLLEGE","PLACEMENTS"].includes(data.audience)&&(data.targetId||targets.length)||
    !grouped&&targets.length)ctx.addIssue({code:"custom",path:["targetIds"],message:"Unexpected audience target"});
});

export async function createTpoNotice(context:RequestContext,raw:unknown){
 const data=tpoNoticeCreateSchema.parse(raw);
 const schedule=parseTpoNoticeSchedule(data,new Date());
 const membership=context.membership;
 if(!membership||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,membership.collegeId);
 if(!await placementTableExists("announcements"))throw new Error("ANNOUNCEMENTS_NOT_REGISTERED");
 if(data.audience!=="COLLEGE"&&(!await placementTableExists("placement_tpo_notice_audiences")||
  !await placementTableExists("placement_tpo_notice_recipients")))
  throw new Error("TARGETED_NOTICES_NOT_REGISTERED");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [notice]=await tx.insert(db10Announcements).values({
   organizationId:college.organizationId,collegeId:college.id,
   receiverType:"COLLEGE",receiverId:college.id,senderUserId:context.user.id,
   senderType:"TPO",title:data.title,message:data.message,isPinned:data.pinned,
   buttonLabel:data.buttonLabel??null,buttonUrl:data.buttonUrl??null,
   scheduledAt:schedule.scheduledAt,expiresAt:schedule.expiresAt,
  }).returning({id:db10Announcements.id,version:db10Announcements.version});
  if(!notice)throw new Error("NOTICE_CREATE_FAILED");
  if(data.audience!=="COLLEGE"){
   const matched=await tx.execute<{id:string}>(tpoTargetedRecipientQuery(college.id,{
    kind:data.audience,targetId:data.targetId,targetIds:data.targetIds,
   }));
   const recipients=freezeTpoNoticeRecipients(matched.rows.map(row=>row.id));
   if(recipients.length===0)throw new Error("TPO_NOTICE_NO_RECIPIENTS");
   await tx.insert(placementTpoNoticeAudiences).values({
    announcementId:notice.id,kind:data.audience,
   });
   for(let index=0;index<recipients.length;index+=500){
    await tx.insert(placementTpoNoticeRecipients).values(
     recipients.slice(index,index+500).map(membershipId=>({
      announcementId:notice.id,membershipId,
     })),
    );
   }
  }
  await tx.insert(activityEvents).values({
   organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,actorMembershipId:membership.id,
   module:"PLACEMENTS",eventType:"placements.tpo_notice.created",
   subjectType:"announcement",subjectId:notice.id,
   summary:data.audience==="COLLEGE"?"TPO college-wide notice created":"TPO targeted notice created",
   metadata:{noticeId:notice.id,pinned:data.pinned,audience:data.audience},
  });
  return notice;
 });
}
