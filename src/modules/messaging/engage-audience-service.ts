import "server-only";
import {z} from "zod";
import {eq,inArray,and,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads} from "@/db/schema/tpo-crm";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {engageAudienceQuerySchema} from "./engage-audience-model";
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
  const segment=query.segment==="NEW"?sql`${placementTpoLeads.manualStage} = 'NEW'`:
   query.segment==="UNASSIGNED"?sql`${placementTpoLeads.ownerMembershipId} is null`:sql`true`;
  const noUnsubscribe=sql`${placementTpoLeads.unsubscribedAt} is null`;
  const noBounce=sql`${placementTpoLeads.inviteBouncedAt} is null`;
  const noNotNow=sql`${placementTpoLeads.manualStage} <> 'NOT_NOW'`;
  const hasEmail=sql`${placementTpoLeads.emailNorm} is not null and ${placementTpoLeads.emailNorm} <> ''`;
  const [counts]=await tx.select({
   total:sql<number>`count(*)::integer`,
   outsideSegment:sql<number>`count(*) filter (where not (${segment}))::integer`,
   unsubscribed:sql<number>`count(*) filter (where ${segment} and not (${noUnsubscribe}))::integer`,
   bounced:sql<number>`count(*) filter (where ${segment} and ${noUnsubscribe} and not (${noBounce}))::integer`,
   notNow:sql<number>`count(*) filter (where ${segment} and ${noUnsubscribe} and ${noBounce} and not (${noNotNow}))::integer`,
   withoutEmail:sql<number>`count(*) filter (where ${segment} and ${noUnsubscribe} and ${noBounce} and ${noNotNow} and not (${hasEmail}))::integer`,
   eligible:sql<number>`count(*) filter (where ${segment} and ${noUnsubscribe} and ${noBounce} and ${noNotNow} and ${hasEmail})::integer`,
  }).from(placementTpoLeads).where(eq(placementTpoLeads.collegeId,college.id));
  return {total:Number(counts?.total??0),eligible:Number(counts?.eligible??0),
   withoutEmail:Number(counts?.withoutEmail??0),unsubscribed:Number(counts?.unsubscribed??0),
   bounced:Number(counts?.bounced??0),notNow:Number(counts?.notNow??0),
   outsideSegment:Number(counts?.outsideSegment??0)};
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
  const contacts=await tx.select({
   id:placementTpoLeads.id,emailNorm:placementTpoLeads.emailNorm,
   manualStage:placementTpoLeads.manualStage,ownerMembershipId:placementTpoLeads.ownerMembershipId,
   unsubscribedAt:placementTpoLeads.unsubscribedAt,inviteBouncedAt:placementTpoLeads.inviteBouncedAt,
  }).from(placementTpoLeads).where(and(eq(placementTpoLeads.collegeId,college.id),
   inArray(placementTpoLeads.id,query.selectedLeadIds)));
  const plan=planTpoCampaignRecipients(contacts);
  const unavailable=query.selectedLeadIds.length-contacts.length;
  return {
   selected:query.selectedLeadIds.length,
   eligible:plan.recipientIds.length,
   leftOut:query.selectedLeadIds.length-plan.recipientIds.length,
   suppressed:plan.suppressed,
   unavailable,
  };
 });
}
