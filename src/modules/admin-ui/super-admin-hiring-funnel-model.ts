export type HiringStageCounts={applied:number;shortlisted:number;assessment:number;interview:number;offered:number;hired:number};
export const HIRING_STAGES=[
 {key:"applied",label:"Applied"}, {key:"shortlisted",label:"Shortlisted"},
 {key:"assessment",label:"Assessment"}, {key:"interview",label:"Interview"},
 {key:"offered",label:"Offered"}, {key:"hired",label:"Hired"},
] as const;
export function hiringMetricLabel(key:string):string {
 return key==="totalApplications"?"Total Applications":key.replace(/([A-Z])/g," $1").replace(/^./,x=>x.toUpperCase());
}
export function hiringFunnel(totals:HiringStageCounts){
 const max=Math.max(1,...HIRING_STAGES.map(step=>totals[step.key]));
 return HIRING_STAGES.map((step,index)=>{
  const current=totals[step.key];
  const prior=index?totals[HIRING_STAGES[index-1].key]:null;
  return {key:step.key,label:step.label,count:current,
   percentPrevious:prior===null?null:prior===0?0:Math.round(current/prior*100),
   widthPercent:Math.max(0,Math.min(100,Math.round(current/max*100)))};
 });
}
