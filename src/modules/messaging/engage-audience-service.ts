import "server-only";
import {eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoLeads} from "@/db/schema/tpo-crm";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {requirePlacementManageScope} from "@/modules/placements/scope";
import {engageAudienceQuerySchema,summarizeEngageAudience} from "./engage-audience-model";

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
