import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {colleges,placementSeasons} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {placementDateIst,placementDateOnly,readSuperAdminPlacementId,type SuperAdminPlacementDetail} from "./super-admin-placement-detail-model";
export async function getSuperAdminSeasonDetail(context:RequestContext,rawId:unknown):Promise<SuperAdminPlacementDetail|null>{
 const scope=requireSuperAdminSelectedCollege(context,"placements.read"),id=readSuperAdminPlacementId(rawId);
 if(!id)return null;
 const [r]=await getDb().select({
  id:placementSeasons.id,name:placementSeasons.name,code:placementSeasons.code,
  status:placementSeasons.status,startDate:placementSeasons.startDate,endDate:placementSeasons.endDate,
  closedAt:placementSeasons.closedAt,createdAt:placementSeasons.createdAt,updatedAt:placementSeasons.updatedAt,
 }).from(placementSeasons)
 .innerJoin(colleges,and(eq(colleges.id,placementSeasons.collegeId),eq(placementSeasons.collegeId,scope.collegeId),
  scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(eq(placementSeasons.id,id)).limit(1);
 if(!r)return null;
 return {title:r.name,subtitle:"Placement season · "+r.code,status:r.status,
  backHref:"/admin/placements/seasons",
  facts:[{label:"Season ID",value:r.id},{label:"Season code",value:r.code},
   {label:"Start date",value:placementDateOnly(r.startDate)},
   {label:"End date",value:placementDateOnly(r.endDate)},
   {label:"Created",value:placementDateIst(r.createdAt)},
   {label:"Last updated",value:placementDateIst(r.updatedAt)},
   {label:"Closed",value:placementDateIst(r.closedAt)}]};
}
