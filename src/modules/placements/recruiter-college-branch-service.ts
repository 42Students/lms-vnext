import "server-only";
import {and,asc,eq,isNull} from "drizzle-orm";
import {getDb} from "@/db/client";
import {departments} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {can} from "@/modules/permissions/policy";

/** Only expose the authorized college's currently active branch suggestions. */
export async function listRecruiterCollegeBranches(context:RequestContext,collegeId:string){
 if(!context.recruiter?.grants.some(g=>g.collegeId===collegeId)||
    !can(context,"placements.recruiter.read",{collegeId}))return [];
 const rows=await getDb().select({name:departments.name}).from(departments)
  .where(and(eq(departments.collegeId,collegeId),isNull(departments.archivedAt)))
  .orderBy(asc(departments.name)).limit(200);
 return rows.map(row=>row.name);
}
