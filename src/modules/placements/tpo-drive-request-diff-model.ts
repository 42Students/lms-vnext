/** The persisted event snapshot includes only the seven legacy comparison
 * categories. Personal identity and uploaded receipts never enter activity metadata. */
const FIELDS=[
 ["Role",["title"]],
 ["Description",["description"]],
 ["Location",["location","workMode","driveMode"]],
 ["Pay packages",["ctcLpa","fixedLpa","variableLpa","stipendMonthlyInr","minimumAnnualCtcInr","maximumAnnualCtcInr"]],
 ["Eligibility",["minimumCgpa","maximumActiveBacklogs","branches","passingYear"]],
 ["Deadline",["applicationDeadline"]],
] as const;
export function tpoComparableDriveSnapshot(raw:unknown):Record<string,string>{
 const source=raw&&typeof raw==="object"&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
 const result:Record<string,string>={};
 for(const [,keys] of FIELDS)for(const key of keys){
  const value=source[key];
  result[key]=typeof value==="string"?value.slice(0,5000):
   Array.isArray(value)?value.filter((item):item is string=>typeof item==="string").slice(0,30).join(", ").slice(0,1000):"";
 }
 return result;
}
export type TpoDriveRequestDifference={label:string;before:string;after:string;changed:boolean};
export function tpoDriveRequestDifferences(before:unknown,after:unknown):TpoDriveRequestDifference[]{
 const prior=tpoComparableDriveSnapshot(before),current=tpoComparableDriveSnapshot(after);
 return FIELDS.map(([label,keys])=>{
  const render=(doc:Record<string,string>)=>keys.map(key=>doc[key]).filter(Boolean).join(" · ");
  const oldValue=render(prior),newValue=render(current);
  return {label,before:oldValue,after:newValue,changed:oldValue!==newValue};
 });
}
