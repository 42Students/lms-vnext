import "server-only";
import {and,asc,eq,ilike,sql} from "drizzle-orm";
import {z} from "zod";
import {getDb} from "@/db/client";
import {placementJobs} from "@/db/schema";
import {placementRoundCandidateSlots} from "@/db/schema/placement-round-candidate-slots";
import type {RequestContext} from "@/modules/identity/context";
import {requireCollegePlacementAdmin} from "./college-drive-read-service";

/** Organization-style legacy name lookup is now college scoped. The selected
 * college comes solely from the active actor context, never a query argument. */
export async function listCollegeInterviewerSuggestions(context:RequestContext,raw:unknown){
 const input=z.object({q:z.string().trim().max(100).default(""),
  limit:z.coerce.number().int().min(1).max(50).default(15)}).strict().parse(raw);
 const collegeId=await requireCollegePlacementAdmin(context);
 const name=sql<string>`coalesce(nullif(trim(${placementRoundCandidateSlots.legacyInterviewerName}),''),nullif(trim(${placementRoundCandidateSlots.panel}),''))`;
 const literal="%"+input.q.replace(/[\\%_]/g,"\\$&")+"%";
 const matches=await getDb().selectDistinct({name})
  .from(placementRoundCandidateSlots)
  .innerJoin(placementJobs,eq(placementJobs.id,placementRoundCandidateSlots.jobId))
  .where(and(eq(placementJobs.collegeId,collegeId),
   sql`${name} is not null`,
   input.q?ilike(name,literal):undefined))
  .orderBy(asc(name)).limit(input.limit);
 return {message:"Interviewers retrieved",items:matches.map(row=>row.name)};
}
