import "server-only";
import {createHash} from "node:crypto";
import {and,asc,eq,isNull,sql} from "drizzle-orm";
import {activityEvents,colleges,collegeMemberships,membershipRoles,users,inAppNotifications} from "@/db/schema";
import {tpoCampaignUnsubscribeEvent} from "./tpo-campaign-unsubscribe-notification-model";
import {getDb} from "@/db/client";
import {placementTpoLeads,placementTpoLeadActivities,placementTpoEmailCampaignRecipients} from "@/db/schema/tpo-crm";
import {verifyTpoCampaignRecipientToken,campaignUnsubscribeDecision,resolveTpoCampaignRecipientSecret} from "./tpo-campaign-recipient-token";

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
  const legacyCandidate=!claim && typeof token==="string" &&
    token.length>0 && token.length<=200 && !token.includes(".");
  if(!claim && !legacyCandidate)return {unsubscribed:true};
  const legacyHash=legacyCandidate?createHash("sha256").update(token).digest("hex"):null;
  const db=getDb();
  const registered=await db.execute<{ready:boolean}>(sql`select to_regclass('public.placement_tpo_email_campaign_recipients') is not null as ready`);
  if(registered.rows[0]?.ready!==true)throw new Error('TPO_CAMPAIGNS_NOT_REGISTERED');
  const outcome=await db.transaction(async tx=>{
    const [row]=await tx.select().from(placementTpoEmailCampaignRecipients)
      .where(claim?and(
        eq(placementTpoEmailCampaignRecipients.id,claim.recipientId),
        eq(placementTpoEmailCampaignRecipients.collegeId,claim.collegeId),
        eq(placementTpoEmailCampaignRecipients.campaignId,claim.campaignId),
      ):eq(placementTpoEmailCampaignRecipients.legacyUnsubscribeSha256,legacyHash!))
      .orderBy(asc(placementTpoEmailCampaignRecipients.createdAt),
        asc(placementTpoEmailCampaignRecipients.id))
      .for("update").limit(1);
    if(!row)return "ALREADY";
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
    // Every scoped recipient FK must resolve to the same lead, even when
    // their unsubscribe flag was already recorded by another channel.
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
  if(outcome==="DENY")return {unsubscribed:true};
  return {unsubscribed:true};
}
