import { z } from "zod";
import { placementReportCsv } from "./report-model";
import { plusCalendarDays } from "./tpo-offer-expiry-model";
export const tpoJoiningFollowupQuerySchema=z.object({
 seasonId:z.string().uuid().optional(),
 state:z.enum(["ALL","PENDING","DEFERRED","DATE_DUE","DATE_MISSING","UPCOMING_7_DAYS"]).default("ALL"),
}).strict();
export type JoiningFollowupFact={
 offerId:string;jobId:string;jobTitle:string;companyName:string;
 candidateName:string|null;roleTitle:string;offerStatus:string;
 joiningStatus:string|null;scheduledDate:string|null;
};
export function projectTpoJoiningFollowups(facts:readonly JoiningFollowupFact[],todayIst:string,state:"ALL"|"PENDING"|"DEFERRED"|"DATE_DUE"|"DATE_MISSING"|"UPCOMING_7_DAYS"){
 const accepted=[...new Map(facts.filter(r=>r.offerStatus==="ACCEPTED")
   .map(r=>[r.offerId,r])).values()];
 const counts={
  accepted:accepted.length,
  pending:accepted.filter(r=>r.joiningStatus===null||r.joiningStatus==="PENDING").length,
  deferred:accepted.filter(r=>r.joiningStatus==="DEFERRED").length,
  joined:accepted.filter(r=>r.joiningStatus==="JOINED").length,
  didNotJoin:accepted.filter(r=>r.joiningStatus==="DID_NOT_JOIN").length,
  dueWithRecordedDate:accepted.filter(r=>(r.joiningStatus===null||r.joiningStatus==="PENDING"||
    r.joiningStatus==="DEFERRED")&&r.scheduledDate!==null&&r.scheduledDate<=todayIst).length,
  dateMissing:accepted.filter(r=>(r.joiningStatus===null||r.joiningStatus==="PENDING")&&
    r.scheduledDate===null).length,
 };
 const open=accepted.filter(r=>r.joiningStatus===null||r.joiningStatus==="PENDING"||r.joiningStatus==="DEFERRED");
 const throughIst=plusCalendarDays(todayIst,7);
 const rows=open.filter(r=>state==="ALL"||
   (state==="PENDING"&&(r.joiningStatus===null||r.joiningStatus==="PENDING"))||
   (state==="DEFERRED"&&r.joiningStatus==="DEFERRED")||
   (state==="DATE_DUE"&&r.scheduledDate!==null&&r.scheduledDate<=todayIst)||
   (state==="DATE_MISSING"&&r.scheduledDate===null&&(r.joiningStatus===null||r.joiningStatus==="PENDING"))||
   (state==="UPCOMING_7_DAYS"&&r.scheduledDate!==null&&r.scheduledDate>todayIst&&r.scheduledDate<=throughIst))
   .sort((a,b)=>(a.scheduledDate??"9999-12-31").localeCompare(b.scheduledDate??"9999-12-31")||
     a.companyName.localeCompare(b.companyName)||a.offerId.localeCompare(b.offerId));
 return {counts,rows,todayIst};
}
export const TPO_JOINING_FOLLOWUP_CSV_LIMIT=200;
export function tpoJoiningFollowupCsv(
 result:ReturnType<typeof projectTpoJoiningFollowups>&{truncated?:boolean},
 seasonName:string,
){
 // The DB reader deliberately caps at 500 accepted offers. Never describe
 // counts from that sample as full-season totals in a downloaded CSV.
 const sourceTruncated=result.truncated===true;
 const rowTruncated=result.rows.length>TPO_JOINING_FOLLOWUP_CSV_LIMIT;
 const truncated=sourceTruncated||rowTruncated;
 const data:(string|number|null)[][]=[
  ["Season total",seasonName,result.counts.accepted,result.counts.pending,result.counts.deferred,
    result.counts.joined,result.counts.didNotJoin,result.counts.dueWithRecordedDate],
  ...result.rows.slice(0,TPO_JOINING_FOLLOWUP_CSV_LIMIT).map(r=>
    ["Follow-up",r.companyName+" · "+r.jobTitle,r.candidateName??"Not recorded",r.roleTitle,
      r.joiningStatus??"PENDING",r.scheduledDate??"Date unavailable",r.offerId,null]),
  ["Methodology","Only currently ACCEPTED offers. Due requires a persisted joining date on/before "+result.todayIst+
    ". Missing date is unknown, not late. Joining success requires an explicit JOINED outcome.",null,null,null,null,null,null],
 ];
 if(rowTruncated)data.push(["TRUNCATED","First "+TPO_JOINING_FOLLOWUP_CSV_LIMIT+" of "+result.rows.length+
   " matching follow-up offers exported; totals are not limited.",null,null,null,null,null,null]);
 if(sourceTruncated)data.push(["SOURCE_TRUNCATED",
   "Only the first 500 accepted offer versions were examined. Summary totals are incomplete; no full-season total is claimed.",
   null,null,null,null,null,null]);
 return {csv:placementReportCsv([
  "Scope","Company/drive or season","Accepted offers or student","Pending or role",
  "Deferred or recorded status","Joined or joining date","Did not join or offer ID","Date due",
 ],data),truncated};
}
