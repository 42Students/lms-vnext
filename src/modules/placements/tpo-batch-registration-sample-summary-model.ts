import {TPO_REGISTRATION_CHOICES} from "./tpo-batch-registration-summary-model";
export function summarizeSampledBatchRegistrations(rows:readonly {choice:string|null;source:string|null}[]){
 const byChoice=Object.fromEntries(TPO_REGISTRATION_CHOICES.map(choice=>[choice,rows.filter(row=>row.choice===choice).length])) as Record<(typeof TPO_REGISTRATION_CHOICES)[number],number>;
 const unrecorded=rows.filter(row=>row.choice===null).length;
 return {sample:rows.length,recorded:rows.length-unrecorded,unrecorded,byChoice,
  bySource:{SELF:rows.filter(row=>row.source==="SELF").length,TPO:rows.filter(row=>row.source==="TPO").length,BACKFILL:rows.filter(row=>row.source==="BACKFILL").length}};
}
