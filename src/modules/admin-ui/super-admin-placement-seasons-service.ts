import "server-only";
import {and,asc,count,eq,ilike,or} from "drizzle-orm";
import {getDb} from "@/db/client";
import {aliasedColumn} from "@/db/aliased-column";
import {colleges,placementSeasons} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireSuperAdminSelectedCollege} from "./super-admin-selected-college";
import {scopedSearchLike,superAdminReadPages,superAdminReadQuerySchema,SUPER_ADMIN_READ_PAGE_SIZE,type SuperAdminReadResult} from "./super-admin-read-directory-model";
export async function listSuperAdminPlacementSeasons(context:RequestContext,raw:unknown):Promise<SuperAdminReadResult>{
 const query=superAdminReadQuerySchema.parse(raw),scope=requireSuperAdminSelectedCollege(context,"placements.read"),db=getDb();
 const source=db.select({
  id:aliasedColumn(placementSeasons.id,"admin_season_id"),
  name:aliasedColumn(placementSeasons.name,"admin_season_name"),
  code:placementSeasons.code,status:aliasedColumn(placementSeasons.status,"admin_season_status"),
  startDate:placementSeasons.startDate,endDate:placementSeasons.endDate,
  closedAt:placementSeasons.closedAt,
 }).from(placementSeasons)
 .innerJoin(colleges,and(eq(colleges.id,placementSeasons.collegeId),eq(placementSeasons.collegeId,scope.collegeId),
  scope.organizationId?eq(colleges.organizationId,scope.organizationId):undefined))
 .where(and(query.status==="ALL"?undefined:eq(placementSeasons.status,query.status),
  query.q?or(ilike(placementSeasons.name,scopedSearchLike(query.q)),ilike(placementSeasons.code,scopedSearchLike(query.q))):undefined,
 )).as("super_admin_placement_seasons");
 const [totals,rows]=await Promise.all([
  db.select({total:count()}).from(source),
  db.select().from(source).orderBy(asc(source.startDate),asc(source.name),asc(source.id))
  .limit(query.pageSize).offset((query.page-1)*query.pageSize),
 ]);
 const total=totals[0]?.total??0;
 const fmt=new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"});
 return {query,total,totalPages:superAdminReadPages(total,query.pageSize),items:rows.map(r=>({
  id:r.id,title:r.name,subtitle:"Placement season "+r.code,status:r.status,
  details:["From: "+r.startDate,"To: "+r.endDate,"Closed: "+(r.closedAt?fmt.format(r.closedAt)+" IST":"Not closed")],
  href:`/admin/placements/seasons/${encodeURIComponent(r.id)}`,
 }))};
}
