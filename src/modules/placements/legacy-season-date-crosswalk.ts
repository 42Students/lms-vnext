/** The old Placement Season may omit an end date; the modern operational
 * season requires a bounded end date for eligibility and scheduling.
 * An import cannot manufacture a historical end date or auto-close a season.
 */
export function legacySeasonDateCrosswalk(startDate:string,endDate?:string|null){
 const parse=(v:string)=>/^(\d{4})-(\d{2})-(\d{2})$/.test(v)&&
   !Number.isNaN(Date.parse(v+"T00:00:00Z"))&&
   new Date(v+"T00:00:00Z").toISOString().slice(0,10)===v;
 if(!parse(startDate)||endDate&&(!parse(endDate)||endDate<startDate))
   return {status:"INVALID_SOURCE" as const,startDate:null,endDate:null,requiresManualEndDate:true};
 if(!endDate)return {status:"OPEN_ENDED_LEGACY" as const,
  startDate,endDate:null,requiresManualEndDate:true};
 return {status:"BOUNDED" as const,startDate,endDate,requiresManualEndDate:false};
}
