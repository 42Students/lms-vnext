import "server-only";
import {and,asc,count,eq,isNull} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {colleges,departments,organizations} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {isSuperAdmin} from "@/modules/identity/context";
import {AuthorizationError} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

/** One tenant-safe read model for the old cross-college Department fetchAll.
 * A global Super Admin may browse every active college, an org-scoped Super
 * Admin only its organization, and a selected-college role only that college.
 * Every row carries source organization/college names and UUID identifiers.
 */
export const adminDepartmentDirectoryQuerySchema=z.strictObject({
 page:z.number().int().min(1).max(10000).default(1),
 pageSize:z.number().int().min(1).max(100).default(25),
});

export async function listAdminDepartmentsAcrossColleges(
 ctx:RequestContext,raw:unknown={},
){
 if(!isSuperAdmin(ctx))throw new AuthorizationError("department.read");
 const {page,pageSize}=adminDepartmentDirectoryQuerySchema.parse(raw);
 const organizationId=ctx.adminScope?.organizationId??null;
 const collegeId=ctx.adminScope?.collegeId??null;
 return getDb().transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,ctx,
   !organizationId&&!collegeId?"admin-scope.select":"department.read",
   organizationId||collegeId?{
    ...(organizationId?{organizationId}:{}),
    ...(collegeId?{collegeId}:{}),
   }:undefined);
  const where=and(
   eq(organizations.status,"ACTIVE"),eq(colleges.status,"ACTIVE"),
   isNull(departments.archivedAt),
   organizationId?eq(organizations.id,organizationId):undefined,
   collegeId?eq(colleges.id,collegeId):undefined,
  );
  const [items,totals]=await Promise.all([
   tx.select({
    id:departments.id,name:departments.name,
    collegeId:colleges.id,collegeName:colleges.name,
    organizationId:organizations.id,organizationName:organizations.name,
   }).from(departments)
    .innerJoin(colleges,eq(colleges.id,departments.collegeId))
    .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
    .where(where)
    .orderBy(asc(organizations.name),asc(colleges.name),asc(departments.name),asc(departments.id))
    .limit(pageSize).offset((page-1)*pageSize),
   tx.select({total:count()}).from(departments)
    .innerJoin(colleges,eq(colleges.id,departments.collegeId))
    .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
    .where(where),
  ]);
  const total=totals[0]?.total??0;
  return {items,page,pageSize,total,
   totalPages:Math.max(1,Math.ceil(total/pageSize)),
   scope:collegeId?"COLLEGE" as const:organizationId?"ORGANIZATION" as const:"GLOBAL" as const,
   readOnly:true as const};
 });
}
