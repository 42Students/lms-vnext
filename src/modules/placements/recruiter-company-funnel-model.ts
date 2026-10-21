export type RecruiterCompanyFunnelCounts={
 applied:number;shortlisted:number;assessment:number;interview:number;offered:number;hired:number;
};
/** Applied/Test/Placed in the old portal do not all measure the same facts
 * as recruiter-visible Shared/Assessment/Hired in vNext. Retain truthful
 * modern metric captions, and disclose the old labels in the contract. */
const labels=["Shared applicants","Shortlisted","Assessment","Interview","Offered","Hired"] as const;
const legacyLabels=["Applied","Shortlisted","Test","Interview","Offered","Placed"] as const;
const keys=["applied","shortlisted","assessment","interview","offered","hired"] as const;
export function buildRecruiterReportFunnel(counts:RecruiterCompanyFunnelCounts){
 return keys.map((key,index)=>{
  const raw=Number(counts[key]);
  const rawPrevious=index===0?raw:Number(counts[keys[index-1]!]);
  const invalidCount=!Number.isFinite(raw)||raw<0||!Number.isInteger(raw);
  const total=Number.isFinite(raw)?Math.max(0,Math.trunc(raw)):0;
  const previous=Number.isFinite(rawPrevious)?Math.max(0,Math.trunc(rawPrevious)):0;
  const appliedRaw=Number(counts.applied);
  const appliedPercentRaw=appliedRaw>0&&Number.isFinite(appliedRaw)?100*total/appliedRaw:0;
  return {
   label:labels[index]!,legacyLabel:legacyLabels[index]!,
   semanticChange:labels[index]!==legacyLabels[index],
   total,rawTotal:raw,invalidCount,
   backwardsStage:index>0&&total>previous,
   appliedPercentRaw,
   appliedPercent:Math.max(0,Math.min(100,appliedPercentRaw)),
   previousPercentLabel:previous===0?"—":Math.round(total/previous*100)+"%",
  };
 });
}
