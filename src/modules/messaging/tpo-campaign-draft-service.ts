import "server-only";
import {z} from "zod";
import {and,asc,eq,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads,placementTpoEmailCampaigns,placementTpoEmailCampaignRecipients}
 from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {planTpoCampaignRecipients} from "./tpo-campaign-send-policy";
import {resolveTpoCampaignRecipientSecret,issueTpoCampaignEmailRecipientKey} from "./tpo-campaign-recipient-token";
import {tpoCampaignDraftSchema} from "./tpo-campaign-draft-model";

/** Migration-only historical campaign marker. Importing an already-sent
 * legacy header is never a SEND command: no provider API, recipient tokens,
 * or new outbound queue may be created from this projection.
 */
export function mapHistoricalTpoCampaignState(input:{
 legacyStatus:string|null|undefined;
 sentAt:Date|null;
 totalRecipients:number;
}):{status:"SENT";dispatchAllowed:false;requiresReview:false}|
 {status:"DRAFT";dispatchAllowed:false;requiresReview:true} {
 const code=input.legacyStatus?.trim().toUpperCase();
 if((code==="SENT"||code==="COMPLETED") &&
    input.sentAt instanceof Date && Number.isFinite(input.sentAt.getTime()) &&
    Number.isSafeInteger(input.totalRecipients) && input.totalRecipients>=0)
  return {status:"SENT",dispatchAllowed:false,requiresReview:false};
 return {status:"DRAFT",dispatchAllowed:false,requiresReview:true};
}

export class TpoCampaignDraftError extends Error{
 constructor(readonly code:"NOT_READY"|"NO_RECIPIENTS"|"INVALID_SELECTION"){super(code);}
}
async function scope(context:RequestContext){
 const member=context.membership;
 if(!member||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE"||
  !hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 return requirePlacementManageScope(context,member.collegeId);
}
export async function tpoCampaignDraftStorageReady(){
 if(process.env["DB09_TPO_API_READY"]!=="DB09_VERIFIED")return false;
 try{
  const check=await getDb().execute<{ready:boolean}>(sql`select
   to_regclass('public.placement_tpo_campaign_drafts') is not null as ready`);
  return check.rows[0]?.ready===true;
 }catch{return false;}
}
/** An immutable, tenant-scoped audience snapshot. No email dispatch here. */
export async function createTpoCampaignDraft(context:RequestContext,raw:unknown){
 const input=tpoCampaignDraftSchema.parse(raw);
 const college=await scope(context);
 if(!await tpoCampaignDraftStorageReady())throw new TpoCampaignDraftError("NOT_READY");
 const key=resolveTpoCampaignRecipientSecret(process.env);
 if(Buffer.byteLength(key,"utf8")<32)throw new TpoCampaignDraftError("NOT_READY");
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
    collegeId:college.id,organizationId:college.organizationId,
  });
  const contacts=await tx.select({
   id:placementTpoLeads.id,emailNorm:placementTpoLeads.emailNorm,
   unsubscribedAt:placementTpoLeads.unsubscribedAt,
   inviteBouncedAt:placementTpoLeads.inviteBouncedAt,
   manualStage:placementTpoLeads.manualStage,
   ownerMembershipId:placementTpoLeads.ownerMembershipId,
  }).from(placementTpoLeads).where(eq(placementTpoLeads.collegeId,college.id));
  const selectedIds=input.selectedLeadIds?.length?new Set(input.selectedLeadIds):null;
  const subset=contacts.filter(row=>
    (!selectedIds||selectedIds.has(row.id)) && (
    input.segment==="NEW"?row.manualStage==="NEW":
    input.segment==="UNASSIGNED"?row.ownerMembershipId===null:true));
  if(selectedIds&&subset.length!==selectedIds.size)
   throw new TpoCampaignDraftError("INVALID_SELECTION");
  if(input.body.length>4000){
   const migrated=await tx.execute<{ready:boolean}>(sql`
    select exists(select 1 from pg_constraint
      where conname='tpo_campaign_draft_body_ck'
       and pg_get_constraintdef(oid) like '%10000%') as ready`);
   if(!migrated.rows[0]?.ready)throw new TpoCampaignDraftError("NOT_READY");
  }
  const snapshot=planTpoCampaignRecipients(subset);
  if(!snapshot.recipientIds.length)throw new TpoCampaignDraftError("NO_RECIPIENTS");
  const [campaign]=await tx.insert(placementTpoEmailCampaigns).values({
   collegeId:college.id,createdByUserId:context.user.id,status:"DRAFT",
   totalRecipients:snapshot.recipientIds.length,
  }).returning({id:placementTpoEmailCampaigns.id});
  if(!campaign)throw new TpoCampaignDraftError("NOT_READY");
   await tx.execute(sql`insert into placement_tpo_campaign_drafts
    (campaign_id,college_id,title,subject,body,template_key,segment,created_by_user_id,suppression_counts,sender_name,suppressed_counts)
    values(${campaign.id}::uuid,${college.id}::uuid,${input.title}::varchar,
     ${input.subject}::varchar,${input.body}::text,${input.templateKey}::varchar,
     ${input.segment}::varchar,${context.user.id}::uuid,${JSON.stringify(snapshot.suppressed)}::jsonb,
     coalesce((select left(u.display_name,200) from users u where u.id=${context.user.id}::uuid),'Placement cell')::varchar,
     ${JSON.stringify(snapshot.suppressed)}::jsonb)`);
  const emails=new Map(subset.map(row=>[row.id,row.emailNorm]));
  await tx.insert(placementTpoEmailCampaignRecipients).values(
   snapshot.recipientIds.map(leadId=>({
    collegeId:college.id,campaignId:campaign.id,leadId,
    recipientKey:issueTpoCampaignEmailRecipientKey(emails.get(leadId)??"",key),
    status:"PENDING",
   })),
  );
  return {campaignId:campaign.id,recipients:snapshot.recipientIds.length,
    suppressed:snapshot.suppressed,status:"DRAFT" as const};
 });
}
export async function listTpoCampaignDrafts(context:RequestContext){
 const college=await scope(context);
 if(!await tpoCampaignDraftStorageReady())return {ready:false as const,rows:[]};

 const rows=await getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  return tx.execute<{
  campaign_id:string;title:string;subject:string;segment:string;status:string;
  total_recipients:number;created_at:Date;created_by_user_id:string;sender_name:string;suppressed_counts:Record<string,number>;
  sent:number;failed:number;skipped:number;
 }>(sql`select d.campaign_id,d.title,d.subject,d.segment,c.status,
    c.total_recipients,d.created_at,d.created_by_user_id,coalesce((select u.display_name from users u where u.id=d.created_by_user_id),'Placement cell') as sender_name,
    d.suppression_counts as suppressed_counts,
    (select count(*)::integer from placement_tpo_email_campaign_recipients r
      where r.campaign_id=c.id and r.status='SENT') as sent,
    (select count(*)::integer from placement_tpo_email_campaign_recipients r
      where r.campaign_id=c.id and r.status='FAILED') as failed,
    (select count(*)::integer from placement_tpo_email_campaign_recipients r
      where r.campaign_id=c.id and r.status like 'SKIPPED_%') as skipped from placement_tpo_campaign_drafts d
    join placement_tpo_email_campaigns c on c.id=d.campaign_id
     and c.college_id=d.college_id
    where d.college_id=${college.id}::uuid
    -- Imported integer campaign IDs are not chronological UUIDs; use stable
    -- created_at then campaign_id ordering after migration.
    order by d.created_at desc,d.campaign_id desc limit 100`);
 });
 // An older campaign list used recipients/sentBy, while the new table owns
 // total_recipients/sender_name. Keep both names on read only; never infer
 // carrier delivery from provider acceptance.
 return {ready:true as const,rows:rows.rows.map(row=>({...row,
  recipients:row.total_recipients,sentBy:row.sender_name,
  campaignId:row.campaign_id,createdAt:row.created_at,createdByUserId:row.created_by_user_id,
 }))};
}

