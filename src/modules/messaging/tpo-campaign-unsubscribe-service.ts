import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads,placementTpoLeadActivities,placementTpoEmailCampaignRecipients} from "@/db/schema/tpo-crm";
import {verifyTpoCampaignRecipientToken,campaignUnsubscribeDecision} from "./tpo-campaign-recipient-token";

export class CampaignUnsubscribeInvalid extends Error {
  constructor(){super("CAMPAIGN_UNSUBSCRIBE_INVALID");this.name="CampaignUnsubscribeInvalid";}
}

/** T-S2-04: NOT ROUTED (tables registered in migration 0095).
 * The delivery provider and TPO_CAMPAIGNS_READY gate must be approved first.
 * A signed link alone cannot switch identities; live recipient rows are locked
 * and tied to the matching college, campaign and lead before any update.
 */
export async function unsubscribeTpoCampaignRecipient(
  token:string,
):Promise<{unsubscribed:true}>{
  if(process.env.TPO_CAMPAIGNS_READY!=="VERIFIED"){
    throw new Error("TPO_CAMPAIGNS_NOT_REGISTERED");
  }
  const key=process.env.TPO_CAMPAIGN_RECIPIENT_HMAC_SECRET??"";
  const claim=verifyTpoCampaignRecipientToken(token,key,Date.now());
  if(!claim)throw new CampaignUnsubscribeInvalid();
  const db=getDb();
  const outcome=await db.transaction(async tx=>{
    const [row]=await tx.select().from(placementTpoEmailCampaignRecipients)
      .where(and(
        eq(placementTpoEmailCampaignRecipients.id,claim.recipientId),
        eq(placementTpoEmailCampaignRecipients.collegeId,claim.collegeId),
        eq(placementTpoEmailCampaignRecipients.campaignId,claim.campaignId),
      )).for("update").limit(1);
    if(!row)return "DENY";
    const decision=campaignUnsubscribeDecision(claim,row);
    if(decision!=="APPLY")return decision;
    const now=new Date();
    const [changed]=await tx.update(placementTpoEmailCampaignRecipients)
      .set({unsubscribedAt:now,status:"UNSUBSCRIBED"})
      .where(and(
        eq(placementTpoEmailCampaignRecipients.id,row.id),
        isNull(placementTpoEmailCampaignRecipients.unsubscribedAt),
      )).returning({id:placementTpoEmailCampaignRecipients.id});
    if(!changed)return "DENY";
    // DB09 placement_tpo_leads_invite_lifecycle_ck requires a token to be
    // cleared when the lead opts out. This also prevents new OTP delivery.
    const [lead]=await tx.update(placementTpoLeads)
      .set({unsubscribedAt:now,inviteTokenHash:null,updatedAt:now})
      .where(and(
        eq(placementTpoLeads.id,row.leadId),
        eq(placementTpoLeads.collegeId,row.collegeId),
        isNull(placementTpoLeads.unsubscribedAt),
      )).returning({id:placementTpoLeads.id});
    // Every scoped recipient FK must resolve to the same lead, even when
    // their unsubscribe flag was already recorded by another channel.
    if(lead){
      await tx.insert(placementTpoLeadActivities).values({
        collegeId:row.collegeId,leadId:row.leadId,
        type:"SYSTEM",isSystem:true,note:"Unsubscribed from campaign emails",
        createdAt:now,
      });
    }
    return "APPLY";
  });
  if(outcome==="DENY")throw new CampaignUnsubscribeInvalid();
  return {unsubscribed:true};
}
