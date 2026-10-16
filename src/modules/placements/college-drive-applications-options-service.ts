import "server-only";
import {and,asc,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {cohorts,departments,programs} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";

export async function listCollegeDriveApplicationFilters(context:RequestContext){
  const collegeId=await requireCollegePlacementAdmin(context);
  const db=getDb();
  const [departmentsList,programList,cohortList]=await Promise.all([
    db.select({id:departments.id,name:departments.name})
      .from(departments).where(eq(departments.collegeId,collegeId))
      .orderBy(asc(departments.name)).limit(500),
    db.select({id:programs.id,name:programs.name,departmentId:programs.departmentId})
      .from(programs).innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(eq(departments.collegeId,collegeId))
      .orderBy(asc(programs.name)).limit(1000),
    db.select({id:cohorts.id,name:cohorts.name,programId:cohorts.programId})
      .from(cohorts).innerJoin(programs,eq(programs.id,cohorts.programId))
      .innerJoin(departments,eq(departments.id,programs.departmentId))
      .where(and(eq(departments.collegeId,collegeId),
        eq(programs.status,"ACTIVE")))
      .orderBy(asc(cohorts.name)).limit(2000),
  ]);
  return {departments:departmentsList,programs:programList,cohorts:cohortList};
}