/** Read-only detail; no recipient contact data is returned. */
export async function getTpoCampaignDraft(context:RequestContext,rawId:unknown){
 const parsed=z.string().uuid().safeParse(rawId);
 if(!parsed.success)return null;
 const college=await scope(context);
 if(!await tpoCampaignDraftStorageReady())return null;

 const result=await getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  return tx.execute<{
   campaign_id:string;title:string;subject:string;body:string;template_key:string;
   segment:string;status:string;total_recipients:number;created_at:Date;
   sender_name:string;suppressed_counts:Record<string,number>;sent:number;failed:number;skipped:number;
 }>(sql`select d.campaign_id,d.title,d.subject,d.body,d.template_key,d.segment,
   c.status,c.total_recipients,d.created_at,coalesce((select u.display_name from users u where u.id=d.created_by_user_id),'Placement cell') as sender_name,
    d.suppression_counts as suppressed_counts,
   (select count(*)::integer from placement_tpo_email_campaign_recipients r where r.campaign_id=c.id and r.status='SENT') as sent,
   (select count(*)::integer from placement_tpo_email_campaign_recipients r where r.campaign_id=c.id and r.status='FAILED') as failed,
   (select count(*)::integer from placement_tpo_email_campaign_recipients r where r.campaign_id=c.id and r.status like 'SKIPPED_%') as skipped from placement_tpo_campaign_drafts d
   join placement_tpo_email_campaigns c on c.id=d.campaign_id
    and c.college_id=d.college_id
   where d.college_id=${college.id}::uuid and d.campaign_id=${parsed.data}::uuid limit 1`);
 });
 return result.rows[0]??null;
}

/** TPO-campaigns-public-12: read a bounded, college-scoped recipient status
 * list. Names are already visible in Engage; do not project email addresses,
 * recipient HMACs, token values, body variables or provider credentials.
 */
export async function listTpoCampaignRecipientStatuses(context:RequestContext,rawId:unknown){
 const id=z.string().uuid().parse(rawId);
 const college=await scope(context);
 if(!await tpoCampaignDraftStorageReady())return {ready:false as const,rows:[]};
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const [campaign]=await tx.select({id:placementTpoEmailCampaigns.id})
   .from(placementTpoEmailCampaigns).where(and(
    eq(placementTpoEmailCampaigns.id,id),
    eq(placementTpoEmailCampaigns.collegeId,college.id),
   )).limit(1);
  if(!campaign)return {ready:false as const,rows:[]};
  const rows=await tx.select({
   id:placementTpoEmailCampaignRecipients.id,
   leadId:placementTpoEmailCampaignRecipients.leadId,
   name:placementTpoLeads.name,
   status:placementTpoEmailCampaignRecipients.status,
  }).from(placementTpoEmailCampaignRecipients)
   .innerJoin(placementTpoLeads,and(
    eq(placementTpoLeads.id,placementTpoEmailCampaignRecipients.leadId),
    eq(placementTpoLeads.collegeId,placementTpoEmailCampaignRecipients.collegeId),
   ))
   .where(and(eq(placementTpoEmailCampaignRecipients.collegeId,college.id),
    eq(placementTpoEmailCampaignRecipients.campaignId,campaign.id)))
   .orderBy(asc(placementTpoLeads.name),asc(placementTpoEmailCampaignRecipients.id))
   .limit(501);
  return {ready:true as const,rows:rows.slice(0,500),hasMore:rows.length>500};
 });
}
