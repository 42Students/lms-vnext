import "server-only";
import {z} from "zod";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads} from "@/db/schema/tpo-crm";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {engageAudienceQuerySchema,summarizeEngageAudience} from "./engage-audience-model";
import {planTpoCampaignRecipients} from "./tpo-campaign-send-policy";

const selectedCampaignPreviewSchema=z.strictObject({
 selectedLeadIds:z.array(z.string().uuid()).min(1).max(100)
  .refine(ids=>new Set(ids).size===ids.length,"Select different recruiter leads"),
});
/** Count-only preview; no emails leave this service. A send requires separate revalidation. */
export async function previewEngageCampaignAudience(context:RequestContext,raw:unknown={}){
 const collegeId=context.membership?.collegeId;
 if(!collegeId||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,collegeId);
 const query=engageAudienceQuerySchema.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const contacts=await tx.select({
   id:placementTpoLeads.id,emailNorm:placementTpoLeads.emailNorm,
   manualStage:placementTpoLeads.manualStage,ownerMembershipId:placementTpoLeads.ownerMembershipId,
   unsubscribedAt:placementTpoLeads.unsubscribedAt,inviteBouncedAt:placementTpoLeads.inviteBouncedAt,
  }).from(placementTpoLeads).where(eq(placementTpoLeads.collegeId,college.id));
  return summarizeEngageAudience(contacts,query.segment);
 });
}

/** Count-only, tenant-scoped projection of the exact Engage selection.
 * Preview is advisory; the draft save and any future send recheck suppression.
 */
export async function previewSelectedTpoCampaignAudience(context:RequestContext,raw:unknown){
 const query=selectedCampaignPreviewSchema.parse(raw);
 const collegeId=context.membership?.collegeId;
 if(!collegeId||!hasMembershipRole(context,"TPO"))throw new AuthorizationError("placements.manage");
 const college=await requirePlacementManageScope(context,collegeId);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:college.organizationId,collegeId:college.id,
  });
  const selected=new Set(query.selectedLeadIds);
  const contacts=await tx.select({
   id:placementTpoLeads.id,emailNorm:placementTpoLeads.emailNorm,
   manualStage:placementTpoLeads.manualStage,ownerMembershipId:placementTpoLeads.ownerMembershipId,
   unsubscribedAt:placementTpoLeads.unsubscribedAt,inviteBouncedAt:placementTpoLeads.inviteBouncedAt,
  }).from(placementTpoLeads).where(eq(placementTpoLeads.collegeId,college.id));
  const subset=contacts.filter(row=>selected.has(row.id));
  const plan=planTpoCampaignRecipients(subset);
  const unavailable=query.selectedLeadIds.length-subset.length;
  return {
   selected:query.selectedLeadIds.length,
   eligible:plan.recipientIds.length,
   leftOut:query.selectedLeadIds.length-plan.recipientIds.length,
   suppressed:plan.suppressed,
   unavailable,
  };
 });
}
