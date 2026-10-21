export type HiringStageCounts={applied:number;shortlisted:number;assessment:number;interview:number;offered:number;hired:number};
export const HIRING_STAGES=[
 {key:"applied",label:"Applied"}, {key:"shortlisted",label:"Shortlisted"},
 {key:"assessment",label:"Assessment"}, {key:"interview",label:"Interview"},
 {key:"offered",label:"Offered"}, {key:"hired",label:"Hired"},
] as const;
export function hiringMetricLabel(key:string):string {
 return key==="totalApplications"?"Total Applications":key.replace(/([A-Z])/g," $1").replace(/^./,x=>x.toUpperCase());
}
/** Sum the append-only ever-reached history source, never current-stage
 * snapshots. A candidate that reached a late stage implicitly progressed
 * through earlier milestones, even when a transition was not recorded. */
export function historicalHiringTotals(rows:readonly HiringStageCounts[]):HiringStageCounts{
 const sums=rows.reduce<HiringStageCounts>((total,row)=>({
  applied:total.applied+row.applied,
  shortlisted:total.shortlisted+row.shortlisted,
  assessment:total.assessment+row.assessment,
  interview:total.interview+row.interview,
  offered:total.offered+row.offered,
  hired:total.hired+row.hired,
 }),{applied:0,shortlisted:0,assessment:0,interview:0,offered:0,hired:0});
 const stages=[...HIRING_STAGES].reverse();
 let previous=0;
 for(const stage of stages){
  const reached=Math.max(0,Math.trunc(sums[stage.key]),previous);
  sums[stage.key]=reached;
  previous=reached;
 }
 return sums;
}

export function hiringFunnel(totals:HiringStageCounts){
 const max=Math.max(1,...HIRING_STAGES.map(step=>totals[step.key]));
 return HIRING_STAGES.map((step,index)=>{
  const current=totals[step.key];
  const previous=index>0?HIRING_STAGES[index-1]:undefined;
  const prior=previous?totals[previous.key]:null;
  return {key:step.key,label:step.label,count:current,
   percentPrevious:prior===null||prior===0?null:Math.round(current/prior*100),
   widthPercent:Math.max(0,Math.min(100,Math.round(current/max*100)))};
 });
}
