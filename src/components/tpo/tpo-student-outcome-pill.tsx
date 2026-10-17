import {AFTER_COLLEGE_LABELS,type AfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";
export function TpoStudentOutcomePill({recorded,placed,registered}:{recorded:AfterCollegeOutcome|null;placed:boolean;registered:boolean}){
 const label=placed?"Placed":recorded&&recorded!=="NOT_DECIDED"
  ?AFTER_COLLEGE_LABELS[recorded]:!registered?"Not in placements":"Not decided yet";
 return <span title={placed?"Derived from recorded accepted/external placement evidence.":
   recorded&&recorded!=="NOT_DECIDED"?"Set by you or the student":"No final outcome recorded."}
   className="inline-flex max-w-full rounded-full border border-border px-3 py-1 text-xs font-semibold text-body">
   {label}
 </span>;
}
