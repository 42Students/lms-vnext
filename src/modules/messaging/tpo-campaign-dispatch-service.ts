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
import {readZeptoMailConfig,isSecureMailProviderEndpoint} from "@/modules/notifications/zeptomail-email";
import {issueTpoCampaignRecipientToken,resolveTpoCampaignRecipientSecret,matchesTpoCampaignEmailRecipientKey} from "./tpo-campaign-recipient-token";
import {campaignRecipientDisposition,campaignRecipientStillMatchesSnapshot} from "./tpo-campaign-send-policy";
import {tpoCampaignDraftStorageReady,getTpoCampaignDraft} from "./tpo-campaign-draft-service";
import {previewTpoCampaignText} from "./tpo-campaign-draft-model";
import {isCampaignTemplateKey} from "./template-boundary-model";
import {canContactRecipientAtRuntime} from "./runtime-safety";
import {verifiedTpoCampaignPublicOrigin} from "./tpo-campaign-legacy-compat";

export class TpoCampaignDispatchError extends Error{
 constructor(readonly code:"NOT_READY"|"ALREADY_STARTED"|"NOT_FOUND"){super(code);}
}
function configuration(){
 const provider=process.env.TPO_CAMPAIGN_ZEPTO_TEMPLATE_KEY??"";
 const mail=readZeptoMailConfig();
 const key=resolveTpoCampaignRecipientSecret(process.env);
 const origin=verifiedTpoCampaignPublicOrigin(process.env.APP_PUBLIC_URL??"");
 if(!origin)throw new TpoCampaignDispatchError("NOT_READY");
 if(process.env.TPO_CAMPAIGNS_READY!=="VERIFIED"||
   !isCampaignTemplateKey(provider)||provider===mail.otpTemplateKey||
   !mail.token.trim()||!isSecureMailProviderEndpoint(mail.apiUrl)||
   Buffer.byteLength(key,"utf8")<32)
   throw new TpoCampaignDispatchError("NOT_READY");
 return {provider,key,origin};
}
/** Import-only translation. Historical campaigns are never replayed to send again. */
export function translateLegacyCampaignRecipientStatus(status:string):{
  status:"SENT"|"FAILED"|"SKIPPED_NO_EMAIL"|"SKIPPED_UNSUBSCRIBED";
  reason:string|null;
} {
 switch(status.toUpperCase()){
  case "SENT":return {status:"SENT",reason:null};
  case "NO_EMAIL":return {status:"SKIPPED_NO_EMAIL",reason:"invalid-recipient"};
  case "UNSUBSCRIBED":return {status:"SKIPPED_UNSUBSCRIBED",reason:"unsubscribed"};
  case "NOT_CONFIGURED":return {status:"FAILED",reason:"provider-not-configured"};
  case "NOT_FOUND":return {status:"SKIPPED_UNSUBSCRIBED",reason:"lead-not-found"};
  default:return {status:"FAILED",reason:"legacy-send-failed"};
 }
}
export async function tpoCampaignDispatchPreflight():Promise<{
 ready:boolean;message:string;maximumRecipients:500;
}>{
 const ready=await tpoCampaignDispatchReady();
 return {ready,maximumRecipients:500,
  message:ready?"Email campaign delivery is configured.":
  "Email campaigns are unavailable. Verify ZeptoMail settings, the approved template, public HTTPS URL and campaign migrations before sending."};
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
 // Provider readiness is tenant-independent; refuse disabled delivery
 // before touching college storage, while still denying unauthenticated roles.
 const config=configuration();
 const college=await requirePlacementManageScope(context,member.collegeId);
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
  recipientKey:placementTpoEmailCampaignRecipients.recipientKey,
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
  // The draft HMAC must still describe this exact address. A change made
  // after draft creation must not redirect the send to an unselected contact.
  const matchesDraft=matchesTpoCampaignEmailRecipientKey(row.recipientKey,row.email,config.key);
  const skipped=disposition!=="ELIGIBLE" || !matchesDraft ||
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
  // A queued snapshot is not live consent. Recheck the college-scoped lead
  // immediately before an external send, including address changes since draft.
  // Missing or modified leads are suppressed, never silently rerouted.
  const [live]=await db.select({
   emailNorm:placementTpoLeads.emailNorm,
   unsubscribedAt:placementTpoLeads.unsubscribedAt,
   inviteBouncedAt:placementTpoLeads.inviteBouncedAt,
   manualStage:placementTpoLeads.manualStage,
  }).from(placementTpoLeads).where(and(
   eq(placementTpoLeads.id,row.leadId),
   eq(placementTpoLeads.collegeId,college.id),
  )).limit(1);
  const liveFact=live?{
   emailNorm:live.emailNorm,unsubscribedAt:live.unsubscribedAt,
   inviteBouncedAt:live.inviteBouncedAt,manualStage:live.manualStage,
  }:null;
  const matched=campaignRecipientStillMatchesSnapshot({
   emailNorm:row.email,unsubscribedAt:row.unsubscribedAt,
   inviteBouncedAt:row.bouncedAt,manualStage:row.manualStage,
  },liveFact);
  if(!matched||!canContactRecipientAtRuntime("EMAIL",liveFact?.emailNorm??"")){
   const skipStatus=liveFact&&campaignRecipientDisposition(liveFact)==="NO_EMAIL"
    ?"SKIPPED_NO_EMAIL" as const:"SKIPPED_UNSUBSCRIBED" as const;
   await db.update(placementTpoEmailCampaignRecipients).set({status:skipStatus})
    .where(and(eq(placementTpoEmailCampaignRecipients.id,row.id),
     eq(placementTpoEmailCampaignRecipients.campaignId,id),
     eq(placementTpoEmailCampaignRecipients.collegeId,college.id),
     eq(placementTpoEmailCampaignRecipients.status,"QUEUED")));
   totals.skipped++;
   continue;
  }
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
  const [persistedOutcome]=await db.update(placementTpoEmailCampaignRecipients).set({
   status:result?"SENT":"FAILED",sentAt:result?new Date():null,
  }).where(and(eq(placementTpoEmailCampaignRecipients.id,row.id),
   eq(placementTpoEmailCampaignRecipients.campaignId,id),
   eq(placementTpoEmailCampaignRecipients.status,"QUEUED"),
   eq(placementTpoEmailCampaignRecipients.collegeId,college.id)))
   .returning({id:placementTpoEmailCampaignRecipients.id});
  // Provider acceptance is not permission to claim a persisted SENT result.
  // A concurrent unsubscribe or lost QUEUED row leaves the outcome unknown,
  // so do not emit a success activity or finalize a misleading receipt.
  if(!persistedOutcome)throw new Error("CAMPAIGN_RECIPIENT_OUTCOME_UNCONFIRMED");
  if(result){
   await db.transaction(async tx=>{
    await tx.insert(placementTpoLeadActivities).values({
     collegeId:college.id,leadId:row.leadId,type:"EMAIL",isSystem:false,
     createdByUserId:context.user.id,
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
    reason:suppressed?(row.status==="SKIPPED_NO_EMAIL"?"invalid-recipient":
      row.status==="SKIPPED_UNSUBSCRIBED"?"unsubscribed":"already-unsubscribed"):null};
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
