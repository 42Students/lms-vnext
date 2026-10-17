import "server-only";
import {randomUUID} from "node:crypto";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementTpoEmailCampaigns,placementTpoEmailCampaignRecipients,placementTpoLeads,placementTpoLeadActivities,placementTpoCompanyCommunication} from "@/db/schema";
import {messagingDeliveryBatches,messagingDeliveryReceipts} from "@/db/schema/messaging-receipts";
import {tpoCompanyKey} from "@/modules/placements/tpo-company-memory-service";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {readOutboundProviderConfig,createOutboundProvider} from "./providers";
import {issueTpoCampaignRecipientToken} from "./tpo-campaign-recipient-token";
import {campaignRecipientDisposition} from "./tpo-campaign-send-policy";
import {tpoCampaignDraftStorageReady,getTpoCampaignDraft} from "./tpo-campaign-draft-service";
import {previewTpoCampaignText} from "./tpo-campaign-draft-model";
import {isCampaignTemplateKey} from "./template-boundary-model";
import {canContactRecipientAtRuntime} from "./runtime-safety";

export class TpoCampaignDispatchError extends Error{
 constructor(readonly code:"NOT_READY"|"ALREADY_STARTED"|"NOT_FOUND"){super(code);}
}
function configuration(){
 const provider=process.env.TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY??"";
 const key=process.env.TPO_CAMPAIGN_RECIPIENT_TOKEN_SECRET??"";
 const origin=process.env.APP_PUBLIC_URL??"";
 let url:URL;
 try{url=new URL(origin);}catch{throw new TpoCampaignDispatchError("NOT_READY");}
 if(process.env.TPO_CAMPAIGNS_READY!=="VERIFIED"||
   !isCampaignTemplateKey(provider)||provider===process.env.ZEPTOMAIL_OTP_TEMPLATE_KEY||
   !process.env.ZEPTOMAIL_TOKEN||Buffer.byteLength(key,"utf8")<32||
   url.protocol!=="https:"||url.username||url.password||url.search||url.hash)
   throw new TpoCampaignDispatchError("NOT_READY");
 return {provider,key,origin:url.origin};
}
export async function tpoCampaignDispatchReady(){
 try{
  configuration();
  return await tpoCampaignDraftStorageReady();
 }catch{return false;}
}

/**
 * At most one actor can claim DRAFT. Individual recipients transition
 * PENDING -> QUEUED before a network request. A crash leaves QUEUED unknown;
 * it cannot resend automatically and double-email the recruiter.
 */
