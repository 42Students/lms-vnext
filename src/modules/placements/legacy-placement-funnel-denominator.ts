/** The legacy JourneyStrip used registered students for "looking", not
 * application count. Never treat an unavailable/NaN denominator as a valid
 * zero, and never substitute accepted offer count for unique learners. */
export function legacyPlacementFunnelDenominator(metrics:{
 registered:number;studentsPlaced:number;
}){
 const valid=Number.isSafeInteger(metrics.registered)&&metrics.registered>=0;
 const placed=Number.isSafeInteger(metrics.studentsPlaced)&&metrics.studentsPlaced>=0
  ?metrics.studentsPlaced:null;
 const registered=valid?metrics.registered:null;
 const ratePercent=registered!==null&&registered>0&&placed!==null
  ?100*placed/registered:null;
 return {
  state:valid?"RECORDED" as const:"UNAVAILABLE" as const,
  registered,
  registeredForLegacyStats:registered??0,
  ratePercent,
  note:!valid
   ?"Registration data unavailable; placement conversion cannot be calculated."
   :registered===0
    ?"No registered learners in the selected scope; placement conversion is not defined."
    :"Conversion uses distinct registered learners as the denominator; placed counts depend on the college's counts-as-placed policy.",
 };
}
