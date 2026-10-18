import "server-only";

import {and,eq,inArray,ne} from "drizzle-orm";
import {tpoRoundImportPreviewToken} from "./tpo-round-import-preview-token";
import {getDb} from "@/db/client";
import {collegeMemberships,learnerProfiles,placementApplications,placementApplicationScreenings,
 placementJobRounds,placementJobs,placementRoundResults,users} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {PlacementsServiceError} from "./errors";
import {confirmTpoRoundResult} from "./tpo-confirmed-round-result-service";
import {requireTpoJobCollege} from "./tpo-job-write-base";
import {placementJobIdSchema,placementRoundIdSchema} from "./validation";
import {parseTpoRoundImport,roundImportActionSchema,matchTpoRoundImportRoster,uniqueTpoRoundImportRoster,tpoRoundImportStageFailureReason,type ImportRow} from "./tpo-round-import-model";

type Roster=Awaited<ReturnType<typeof readRoster>>["roster"][number];
async function readRoster(context:RequestContext,rawJobId:unknown,rawRoundId:unknown){
 const collegeId=await requireTpoJobCollege(context),jobId=placementJobIdSchema.parse(rawJobId),
  roundId=placementRoundIdSchema.parse(rawRoundId);
 const [round]=await getDb().select({
  id:placementJobRounds.id,name:placementJobRounds.name,kind:placementJobRounds.kind,
  status:placementJobRounds.status,jobStatus:placementJobs.status,
 }).from(placementJobRounds).innerJoin(placementJobs,eq(placementJobs.id,placementJobRounds.jobId))
 .where(and(eq(placementJobRounds.id,roundId),eq(placementJobs.id,jobId),
  eq(placementJobs.collegeId,collegeId))).limit(1);
 if(!round)throw new PlacementsServiceError("PLACEMENT_ROUND_NOT_FOUND");
 const rows=await getDb().select({
  applicationId:placementApplications.id,name:users.displayName,email:users.email,
  roll:learnerProfiles.rollNumber,applicationStatus:placementApplications.status,
  screeningStatus:placementApplicationScreenings.status,
  currentResultId:placementRoundResults.id,currentStatus:placementRoundResults.status,
 }).from(placementApplications)
 .innerJoin(collegeMemberships,and(eq(collegeMemberships.id,placementApplications.membershipId),
  eq(collegeMemberships.collegeId,collegeId)))
 .innerJoin(users,eq(users.id,collegeMemberships.userId))
 .leftJoin(learnerProfiles,eq(learnerProfiles.membershipId,collegeMemberships.id))
 .innerJoin(placementApplicationScreenings,eq(placementApplicationScreenings.applicationId,placementApplications.id))
 .leftJoin(placementRoundResults,and(eq(placementRoundResults.applicationId,placementApplications.id),
  eq(placementRoundResults.roundId,round.id),ne(placementRoundResults.status,"SUPERSEDED")))
 .where(and(eq(placementApplications.jobId,jobId),
  eq(placementApplications.status,"SUBMITTED"),eq(placementApplicationScreenings.status,"SHORTLISTED"),
  eq(collegeMemberships.status,"ACTIVE"),eq(users.platformStatus,"ACTIVE")));
 const roster=uniqueTpoRoundImportRoster(rows);
 return {round,roster,jobId,roundId};
}
const matchSource=matchTpoRoundImportRoster;

