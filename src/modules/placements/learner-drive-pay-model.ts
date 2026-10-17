/** LEARNER-placements-R06: per-package published pay, not an invented salary. */
export function learnerDrivePayFacts(input:{
 fixedLpa?:string|null;variableLpa?:string|null;joiningBonusLpa?:string|null;
 minimumAnnualCtcInr:number|null;maximumAnnualCtcInr:number|null;
 stipendPerMonthInr?:number|null;
}){
 const amount=(value:string|null|undefined):string=>{
  if(!value||!Number.isFinite(Number(value))||Number(value)<0)return "Not disclosed";
  return "₹"+Number(value).toLocaleString("en-IN",{maximumFractionDigits:2})+" LPA";
 };
 const ctc=input.minimumAnnualCtcInr??input.maximumAnnualCtcInr;
 return {
  ctc:ctc===null?"Not disclosed":"₹"+(ctc/100000).toLocaleString("en-IN",{maximumFractionDigits:2})+" LPA"+
   (input.maximumAnnualCtcInr!==null&&input.minimumAnnualCtcInr!==null&&input.maximumAnnualCtcInr!==input.minimumAnnualCtcInr?
     " – ₹"+(input.maximumAnnualCtcInr/100000).toLocaleString("en-IN",{maximumFractionDigits:2})+" LPA":""),
  fixed:amount(input.fixedLpa),variable:amount(input.variableLpa),
  joiningBonus:amount(input.joiningBonusLpa),
  stipend:input.stipendPerMonthInr===null||input.stipendPerMonthInr===undefined?
    "Not disclosed":"₹"+input.stipendPerMonthInr.toLocaleString("en-IN")+" / month",
 };
}
