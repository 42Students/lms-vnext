import "server-only";
import {and,eq} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {activityEvents,placementCompanies} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {requirePermission,AuthorizationError} from "@/modules/permissions/policy";

/** Global archive reversal deliberately does not reactivate individual
 * college relationships. Those require independent college authorization. */
export async function restoreGlobalCompany(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
    context.adminScope?.collegeId||context.adminScope?.organizationId)
  throw new AuthorizationError("placements.manage");
 requirePermission(context,"placements.manage");
 const input=z.strictObject({companyId:z.uuid(),confirmed:z.literal(true)}).parse(raw);
 return getDb().transaction(async tx=>{
  const [company]=await tx.select({id:placementCompanies.id,name:placementCompanies.name,status:placementCompanies.status})
    .from(placementCompanies).where(eq(placementCompanies.id,input.companyId)).for("update").limit(1);
  if(!company)throw new Error("COMPANY_NOT_FOUND");
  if(company.status!=="ARCHIVED")throw new Error("COMPANY_NOT_ARCHIVED");
  const [updated]=await tx.update(placementCompanies)
    .set({status:"ACTIVE",archivedAt:null,updatedAt:new Date()})
    .where(and(eq(placementCompanies.id,company.id),eq(placementCompanies.status,"ARCHIVED")))
    .returning({id:placementCompanies.id,name:placementCompanies.name});
  if(!updated)throw new Error("COMPANY_STATE_CHANGED");
  await tx.insert(activityEvents).values({
   actorUserId:context.user.id,module:"PLACEMENTS",eventType:"PLACEMENTS_COMPANY_RESTORED",
   subjectType:"placement_company",subjectId:updated.id,subjectLabel:updated.name,
   summary:"Super Admin restored an archived company identity",
   metadata:{scope:"GLOBAL",relationshipsRemainUnchanged:true},
  });
  return updated;
 });
}
