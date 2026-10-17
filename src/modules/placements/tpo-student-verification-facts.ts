import "server-only";
import {and,eq} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships} from "@/db/schema";
import {profileVerifications} from "@/db/schema/profile-verification";
import {placementTableExists} from "./staged-tables";

export type TpoStudentVerificationState="VERIFIED"|"WAITING"|"SENT_BACK"|"NOT_VERIFIED"|"UNKNOWN";
type Section="EDUCATION"|"IDENTITY";
export type TpoStudentVerificationFact={
 status:TpoStudentVerificationState;
 waitingSections:readonly Section[];
 verifiedSections:readonly Section[];
};
const unknown:TpoStudentVerificationFact={status:"UNKNOWN",waitingSections:[],verifiedSections:[]};

/** Caller must already have checked the college-scoped TPO role. Never read
 * unscoped membership IDs or infer a missing table as an unverified student. */
export async function readTpoStudentVerificationFacts(collegeId:string){
 if(!await placementTableExists("profile_verifications"))
  return {available:false,facts:new Map<string,TpoStudentVerificationFact>()};
 const rows=await getDb().select({
  membershipId:profileVerifications.learnerMembershipId,
  section:profileVerifications.section,status:profileVerifications.status,
 }).from(profileVerifications)
  .innerJoin(collegeMemberships,eq(collegeMemberships.id,profileVerifications.learnerMembershipId))
  .where(and(eq(collegeMemberships.collegeId,collegeId),eq(collegeMemberships.status,"ACTIVE")));
 const grouped=new Map<string,Map<Section,string>>();
 for(const row of rows){
  if(row.section!=="EDUCATION"&&row.section!=="IDENTITY")continue;
  const data=grouped.get(row.membershipId)??new Map<Section,string>();
  data.set(row.section,row.status);
  grouped.set(row.membershipId,data);
 }
 const facts=new Map<string,TpoStudentVerificationFact>();
 for(const [membershipId,sections] of grouped){
  const waitingSections=(["EDUCATION","IDENTITY"] as const).filter(section=>
   sections.get(section)==="SUBMITTED"||sections.get(section)==="UPDATE_PENDING");
  const verifiedSections=(["EDUCATION","IDENTITY"] as const).filter(section=>
   sections.get(section)==="VERIFIED"||sections.get(section)==="UPDATE_PENDING");
  const status:TpoStudentVerificationState=waitingSections.length?"WAITING":
   [...sections.values()].includes("SENT_BACK")?"SENT_BACK":
   verifiedSections.length===2?"VERIFIED":"NOT_VERIFIED";
  facts.set(membershipId,{status,waitingSections,verifiedSections});
 }
 return {available:true,facts};
}
export function studentVerificationFact(data:Awaited<ReturnType<typeof readTpoStudentVerificationFacts>>,membershipId:string):TpoStudentVerificationFact{
 return data.available?data.facts.get(membershipId)??{status:"NOT_VERIFIED",waitingSections:[],verifiedSections:[]}:unknown;
}
