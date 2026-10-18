/** Employer-visible academic marks come from verified college records, not
 * learner JSON. A conflicting mark for one membership/level is ambiguous: do
 * not disclose whichever historical row happens to be visited last. */
export type HrVerifiedAcademicLevel="UG"|"10TH"|"12TH"|"DIPLOMA";
export type HrVerifiedMarkRow={
 membershipId:string;level:string;percentage:number|null;
};
const LEVELS:ReadonlySet<string>=new Set(["UG","10TH","12TH","DIPLOMA"]);
export function uniqueHrVerifiedAcademicMarks(rows:readonly HrVerifiedMarkRow[]){
 const values=new Map<string,number>();
 const conflicting=new Set<string>();
 for(const row of rows){
  if(!row.membershipId||!LEVELS.has(row.level)||row.percentage===null)continue;
  const key=row.membershipId+":"+row.level;
  if(!Number.isSafeInteger(row.percentage)||row.percentage<0||row.percentage>10000){
   conflicting.add(key);
   continue;
  }
  const prior=values.get(key);
  if(prior!==undefined&&prior!==row.percentage)conflicting.add(key);
  else values.set(key,row.percentage);
 }
 const result=new Map<string,Partial<Record<HrVerifiedAcademicLevel,number>>>();
 for(const [key,value] of values){
  if(conflicting.has(key))continue;
  const split=key.lastIndexOf(":");
  const memberId=key.slice(0,split);
  const level=key.slice(split+1) as HrVerifiedAcademicLevel;
  const marks=result.get(memberId)??{};
  marks[level]=value;
  result.set(memberId,marks);
 }
 return result;
}
