import type {HrDriveDraft} from "./hr-drive-draft-model";
export function hrDraftCompensationWarnings(draft:HrDriveDraft):string[]{
 const notes:string[]=[];
 const num=(value:string)=>value===""?null:Number(value);
 const fixed=num(draft.fixedAnnualCtcInr),variable=num(draft.variableAnnualCtcInr);
 const min=num(draft.minimumAnnualCtcInr),max=num(draft.maximumAnnualCtcInr);
 if(fixed!==null&&variable!==null){
  const total=fixed+variable;
  if(min!==null&&total<min)notes.push("Fixed plus variable compensation is below the stated minimum CTC. Review whether the amounts share the same annual basis.");
  if(max!==null&&total>max)notes.push("Fixed plus variable compensation exceeds the stated maximum CTC. Review whether the amounts share the same annual basis.");
 }
 if(draft.bondAmountInr!==""&&draft.bondMonths==="")
  notes.push("Bond amount is supplied without a duration; clarify the agreement before sharing.");
 if(draft.bondMonths!==""&&draft.bondAmountInr==="")
  notes.push("Bond duration is supplied without an amount; confirm whether a monetary bond applies.");
 return notes;
}