function suggested(row:ImportRow,roster:readonly Roster[]){
 const token=(row.name||row.email||row.roll||row.identity).toLowerCase();
 if(token.length<3)return [];
 return roster.filter(c=>(c.name??"").toLowerCase().includes(token)||
  (c.email??"").toLowerCase().startsWith(token)||
  (c.roll??"").toLowerCase().startsWith(token)).slice(0,5)
  .map(c=>({applicationId:c.applicationId,name:c.name??"Learner",roll:c.roll}));
}
function previewData(rows:ImportRow[],roster:Roster[]){
 const used=new Set<string>();
 const matched:Array<{line:number;identity:string;applicationId:string;name:string;outcome:ImportRow["outcome"];status:string|null;rank:number|null;message:string|null}>=[];
 const unmatched:Array<{line:number;identity:string;reason:string;suggestions:ReturnType<typeof suggested>}>=[];
 for(const row of rows){
  if(row.invalidRank){
   const exact=matchSource(row,roster);
   if(exact.length===1)used.add(exact[0]!.applicationId);
   unmatched.push({line:row.line,identity:row.identity,reason:"Rank must be 1–100000 and is only allowed for Waitlisted results",suggestions:[]});continue;}
  if(!row.outcome){
   const exact=matchSource(row,roster);
   if(exact.length===1)used.add(exact[0]!.applicationId);
   unmatched.push({line:row.line,identity:row.identity,reason:"Unrecognized outcome",suggestions:[]});continue;}
  const candidates=matchSource(row,roster);
  if(candidates.length!==1){
   unmatched.push({line:row.line,identity:row.identity,
    reason:candidates.length?"Ambiguous applicant":"No exact application ID, email or roll match",
    suggestions:suggested(row,roster)});continue;
  }
  const candidate=candidates[0]!;
  if(used.has(candidate.applicationId)){
   unmatched.push({line:row.line,identity:row.identity,reason:"Duplicate applicant in file",suggestions:[]});continue;
  }
  if(candidate.currentStatus==="APPLIED"){
   used.add(candidate.applicationId);
   unmatched.push({line:row.line,identity:row.identity,reason:"Already applied; locked from import",suggestions:[]});continue;
  }
  used.add(candidate.applicationId);
  matched.push({line:row.line,identity:row.identity,applicationId:candidate.applicationId,
   name:candidate.name??"Learner",outcome:row.outcome,status:candidate.currentStatus,
   rank:row.rank,message:row.message});
 }
 const rankCounts=new Map<number,number>();
 for(const entry of matched)if(entry.outcome==="HOLD"&&entry.rank!==null)
  rankCounts.set(entry.rank,(rankCounts.get(entry.rank)??0)+1);
 const duplicateRanks=new Set([...rankCounts].filter(([,n])=>n>1).map(([rank])=>rank));
 const safeMatches=matched.filter(entry=>{
  if(entry.outcome!=="HOLD"||entry.rank===null||!duplicateRanks.has(entry.rank))return true;
  unmatched.push({line:entry.line,identity:entry.identity,
   reason:"Two or more learners have the same waitlist rank",suggestions:[]});
  return false;
 });
 return {matched:safeMatches,unmatched,notInFile:roster.filter(c=>!used.has(c.applicationId)&&c.currentStatus!=="APPLIED")
   .map(c=>({applicationId:c.applicationId,name:c.name??"Learner"}))};
}
export async function previewTpoRoundImport(context:RequestContext,jobId:unknown,roundId:unknown,bytes:Buffer,filename:string){
 const scoped=await readRoster(context,jobId,roundId);
 const source=parseTpoRoundImport(bytes,filename);
 const projection=previewData(source,scoped.roster);
 const token=tpoRoundImportPreviewToken(scoped.roundId,bytes,scoped.roster);
 return {round:scoped.round,jobId:scoped.jobId,roundId:scoped.roundId,previewToken:token,
  sourceRows:source.length,candidateCount:scoped.roster.length,...projection};
}
export async function stageTpoRoundImport(
 context:RequestContext,jobId:unknown,roundId:unknown,bytes:Buffer,filename:string,raw:unknown,
){
 const input=roundImportActionSchema.parse(raw);
 const preview=await previewTpoRoundImport(context,jobId,roundId,bytes,filename);
 if(preview.previewToken!==input.previewToken)throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
 if(preview.round.jobStatus!=="PUBLISHED"||preview.round.kind==="TALK"||
  !["SCHEDULED","COMPLETED"].includes(preview.round.status)){
  throw new PlacementsServiceError("PLACEMENT_RESULT_ROUND_NOT_READY");
 }
 const roster=await readRoster(context,jobId,roundId);
 // Review is scoped to an exact source and roster snapshot. A second read can
 // differ if another officer stages a result after preview but before submit.
 if(tpoRoundImportPreviewToken(roster.roundId,bytes,roster.roster)!==input.previewToken)
  throw new PlacementsServiceError("PLACEMENT_JOB_PREVIEW_STALE");
 if(roster.round.jobStatus!=="PUBLISHED"||roster.round.kind==="TALK"||
  !["SCHEDULED","COMPLETED"].includes(roster.round.status))
  throw new PlacementsServiceError("PLACEMENT_RESULT_ROUND_NOT_READY");
 const candidates=new Map(roster.roster.map(c=>[c.applicationId,c]));
 const inputRows=parseTpoRoundImport(bytes,filename);
 const used=new Set<string>(),entries:Array<{line:number;applicationId:string;outcome:"PASS"|"FAIL"|"HOLD"|"ABSENT";rank:number|null;message:string|null}>=[];
 const rejected:Array<{applicationId:string;line:number;status:"skipped";reason:string}>=[];
 const skippedLines=new Set(input.skippedLines),override=new Map(input.overrides.map(v=>[v.line,v.applicationId]));
 const knownLines=new Set(inputRows.map(row=>row.line));
 if([...skippedLines,...override.keys()].some(line=>!knownLines.has(line)))
  throw new Error("A skipped or matched row is not present in the uploaded file. Preview the file again.");
 const explicitlySkippedApplications=new Set<string>();
 const problemApplications=new Set<string>();
 let unresolvedSkippedRows=0;
 for(const row of inputRows){
  if(skippedLines.has(row.line)){
   const unique=matchSource(row,roster.roster);
   if(unique.length===1)explicitlySkippedApplications.add(unique[0]!.applicationId);
   else unresolvedSkippedRows++;
   continue;
  }
  const exact=matchSource(row,roster.roster);
  const chosen=override.get(row.line);
  // Do not use the first ambiguous match: an import must never stage results
  // for a different learner merely because their roll/email was duplicated.
  const match=chosen??(exact.length===1?exact[0]!.applicationId:undefined);
  const overridden=chosen?candidates.get(chosen):null;
  const contradictoryOverride=Boolean(overridden&&(
   row.applicationId&&row.applicationId.toLowerCase()!==chosen!.toLowerCase()||
   row.email&&overridden.email?.toLowerCase()!==row.email.toLowerCase()||
   row.roll&&overridden.roll?.toLowerCase()!==row.roll.toLowerCase()));
  const reason=contradictoryOverride?"Selected learner conflicts with the uploaded application ID, email or roll":row.invalidRank?"Rank must be 1–100000 and is only allowed for Waitlisted results":
   !match?"Unmatched or ambiguous learner; review and choose Skip or a verified match":
   !row.outcome?"Unknown result outcome":!candidates.has(match)?"Learner not in this round":
   used.has(match)?"Duplicate learner in the import":"";
  if(reason){
   if(exact.length===1)problemApplications.add(exact[0]!.applicationId);
   // Invalid or ambiguous rows must never turn a matched student's missing
   // result into an automatic failure under MARK_NOT_CLEARED.
   if(match&&candidates.has(match))problemApplications.add(match);
   rejected.push({applicationId:match??"",line:row.line,status:"skipped",reason});
   continue;
  }
  if(!match)continue;
  const current=candidates.get(match)!;
  if(current.currentStatus==="APPLIED"){
   used.add(match);
   rejected.push({applicationId:match,line:row.line,status:"skipped",reason:"Applied result cannot be overwritten"});
   continue;
  }
  used.add(match);
  entries.push({line:row.line,applicationId:match,outcome:row.outcome!,rank:row.rank,message:row.message});
 }
 const explicitRanks=entries.filter(row=>row.outcome==="HOLD"&&row.rank!==null)
  .map(row=>row.rank!);
 if(new Set(explicitRanks).size!==explicitRanks.length)
  throw Error("Duplicate waitlist ranks in the import. Resolve the ranked rows before staging results.");
 if(input.missingPolicy==="MARK_NOT_CLEARED"){
  if(inputRows.some(row=>row.invalidRank&&!skippedLines.has(row.line)))
   throw Error("Correct or skip invalid waitlist ranks before failing absent results.");
  if(!inputRows.length)throw Error("An empty result file cannot mark the entire round not cleared.");
  if(rejected.length||unresolvedSkippedRows)throw Error("Resolve ambiguous source identities before automatically marking missing learners not cleared. Skipping an unmatched row cannot identify which learner to protect.");
  for(const candidate of roster.roster){
   if(!used.has(candidate.applicationId)&&
     !explicitlySkippedApplications.has(candidate.applicationId)&&
     !problemApplications.has(candidate.applicationId)&&candidate.currentStatus!=="APPLIED"){
    entries.push({line:0,applicationId:candidate.applicationId,outcome:"FAIL",rank:null,
     message:"No passing result was reported by the company."});
   }
  }
 }
 const results:Array<{applicationId:string;line:number;status:"staged"|"skipped";reason?:string}>=[...rejected];
 // Preserve unique ranks in an import even when another row supplies an
 // explicit rank or an earlier result is already applied.
 const existingRanks=await getDb().select({
  applicationId:placementRoundResults.applicationId,rank:placementRoundResults.waitlistRank,
 }).from(placementRoundResults).where(and(
   eq(placementRoundResults.roundId,preview.roundId),
   eq(placementRoundResults.outcome,"HOLD"),
   inArray(placementRoundResults.status,["STAGED","APPLIED"])));
 const importing=new Set(entries.map(e=>e.applicationId));
 const occupied=new Set(existingRanks.filter(r=>r.rank!==null&&!importing.has(r.applicationId)).map(r=>r.rank!));
 // Reserve every explicit imported waitlist rank before assigning implicit
 // ranks, regardless of source-row order. Otherwise an earlier blank rank
 // can steal a later explicit rank and silently skip that candidate.
 const explicitReserved=new Set(entries.filter(e=>e.outcome==="HOLD"&&e.rank!==null).map(e=>e.rank!));
 let nextWaitlistRank=1;
 for(const entry of entries){
  let addedRank:number|null=null;
  try{
   const candidate=candidates.get(entry.applicationId)!;
   let waitlistRank:number|null=null;
   if(entry.outcome==="HOLD"){
    if(entry.rank!==null)waitlistRank=entry.rank;
    else{
     while(occupied.has(nextWaitlistRank)||explicitReserved.has(nextWaitlistRank))nextWaitlistRank++;
     waitlistRank=nextWaitlistRank++;
    }
    if(occupied.has(waitlistRank)){
     results.push({applicationId:entry.applicationId,line:entry.line,status:"skipped",
      reason:"Waitlist rank "+waitlistRank+" is already assigned in this round"});
     continue;
    }
    occupied.add(waitlistRank);
    addedRank=waitlistRank;
   }
   const candidateMessage=entry.outcome==="PASS"?null:entry.message??
    (entry.outcome==="HOLD"?"You are waitlisted for this round.":
     entry.outcome==="ABSENT"?"You were marked absent for this round. Contact the placement cell if this is incorrect.":
     "You have not cleared this round.");
   await confirmTpoRoundResult(context,preview.roundId,{
    confirmed:true,expectedCurrentResultId:candidate.currentResultId,
    result:{applicationId:entry.applicationId,outcome:entry.outcome,
     waitlistRank,candidateMessage},
   });
   results.push({applicationId:entry.applicationId,line:entry.line,status:"staged"});
  }catch(e){
   if(addedRank!==null)occupied.delete(addedRank);
   results.push({applicationId:entry.applicationId,line:entry.line,status:"skipped",
    reason:e instanceof Error?e.message:"Could not stage this result"});}
 }
 return {staged:results.filter(r=>r.status==="staged").length,
  skipped:results.filter(r=>r.status==="skipped").length,
  unmatched:results.filter(r=>r.status==="skipped"&&r.line>0).length,results};
}