export async function dispatchTpoCampaign(context:RequestContext,rawId:unknown){
 const id=z.string().uuid().parse(rawId);
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||member.status!=="ACTIVE"||
  context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,member.collegeId);
 const config=configuration();
 if(!await tpoCampaignDraftStorageReady())throw new TpoCampaignDispatchError("NOT_READY");
 const draft=await getTpoCampaignDraft(context,id);
 if(!draft)throw new TpoCampaignDispatchError("NOT_FOUND");
 const db=getDb();
 const claimed=await db.transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   collegeId:college.id,organizationId:college.organizationId,
  });
  const [campaign]=await tx.update(placementTpoEmailCampaigns).set({status:"SENDING"})
   .where(and(eq(placementTpoEmailCampaigns.id,id),
    eq(placementTpoEmailCampaigns.collegeId,college.id),
    eq(placementTpoEmailCampaigns.status,"DRAFT")))
   .returning({id:placementTpoEmailCampaigns.id});
  if(campaign)await tx.insert(messagingDeliveryBatches).values({
   id,organizationId:college.organizationId,collegeId:college.id,
   actorUserId:context.user.id,purpose:("TPO email: "+draft.subject).slice(0,160),
   total:draft.total_recipients,queued:0,sent:0,failed:0,suppressed:0,
  });
  return Boolean(campaign);
 });
 if(!claimed)throw new TpoCampaignDispatchError("ALREADY_STARTED");
 const rows=await db.select({
  id:placementTpoEmailCampaignRecipients.id,leadId:placementTpoEmailCampaignRecipients.leadId,
  email:placementTpoLeads.emailNorm,name:placementTpoLeads.name,
  company:placementTpoLeads.companyName,
  bouncedAt:placementTpoLeads.inviteBouncedAt,
  unsubscribedAt:placementTpoLeads.unsubscribedAt,
  manualStage:placementTpoLeads.manualStage,
 }).from(placementTpoEmailCampaignRecipients)
 .innerJoin(placementTpoLeads,and(
   eq(placementTpoLeads.id,placementTpoEmailCampaignRecipients.leadId),
   eq(placementTpoLeads.collegeId,placementTpoEmailCampaignRecipients.collegeId)))
 .where(and(eq(placementTpoEmailCampaignRecipients.collegeId,college.id),
  eq(placementTpoEmailCampaignRecipients.campaignId,id),
  eq(placementTpoEmailCampaignRecipients.status,"PENDING")))
 .limit(500);
 const outbound=createOutboundProvider(readOutboundProviderConfig({
  [draft.template_key]:{zeptoTemplateKey:config.provider},
 }));
 const totals={sent:0,failed:0,skipped:0};
 for(const row of rows){
  const disposition=campaignRecipientDisposition({
   emailNorm:row.email,unsubscribedAt:row.unsubscribedAt,
   inviteBouncedAt:row.bouncedAt,manualStage:row.manualStage,
  });
  const skipped=disposition!=="ELIGIBLE" ||
   !canContactRecipientAtRuntime("EMAIL",row.email??"");
  const preliminary=skipped?
   disposition==="NO_EMAIL"?"SKIPPED_NO_EMAIL":"SKIPPED_UNSUBSCRIBED":"QUEUED";
  const [claimedRecipient]=await db.update(placementTpoEmailCampaignRecipients)
   .set({status:preliminary})
   .where(and(eq(placementTpoEmailCampaignRecipients.id,row.id),
    eq(placementTpoEmailCampaignRecipients.collegeId,college.id),
    eq(placementTpoEmailCampaignRecipients.campaignId,id),
    eq(placementTpoEmailCampaignRecipients.status,"PENDING")))
   .returning({id:placementTpoEmailCampaignRecipients.id});
  if(!claimedRecipient)continue;
  if(skipped){totals.skipped++;continue;}
  const token=issueTpoCampaignRecipientToken({
   v:1,collegeId:college.id,campaignId:id,recipientId:row.id,
   expiresAt:Date.now()+180*24*60*60*1000,
  },config.key);
  const result=await outbound.send({
   channel:"EMAIL",recipient:row.email!,
   templateKey:draft.template_key,
   purpose:"tpo-recruiter-campaign:"+id,
   variables:{
    subject:draft.subject,
    body:previewTpoCampaignText(draft.body,{
      name:row.name,company:row.company??"",
    }),
    name:row.name,company:row.company??"",
    unsubscribeUrl:config.origin+"/campaign-unsubscribe/"+encodeURIComponent(token),
   },
  });
  await db.update(placementTpoEmailCampaignRecipients).set({
   status:result?"SENT":"FAILED",sentAt:result?new Date():null,
  }).where(and(eq(placementTpoEmailCampaignRecipients.id,row.id),
   eq(placementTpoEmailCampaignRecipients.status,"QUEUED"),
   eq(placementTpoEmailCampaignRecipients.collegeId,college.id)));
  if(result){
   await db.transaction(async tx=>{
    await tx.insert(placementTpoLeadActivities).values({
     collegeId:college.id,leadId:row.leadId,type:"EMAIL",isSystem:true,
     note:"Campaign: "+draft.subject.slice(0,180),createdAt:new Date(),
    });
    const key=tpoCompanyKey(row.company);
    if(key){
     await tx.insert(placementTpoCompanyCommunication).values({
      collegeId:college.id,companyKey:key,status:"EMAILED",
      updatedByUserId:context.user.id,
     }).onConflictDoUpdate({
      target:[placementTpoCompanyCommunication.collegeId,
       placementTpoCompanyCommunication.companyKey],
      set:{status:"EMAILED",updatedByUserId:context.user.id,updatedAt:new Date()},
      setWhere:eq(placementTpoCompanyCommunication.status,"NOT_CONTACTED"),
     });
    }
   });
   totals.sent++;
  }else totals.failed++;
 }
 // Record only actual recipient statuses; never store addresses or messages.
 // An interrupted send remains unfinalized and cannot silently be retried.
 await db.transaction(async tx=>{
  const outcomes=await tx.select({
   recipientKey:placementTpoEmailCampaignRecipients.recipientKey,
   status:placementTpoEmailCampaignRecipients.status,
  }).from(placementTpoEmailCampaignRecipients).where(and(
   eq(placementTpoEmailCampaignRecipients.collegeId,college.id),
   eq(placementTpoEmailCampaignRecipients.campaignId,id),
  )).limit(500);
  const purpose=("TPO email: "+draft.subject).slice(0,160);
  const receipts=outcomes.map(row=>{
   const suppressed=row.status.startsWith("SKIPPED_")||row.status==="UNSUBSCRIBED";
   const status=row.status==="SENT"?"SENT" as const:
    row.status==="FAILED"?"FAILED" as const:
    suppressed?"SUPPRESSED" as const:"QUEUED" as const;
   return {id:randomUUID(),batchId:id,recipientKey:row.recipientKey,
    channel:"EMAIL",templateKey:draft.template_key,purpose,status,
    reason:suppressed?(row.status==="SKIPPED_NO_EMAIL"?"invalid-recipient":"unsubscribed"):null};
  });
  if(receipts.length)await tx.insert(messagingDeliveryReceipts).values(receipts);
  const count=(status:"SENT"|"FAILED"|"SUPPRESSED"|"QUEUED")=>
   receipts.filter(row=>row.status===status).length;
  await tx.update(messagingDeliveryBatches).set({
   queued:count("QUEUED"),sent:count("SENT"),failed:count("FAILED"),
   suppressed:count("SUPPRESSED"),finalizedAt:new Date(),
  }).where(and(eq(messagingDeliveryBatches.id,id),
   eq(messagingDeliveryBatches.collegeId,college.id),
   eq(messagingDeliveryBatches.organizationId,college.organizationId)));
  await tx.update(placementTpoEmailCampaigns).set({status:"SENT"})
   .where(and(eq(placementTpoEmailCampaigns.collegeId,college.id),
     eq(placementTpoEmailCampaigns.id,id),
     eq(placementTpoEmailCampaigns.status,"SENDING")));
 });
 return totals;
}
