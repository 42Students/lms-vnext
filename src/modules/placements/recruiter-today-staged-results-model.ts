export type StagedRoundResultCount={roundId:string;roundName:string;jobId:string;jobTitle:string;count:number};
/** Pure, disclosure-minimized projection: no applicant or result identity. */
export function recruiterTodayStagedResultsWaiting(values:readonly StagedRoundResultCount[]){
 return values.filter(row=>Number.isSafeInteger(row.count)&&row.count>0)
  .map(row=>({id:"submitted-results:"+row.roundId,
   title:"Results for "+row.roundName+" are with the placement cell",
   detail:row.jobTitle+" · "+row.count+" "+(row.count===1?"result":"results")+
    " waiting for the placement cell to apply",
  }));
}
