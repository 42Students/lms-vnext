import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementTpoAfterCollege} from "@/db/schema/tpo-configuration";
import {placementTableExists} from "./staged-tables";
import type {AfterCollegeOutcome} from "./tpo-after-college-model";

/** College ID is supplied only by a previously authorized roster scope.
 * This returns persisted outcomes, not guesses from applications or offers. */
export async function readTpoAfterCollegeMatches(collegeId:string,outcome:AfterCollegeOutcome){
 const available=await placementTableExists("placement_tpo_after_college");
 if(!available)return {available:false,matched:new Set<string>(),assigned:new Set<string>()};
 const rows=await getDb().select({
  membershipId:placementTpoAfterCollege.learnerMembershipId,
  outcome:placementTpoAfterCollege.outcome,
 }).from(placementTpoAfterCollege)
  .where(eq(placementTpoAfterCollege.collegeId,collegeId));
 return {
  available:true,
  matched:new Set(rows.filter(row=>row.outcome===outcome).map(row=>row.membershipId)),
  assigned:new Set(rows.map(row=>row.membershipId)),
 };
}
