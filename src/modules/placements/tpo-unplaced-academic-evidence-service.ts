import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships,placementCandidateAcademicEvidence} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {requirePlacementManageScope} from "./scope";
import {projectTpoUnplacedAcademic} from "./tpo-unplaced-academic-evidence-model";

/** Reads only evidence belonging to same-college memberships passed from the
 * already-authorized unplaced report. Bounded batches avoid PG bind limits. */
export async function getTpoUnplacedAcademicEvidence(context:RequestContext,
 collegeId:string,membershipIds:readonly string[]){
 await requirePlacementManageScope(context,collegeId);
 const found=new Map<string,ReturnType<typeof projectTpoUnplacedAcademic>>();
 const unique=[...new Set(membershipIds)];
 for(let start=0;start<unique.length;start+=400){
  const batch=unique.slice(start,start+400);
  const rows=await getDb().select({
   membershipId:placementCandidateAcademicEvidence.membershipId,
   tenthPctBasisPoints:placementCandidateAcademicEvidence.tenthPctBasisPoints,
   twelfthPctBasisPoints:placementCandidateAcademicEvidence.twelfthPctBasisPoints,
   diplomaPctBasisPoints:placementCandidateAcademicEvidence.diplomaPctBasisPoints,
   undergraduatePctBasisPoints:placementCandidateAcademicEvidence.undergraduatePctBasisPoints,
   source:placementCandidateAcademicEvidence.source,
   verifiedAt:placementCandidateAcademicEvidence.verifiedAt,
  }).from(placementCandidateAcademicEvidence)
   .innerJoin(collegeMemberships,eq(collegeMemberships.id,placementCandidateAcademicEvidence.membershipId))
   .where(and(eq(collegeMemberships.collegeId,collegeId),
    inArray(placementCandidateAcademicEvidence.membershipId,batch)));
  for(const row of rows)found.set(row.membershipId,projectTpoUnplacedAcademic(row));
 }
 return found;
}
