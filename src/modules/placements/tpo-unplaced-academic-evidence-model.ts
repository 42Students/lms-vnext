/** TPO-calendar-reports-43: only persisted placement academic evidence is
 * surfaced. No grade-to-percent conversion or absent marks are invented. */
export type UnplacedAcademicEvidence={
 tenthPctBasisPoints:number|null;twelfthPctBasisPoints:number|null;
 diplomaPctBasisPoints:number|null;undergraduatePctBasisPoints:number|null;
 source:string;verifiedAt:Date|null;
};
export function projectTpoUnplacedAcademic(row:UnplacedAcademicEvidence|null|undefined){
 if(!row)return {lowestRecordedPercent:null,undergraduatePercent:null,verification:"Not recorded"};
 const marks=[row.tenthPctBasisPoints,row.twelfthPctBasisPoints,
  row.diplomaPctBasisPoints,row.undergraduatePctBasisPoints]
  .filter((number):number is number=>number!==null&&Number.isFinite(number));
 return {lowestRecordedPercent:marks.length?Math.min(...marks)/100:null,
  undergraduatePercent:row.undergraduatePctBasisPoints===null?null:row.undergraduatePctBasisPoints/100,
  verification:row.source==="VERIFIED"&&row.verifiedAt?"Verified":"Not verified"};
}
export function formatUnplacedPercentage(value:number|null){
 return value===null?"Not recorded":new Intl.NumberFormat("en-IN",{maximumFractionDigits:2}).format(value)+"%";
}
