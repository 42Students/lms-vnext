import "server-only";
import {AuthorizationError} from "@/modules/permissions/policy";
import {and,asc,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,departments,programs,sections} from "@/db/schema";
import {resolveActingCollege} from "@/modules/permissions/acting-college";
import {isSuperAdmin,type RequestContext} from "@/modules/identity/context";

/** Only choices owned by the user's explicitly selected college. */
export async function getSuperAdminStudentRegisterOptions(context:RequestContext){
 if(!isSuperAdmin(context))throw new AuthorizationError("people.manage");
 const scope=await resolveActingCollege(context,"people.manage");
 const db=getDb();
 const [progs,batches,classes]=await Promise.all([
  db.select({id:programs.id,name:programs.name}).from(programs)
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
   .where(eq(programs.status,"ACTIVE")).orderBy(asc(programs.name)).limit(1000),
  db.select({id:cohorts.id,name:cohorts.name,programId:cohorts.programId}).from(cohorts)
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
   .where(inArray(cohorts.status,["PLANNED","ACTIVE"])).orderBy(asc(cohorts.name)).limit(2000),
  db.select({id:sections.id,name:sections.name,cohortId:sections.cohortId,capacity:sections.capacity}).from(sections)
   .innerJoin(cohorts,eq(cohorts.id,sections.cohortId))
   .innerJoin(programs,eq(programs.id,cohorts.programId))
   .innerJoin(departments,and(eq(departments.id,programs.departmentId),eq(departments.collegeId,scope.collegeId)))
   .where(eq(sections.status,"ACTIVE")).orderBy(asc(sections.name)).limit(4000),
 ]);
 return {programs:progs,batches,classes};
}
