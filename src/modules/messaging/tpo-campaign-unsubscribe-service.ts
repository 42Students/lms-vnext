import "server-only";
import {createHash} from "node:crypto";
import {and,asc,eq,isNull,sql} from "drizzle-orm";
import {activityEvents,colleges,collegeMemberships,membershipRoles,users,inAppNotifications} from "@/db/schema";
import {tpoCampaignUnsubscribeEvent} from "./tpo-campaign-unsubscribe-notification-model";
import {getDb} from "@/db/client";
import {placementTpoLeads,placementTpoLeadActivities,placementTpoEmailCampaignRecipients} from "@/db/schema/tpo-crm";
import {verifyTpoCampaignRecipientToken,campaignUnsubscribeDecision,resolveTpoCampaignRecipientSecret,legacyCampaignRecipientTokenDigest,matchesTpoCampaignEmailRecipientKey} from "./tpo-campaign-recipient-token";
import {deriveGlobalEmailSuppressionHashForAddress} from "@/modules/operations/outbound-delivery-envelope";
import {GlobalEmailSuppressionUnavailable,persistVerifiedGlobalEmailSuppression} from "@/modules/operations/global-email-suppression-service";

export class CampaignUnsubscribeInvalid extends Error {
  constructor(){super("CAMPAIGN_UNSUBSCRIBE_INVALID");this.name="CampaignUnsubscribeInvalid";}
}

/** T-S2-04: routed for verified signed recipient opt-outs.
 * Campaign delivery still requires a provider and allowlist-approved send path.
 * A signed link alone cannot switch identities; live recipient rows are locked
 * and tied to the matching college, campaign and lead before any update.
 */
