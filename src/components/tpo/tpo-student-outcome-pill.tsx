import { Badge } from "@/components/ui/badge";
import {AFTER_COLLEGE_LABELS,type AfterCollegeOutcome} from "@/modules/placements/tpo-after-college-model";
export function TpoStudentOutcomePill({recorded,placed,registered}:{recorded:AfterCollegeOutcome|null;placed:boolean;registered:boolean}){
 const label=placed?(recorded==="PLACED_ON_CAMPUS"||recorded==="PLACED_OFF_CAMPUS"?AFTER_COLLEGE_LABELS[recorded]:"Placed"):recorded&&recorded!=="NOT_DECIDED"
  ?AFTER_COLLEGE_LABELS[recorded]:!registered?"Not in placements":"Not decided yet";
 return <Badge title={placed?"Derived from recorded accepted/external placement evidence.":
   recorded&&recorded!=="NOT_DECIDED"?"Set by you or the student":"No final outcome recorded."}
    tone="neutral" className="max-w-full">
   {label}
 </Badge>;
}
