import type {TpoStudentRow} from "./tpo-students-model";
export function tpoPreparationNudgeMessage(student:Pick<TpoStudentRow,"registeredForPlacements"|"readinessSignal">):string{
 if(!student.registeredForPlacements)return "Review the placement registration choices in the LMS portal. No registration is assumed.";
 if(student.readinessSignal==="ACADEMIC_EVIDENCE_MISSING")
  return "Please review your academic profile evidence in LMS and your available preparation courses. This is not an eligibility judgment.";
 if(student.readinessSignal==="PARTICIPATION_NOT_ELIGIBLE")
  return "Please review your current placement participation decision with the placement cell before planning applications.";
 return "Review available preparation courses and upcoming placement opportunities in your LMS portal.";
}
export function tpoPreparationFocusRows<T extends Pick<TpoStudentRow,"registeredForPlacements"|"readinessSignal">>(rows:readonly T[]):T[]{
 return rows.filter(row=>row.registeredForPlacements&&row.readinessSignal!=="PARTICIPATION_ELIGIBLE_EVIDENCE_PRESENT");
}
