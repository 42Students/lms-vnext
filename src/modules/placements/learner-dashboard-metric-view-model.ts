/** Render unavailable placement source counts as unknown, never as zero. */
export function learnerDashboardMetricView(value:number|null,label:string,detail:string){
 if(value===null)return {
   display:"Unknown",unavailable:true,ariaLabel:label+": unavailable",
   detail:label+" could not be loaded. Open its page to retry",
 };
 return {display:String(value),unavailable:false,
   ariaLabel:label+": "+value,
   detail,
 };
}