export async function unsubscribeTpoCampaignRecipient(
  token:string,
):Promise<{unsubscribed:true}>{
  // Verify the purpose-bound recipient token before touching the database.
  // Untrusted or malformed links must not trigger a privileged storage probe.
  const key=resolveTpoCampaignRecipientSecret(process.env);
  const claim=verifyTpoCampaignRecipientToken(token,key,Date.now());
  // A legacy recipient link was an opaque token stored only as SHA256.
  // Migrated recipient records carry the historical digest separately.
  // Unknown and already-used links receive the same confirmation to avoid
  // exposing whether an email address or campaign ever existed.
  // A legacy public campaign link is opaque and is resolved solely by its
  // migrated SHA-256 digest, never by an address, token prefix or numeric ID.
  // Both a missing digest and a reused digest return the same safe success.
  const legacyCandidate=!claim && typeof token==="string" &&
    legacyCampaignRecipientTokenDigest(token)!==null;
  if(!claim && !legacyCandidate)return {unsubscribed:true};
  const legacyHash=legacyCandidate?createHash("sha256").update(token).digest("hex"):null;
  const db=getDb();
  const registered=await db.execute<{ready:boolean}>(sql`select to_regclass('public.placement_tpo_email_campaign_recipients') is not null as ready`);
  if(registered.rows[0]?.ready!==true)throw new Error('TPO_CAMPAIGNS_NOT_REGISTERED');
  const recipientScope=claim?and(
    eq(placementTpoEmailCampaignRecipients.id,claim.recipientId),
    eq(placementTpoEmailCampaignRecipients.collegeId,claim.collegeId),
    eq(placementTpoEmailCampaignRecipients.campaignId,claim.campaignId),
  ):eq(placementTpoEmailCampaignRecipients.legacyUnsubscribeSha256,legacyHash!);
  // A purpose-bound recipient link is proof only for its persisted campaign
  // identity, never for an arbitrary email string from the caller. Resolve
  // the current recipient email through its same-college lead relationship,
  // then require that it still matches the immutable campaign snapshot key.
  //
  // Persist the verified global opt-out BEFORE the local CRM transaction:
  // the shared writer uses its own atomic outbox transaction, and writing
  // globally first prevents a local success from masquerading as a completed
  // global opt-out when cancellation/storage is unavailable. Global success
  // followed by a local failure conservatively keeps that email suppressed;
  // a retry safely completes the per-campaign state.
  let globalSnapshotProof:{recipientKey:string;leadId:string}|null=null;
  const globalKey=process.env["DB10_GLOBAL_EMAIL_HMAC_KEY_BASE64"]??"";
  if(globalKey){
    const [recipient]=await db.select({
      recipientKey:placementTpoEmailCampaignRecipients.recipientKey,
      leadId:placementTpoEmailCampaignRecipients.leadId,
      email:placementTpoLeads.emailNorm,
    }).from(placementTpoEmailCampaignRecipients)
      .innerJoin(placementTpoLeads,and(
        eq(placementTpoLeads.id,placementTpoEmailCampaignRecipients.leadId),
        eq(placementTpoLeads.collegeId,placementTpoEmailCampaignRecipients.collegeId),
      ))
      .where(recipientScope)
      .orderBy(asc(placementTpoEmailCampaignRecipients.createdAt),
        asc(placementTpoEmailCampaignRecipients.id)).limit(1);
    if(recipient?.email && matchesTpoCampaignEmailRecipientKey(
      recipient.recipientKey,recipient.email,key,
    )){
      // Never acknowledge a verified recipient's opt-out when the configured
      // global HMAC cannot be derived. No email is logged or persisted here.
      let recipientHash:string;
      try{
        recipientHash=deriveGlobalEmailSuppressionHashForAddress(recipient.email,globalKey);
      }catch{
        throw new GlobalEmailSuppressionUnavailable();
      }
      await persistVerifiedGlobalEmailSuppression({
        recipientHash,reason:"UNSUBSCRIBED",
      });
      globalSnapshotProof={
        recipientKey:recipient.recipientKey,leadId:recipient.leadId,
      };
    }
    // When a lead's address no longer matches the campaign's original
    // recipientKey, we cannot prove the old email identity. Do NOT suppress
    // an unrelated replacement address. The local signed opt-out remains
    // valid and prevents future TPO sends to that lead.
  }
  const outcome=await db.transaction(async tx=>{
    const [row]=await tx.select().from(placementTpoEmailCampaignRecipients)
      .where(recipientScope)
      .orderBy(asc(placementTpoEmailCampaignRecipients.createdAt),
        asc(placementTpoEmailCampaignRecipients.id))
      .for("update").limit(1);
    if(!row)return "ALREADY";
    // The global proof was derived for this locked recipient snapshot.
    // If another actor repointed a campaign recipient between the verified
    // preflight and this row lock, do not apply their opt-out to a different
    // CRM lead after having suppressed the original email.
    if(globalSnapshotProof && (
      row.recipientKey!==globalSnapshotProof.recipientKey ||
      row.leadId!==globalSnapshotProof.leadId
    ))throw new GlobalEmailSuppressionUnavailable();
    const decision=claim?campaignUnsubscribeDecision(claim,row):
      row.unsubscribedAt?"ALREADY":"APPLY";
    if(decision!=="APPLY")return decision;
    const now=new Date();
    const [changed]=await tx.update(placementTpoEmailCampaignRecipients)
      .set({unsubscribedAt:now,status:"UNSUBSCRIBED"})
      .where(and(
        eq(placementTpoEmailCampaignRecipients.id,row.id),
        isNull(placementTpoEmailCampaignRecipients.unsubscribedAt),
      )).returning({id:placementTpoEmailCampaignRecipients.id});
    if(!changed)return "ALREADY";
    // DB09 placement_tpo_leads_invite_lifecycle_ck requires a token to be
    // cleared when the lead opts out. This also prevents new OTP delivery.
    const [lead]=await tx.update(placementTpoLeads)
      .set({unsubscribedAt:now,inviteTokenHash:null,updatedAt:now})
      .where(and(
        eq(placementTpoLeads.id,row.leadId),
        eq(placementTpoLeads.collegeId,row.collegeId),
        isNull(placementTpoLeads.unsubscribedAt),
      )).returning({id:placementTpoLeads.id,name:placementTpoLeads.name});
    // A campaign recipient opt-out suppresses every still-unclaimed campaign
    // for this same college+lead. In-flight QUEUED rows cannot be rewritten:
    // dispatch rechecks the live lead before provider contact and leaves any
    // crash-ambiguous send for manual reconciliation, never automatic replay.
    await tx.update(placementTpoEmailCampaignRecipients)
      .set({status:"SKIPPED_UNSUBSCRIBED"})
      .where(and(
        eq(placementTpoEmailCampaignRecipients.collegeId,row.collegeId),
        eq(placementTpoEmailCampaignRecipients.leadId,row.leadId),
        eq(placementTpoEmailCampaignRecipients.status,"PENDING"),
      ));
    // Invite creation and dispatch also consult the lead's unsubscribedAt.
    // Only the first successful lead-level opt-out emits a TPO bell/CRM
    // activity, so concurrent campaign and invite links never spam officers.
    if(lead){
      const eventCopy=tpoCampaignUnsubscribeEvent(lead.name,row.leadId);
      await tx.insert(placementTpoLeadActivities).values({
        collegeId:row.collegeId,leadId:row.leadId,
        type:"SYSTEM",isSystem:true,note:eventCopy.timeline,
        createdAt:now,
      });
      const [college]=await tx.select({organizationId:colleges.organizationId})
        .from(colleges).where(eq(colleges.id,row.collegeId)).limit(1);
      if(college){
        const [event]=await tx.insert(activityEvents).values({
          organizationId:college.organizationId,collegeId:row.collegeId,
          module:"PLACEMENTS",eventType:eventCopy.eventType,
          subjectType:"placement_tpo_lead",subjectId:row.leadId,
          subjectLabel:lead.name,summary:eventCopy.summary,
          metadata:{campaignId:row.campaignId,recipientId:row.id},
          occurredAt:now,
        }).returning({id:activityEvents.id});
        if(event){
          const officers=await tx.selectDistinct({userId:collegeMemberships.userId})
            .from(collegeMemberships)
            .innerJoin(membershipRoles,eq(membershipRoles.membershipId,collegeMemberships.id))
            .innerJoin(users,eq(users.id,collegeMemberships.userId))
            .where(and(eq(collegeMemberships.collegeId,row.collegeId),
              eq(collegeMemberships.status,"ACTIVE"),eq(membershipRoles.role,"TPO"),
              eq(users.platformStatus,"ACTIVE")));
          if(officers.length)await tx.insert(inAppNotifications).values(officers.map(officer=>({
            eventId:event.id,userId:officer.userId,...eventCopy.notification,
          }))).onConflictDoNothing();
        }
      }
    }
    return "APPLY";
  });
  // A verified but invalid claim must never be reported as a completed opt-out.
  // Already-used or unknown legacy links retain their indistinguishable success.
  if(outcome==="DENY")throw new CampaignUnsubscribeInvalid();
  // Client-safe idempotency: unknown, repeated, and successful links have
  // identical outward responses. Do not leak whether a recruiter exists.
  void outcome;
  return {unsubscribed:true};
}
