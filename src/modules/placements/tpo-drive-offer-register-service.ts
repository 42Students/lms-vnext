import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
import {hasMembershipRole,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,can,requirePermission} from "@/modules/permissions/policy";
import {PlacementsServiceError} from "./errors";
import {listPlacementJobOffers} from "./offer-service";
import {requirePlacementManageScope} from "./scope";
import {offerRegisterQuery,projectOfferRegister} from "./tpo-drive-offer-register-model";
export async function getTpoDriveOfferRegister(context:RequestContext,raw:unknown){
 const member=context.membership;
 if(!member||!hasMembershipRole(context,"TPO")||member.status!=="ACTIVE"||context.user.platformStatus!=="ACTIVE")throw new AuthorizationError("placements.manage");
 const collegeId=member.collegeId;
 if(!can(context,"placements.manage",{collegeId}))throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage",{collegeId});
 const input=offerRegisterQuery.parse(raw);
 const [job]=await getDb().select({id:placementJobs.id,title:placementJobs.title}).from(placementJobs)
  .where(and(eq(placementJobs.id,input.jobId),eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!job)throw new PlacementsServiceError("PLACEMENT_JOB_NOT_FOUND");
 await requirePlacementManageScope(context,collegeId);
 const facts=await listPlacementJobOffers(context,job.id);
 return {job,status:input.status,...projectOfferRegister(facts,input.status,input.page,input.q,input.joining)};
}
