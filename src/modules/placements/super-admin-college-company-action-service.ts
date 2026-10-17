import "server-only";
import {and,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementCompanies,placementCompanyRelationships,placementJobs} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";
import {recordActivityEventInTransaction} from "@/modules/activity/service";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {AuthorizationError} from "@/modules/permissions/policy";
import {superAdminCollegeCompanyActionSchema} from "./super-admin-college-company-action-model";

export async function changeSuperAdminCollegeCompanyRelationship(context:RequestContext,raw:unknown){
 if(!isSuperAdmin(context))throw new AuthorizationError("placements.manage");
 const acting=await resolveActingCollege(context,"placements.manage");
 const input=superAdminCollegeCompanyActionSchema.parse(raw);
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"placements.manage",{
   organizationId:acting.organizationId,collegeId:acting.collegeId,
  });
  const [row]=await tx.select({
   id:placementCompanyRelationships.id,status:placementCompanyRelationships.status,
   companyId:placementCompanies.id,name:placementCompanies.name,
   companyStatus:placementCompanies.status,
  }).from(placementCompanyRelationships).innerJoin(placementCompanies,
   eq(placementCompanies.id,placementCompanyRelationships.companyId))
   .where(and(eq(placementCompanyRelationships.id,input.relationshipId),
    eq(placementCompanyRelationships.collegeId,acting.collegeId)))
   .for("update",{of:placementCompanyRelationships}).limit(1);
  if(!row)throw new Error("Company is not linked to the selected college.");
  const next=input.action==="ARCHIVE"?"ARCHIVED":"ACTIVE";
  if(row.status===next)return {relationshipId:row.id,status:next,changed:false};
  if(row.companyStatus!=="ACTIVE")throw new Error("Restore the global company first.");
  if(next==="ARCHIVED"){
   const [dependent]=await tx.select({id:placementJobs.id}).from(placementJobs)
    .where(and(eq(placementJobs.companyRelationshipId,row.id),
     isNull(placementJobs.archivedAt))).limit(1);
   if(dependent)throw new Error("Cannot delete a company with active or historical non-archived drives.");
  }
  const now=new Date();
  const [saved]=await tx.update(placementCompanyRelationships).set({
   status:next,archivedAt:next==="ARCHIVED"?now:null,updatedAt:now,
  }).where(and(eq(placementCompanyRelationships.id,row.id),
   eq(placementCompanyRelationships.status,row.status)))
   .returning({id:placementCompanyRelationships.id});
  if(!saved)throw new Error("Company relationship changed. Refresh and retry.");
  await recordActivityEventInTransaction(tx,context,{
   eventType:next==="ARCHIVED"?ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_RELATIONSHIP_ARCHIVED:
    ACTIVITY_EVENT_TYPES.PLACEMENTS_COMPANY_RELATIONSHIP_RESTORED,
   collegeId:acting.collegeId,organizationId:acting.organizationId,
   subjectType:"placement_company_relationship",subjectId:row.id,subjectLabel:row.name,
   summary:next==="ARCHIVED"?"College company deleted (archived)":"College company restored",
   metadata:{companyId:row.companyId,previousStatus:row.status,nextStatus:next},
  });
  return {relationshipId:row.id,status:next,changed:true};
 });
}
