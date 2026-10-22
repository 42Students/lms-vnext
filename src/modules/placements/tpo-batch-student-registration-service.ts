import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementBatchRegistrations} from "@/db/schema/placement-registration";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatchStudents} from "./tpo-batch-workspace-read-service";
import {selectTpoBatchStudentView,type TpoBatchStudentViewOptions} from "./tpo-batch-student-selection-model";
import {placementTableExists} from "./staged-tables";
import {tpoRegistrationChoiceSchema} from "./tpo-batch-registration-summary-model";
/** Only learner IDs already proven to be actively enrolled are looked up. */
export async function getTpoBatchStudentRegistrations(
 context:RequestContext,cohortId:string,page:number,search:string="",onlyDirect=false,wholeRoster=false,
){
 const snapshot=await getTpoBatchStudents(context,cohortId,page,search,onlyDirect,wholeRoster);
 const available=await placementTableExists("placement_batch_registrations");
 const ids=snapshot.students.map(row=>row.membershipId);
 const rows=available&&ids.length?await getDb().select({
   membershipId:placementBatchRegistrations.membershipId,
   choice:placementBatchRegistrations.choice,
   source:placementBatchRegistrations.source,
   updatedAt:placementBatchRegistrations.updatedAt,
 }).from(placementBatchRegistrations)
  .where(and(eq(placementBatchRegistrations.cohortId,snapshot.batch.id),
   inArray(placementBatchRegistrations.membershipId,ids))):[];
 const match=new Map(rows.map(row=>[row.membershipId,row]));
 return {...snapshot,registrationAvailable:available,students:snapshot.students.map(student=>{
  const registration=match.get(student.membershipId);
  const parsed=registration?tpoRegistrationChoiceSchema.safeParse(registration.choice):null;
  return {...student,registration:!available?null:{
    choice:parsed?.success?parsed.data:null,
    source:registration?.source??null,
    updatedAt:registration?.updatedAt.toISOString()??null,
  }};
 })};
}

const PAGE_SIZE=25;
/** Class, decision, source and registration filters (and sort) must see the
 * whole active cohort before paging, as the legacy roster did. When none is
 * active the cheap 25-row page read is used. A roster over the cap is flagged
 * rather than silently treated as complete. */
export async function getTpoBatchStudentRegistrationView(
 context:RequestContext,cohortId:string,page:number,view:TpoBatchStudentViewOptions,
){
 const crossPage=Boolean(view.classId)||view.decision!=="ALL"||view.source!=="ALL"||
  view.registration!=="ALL"||view.order!=="NAME_ASC";
 if(!crossPage){
  const direct=await getTpoBatchStudentRegistrations(context,cohortId,page,view.q);
  return {...direct,rosterTruncated:false,classOptions:null as {id:string;name:string}[]|null,matching:null as number|null};
 }
 const full=await getTpoBatchStudentRegistrations(context,cohortId,1,view.q,view.source==="LEARNER",true);
 const matching=selectTpoBatchStudentView(full.students,view,full.registrationAvailable);
 const classes=new Map<string,string>();
 for(const student of full.students){
  if(student.classId)classes.set(student.classId,student.className??"Unnamed class");
 }
 const start=(page-1)*PAGE_SIZE;
 return {...full,students:matching.slice(start,start+PAGE_SIZE),page,
  hasMore:matching.length>start+PAGE_SIZE,
  rosterTruncated:full.hasMore,
  classOptions:[...classes.entries()].map(([id,name])=>({id,name})),
  matching:matching.length as number|null};
}
