import "server-only";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoStudentsIntelligence} from "./tpo-students-service";
import {getTpoAfterCollegeForRoster} from "./tpo-after-college-roster-service";
import {AFTER_COLLEGE_LABELS,AFTER_COLLEGE_OUTCOMES} from "./tpo-after-college-model";

/** One college-scoped population with consistent cohort/department filtering.
 * Chunks protect PostgreSQL bind limits without dropping older students. */
export async function getTpoAfterCollegeReport(ctx:RequestContext,input:{
 collegeId:string;batchId?:string;branchId?:string;
}){
 const data=await getTpoStudentsIntelligence(ctx,{
  collegeId:input.collegeId,batchId:input.batchId,branchId:input.branchId,page:1,pageSize:100,
 },{includeExportRows:true});
 const rows=data.exportRows??[];
 const entries:Record<string,{outcome:keyof typeof AFTER_COLLEGE_LABELS;expectedVersion:string}>={};
 let ready=true;
 for(let offset=0;offset<rows.length;offset+=150){
  const part=await getTpoAfterCollegeForRoster(ctx,rows.slice(offset,offset+150).map(row=>row.membershipId));
  if(!part.available){ready=false;break;}
  Object.assign(entries,part.entries);
 }
 if(!rows.length)ready=(await getTpoAfterCollegeForRoster(ctx,[])).available;
 const result=rows.map(row=>({...row,
  outcome:entries[row.membershipId]?.outcome??"NOT_DECIDED",
 }));
 const counts=Object.fromEntries(AFTER_COLLEGE_OUTCOMES.map(key=>[key,
  result.filter(row=>row.outcome===key).length])) as Record<keyof typeof AFTER_COLLEGE_LABELS,number>;
 return {available:ready,rows:result,counts,total:result.length};
}
