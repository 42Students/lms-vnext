export type RecruiterCompanyFunnelCounts={
 applied:number;shortlisted:number;assessment:number;interview:number;offered:number;hired:number;
};
const labels=["Shared applicants","Shortlisted","Assessment","Interview","Offered","Hired"] as const;
const keys=["applied","shortlisted","assessment","interview","offered","hired"] as const;
export function buildRecruiterReportFunnel(counts:RecruiterCompanyFunnelCounts){
 return keys.map((key,index)=>{
  const total=Math.max(0,Number(counts[key])||0);
  const previous=index===0?total:Math.max(0,Number(counts[keys[index-1]!])||0);
  return {
   label:labels[index]!,total,
   appliedPercent:Math.max(0,Math.min(100,Number(counts.applied)>0?100*total/Number(counts.applied):0)),
   previousPercentLabel:previous===0?"—":Math.round(total/previous*100)+"%",
  };
 });
}
