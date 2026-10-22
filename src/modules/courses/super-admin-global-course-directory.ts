import "server-only";
import {and,asc,count,eq,ilike,isNull,or} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {courses,departments,colleges,organizations} from "@/db/schema";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";
import {AuthorizationError,requirePermission} from "@/modules/permissions/policy";
import {assertPersistedPlatformPermission} from "@/modules/permissions/persisted-actor";

/** Read-only platform or explicitly selected organization catalogue.
 * A college selection must continue to use its normal scoped editor. */
const querySchema=z.strictObject({
 q:z.string().trim().max(100).default(""),
 page:z.number().int().min(1).max(10000).default(1),
});
export async function listSuperAdminGlobalCourses(
 context:RequestContext,raw:unknown,
){
 if(!isSuperAdmin(context)||context.user.platformStatus!=="ACTIVE"||
    context.adminScope?.collegeId)throw new AuthorizationError("admin-scope.select");
 requirePermission(context,"admin-scope.select");
 const input=querySchema.parse(raw);
 const db=getDb();
 return db.transaction(async tx=>{
  await assertPersistedPlatformPermission(tx,context,"admin-scope.select");
  const filter=and(
   eq(colleges.status,"ACTIVE"),eq(organizations.status,"ACTIVE"),
   isNull(departments.archivedAt),
   context.adminScope?.organizationId
    ?eq(colleges.organizationId,context.adminScope.organizationId):undefined,
   input.q?or(ilike(courses.name,"%"+input.q.replace(/[\\%_]/g,"\\$&")+"%"),
    ilike(courses.code,"%"+input.q.replace(/[\\%_]/g,"\\$&")+"%")):undefined,
  );
  const [totals,rows]=await Promise.all([
   tx.select({total:count()}).from(courses)
    .innerJoin(departments,eq(departments.id,courses.departmentId))
    .innerJoin(colleges,eq(colleges.id,departments.collegeId))
    .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
    .where(filter),
   tx.select({
    id:courses.id,name:courses.name,code:courses.code,status:courses.status,
    department:departments.name,college:colleges.name,organization:organizations.name,
    collegeId:colleges.id,
   }).from(courses).innerJoin(departments,eq(departments.id,courses.departmentId))
    .innerJoin(colleges,eq(colleges.id,departments.collegeId))
    .innerJoin(organizations,eq(organizations.id,colleges.organizationId))
    .where(filter).orderBy(asc(organizations.name),asc(colleges.name),
      asc(courses.name),asc(courses.id))
    .limit(25).offset((input.page-1)*25),
  ]);
  return {items:rows,total:Number(totals[0]?.total??0),page:input.page,pageSize:25,
    hasMore:input.page*25<Number(totals[0]?.total??0),
    organizationScoped:Boolean(context.adminScope?.organizationId)};
 });
}
