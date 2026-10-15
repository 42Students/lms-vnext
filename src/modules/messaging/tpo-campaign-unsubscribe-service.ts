import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads,placementTpoLeadActivities} from "@/db/schema/tpo-crm";
import {placementTpoEmailRecipientsStaged} from "./tpo-campaign-staged-schema";
import {verifyTpoCampaignRecipientToken,campaignUnsubscribeDecision} from "./tpo-campaign-recipient-token";

export class CampaignUnsubscribeInvalid extends Error {
  constructor(){super("CAMPAIGN_UNSUBSCRIBE_INVALID");this.name="CampaignUnsubscribeInvalid";}
}

/** T-S2-04: STAGED, NOT ROUTED.
 * The campaign tables and delivery provider must be registered first.
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
    const [row]=await tx.select().from(placementTpoEmailRecipientsStaged)
      .where(and(
        eq(placementTpoEmailRecipientsStaged.id,claim.recipientId),
        eq(placementTpoEmailRecipientsStaged.collegeId,claim.collegeId),
        eq(placementTpoEmailRecipientsStaged.campaignId,claim.campaignId),
      )).for("update").limit(1);
    if(!row)return "DENY";
    const decision=campaignUnsubscribeDecision(claim,row);
    if(decision!=="APPLY")return decision;
    const now=new Date();
    const [changed]=await tx.update(placementTpoEmailRecipientsStaged)
      .set({unsubscribedAt:now,status:"UNSUBSCRIBED"})
      .where(and(
        eq(placementTpoEmailRecipientsStaged.id,row.id),
        isNull(placementTpoEmailRecipientsStaged.unsubscribedAt),
      )).returning({id:placementTpoEmailRecipientsStaged.id});
    if(!changed)return "DENY";
    const [lead]=await tx.update(placementTpoLeads)
      .set({unsubscribedAt:now,updatedAt:now})
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
