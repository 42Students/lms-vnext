import "server-only";
import {and,eq,inArray} from "drizzle-orm";
import {getDb} from "@/db/client";
import {placementBatchRegistrations} from "@/db/schema/placement-registration";
import type {RequestContext} from "@/modules/identity/context";
import {getTpoBatchStudents} from "./tpo-batch-workspace-read-service";
import {placementTableExists} from "./staged-tables";
import {tpoRegistrationChoiceSchema} from "./tpo-batch-registration-summary-model";
/** Only learner IDs already proven to be actively enrolled are looked up. */
export async function getTpoBatchStudentRegistrations(
 context:RequestContext,cohortId:string,page:number,search:string="",onlyDirect=false,
){
 const snapshot=await getTpoBatchStudents(context,cohortId,page,search,onlyDirect);
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
