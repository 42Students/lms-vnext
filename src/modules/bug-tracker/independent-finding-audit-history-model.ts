/** Older imported event rows may lack JSON snapshots. Render a precise,
 * bounded diff of the public audit fields without dumping arbitrary payloads. */
export type IndependentFindingAuditChange={
 label:string;before:string;after:string;
};
const object=(v:unknown):v is Record<string,unknown> =>
 typeof v==="object"&&v!==null&&!Array.isArray(v);
const label=(field:string)=>({
 status:"Status",severity:"Severity",assignee:"Assignee",
 duplicateOf:"Duplicate",fixCommits:"Fix commits",
} as Record<string,string>)[field]??field;
function commits(value:unknown):string{
 if(!Array.isArray(value))return "None";
 const rows:string[]=[];
 for(const item of value.slice(0,40)){
  if(!object(item)||typeof item["repo"]!=="string"||typeof item["sha"]!=="string")continue;
  const repo=item["repo"].trim(),sha=item["sha"].trim();
  if(!/^[A-Za-z0-9._/-]{1,80}$/.test(repo)||!/^[0-9a-f]{7,40}$/i.test(sha))continue;
  rows.push(repo+"@"+sha);
 }
 return rows.length?rows.join(", "):"None";
}
function text(value:unknown):string{
 if(value===null||value===undefined||value==="")return "None";
 if(typeof value==="string")return value.slice(0,150);
 if(typeof value==="number"&&Number.isFinite(value))return String(value);
 return "Not recorded";
}
export function independentFindingHistoryChanges(
 before:unknown,after:unknown,
):IndependentFindingAuditChange[]{
 const a=object(before)?before:{},b=object(after)?after:{};
 return (["status","severity","assignee","duplicateOf","fixCommits"] as const)
  .flatMap(key=>{
   if(!(key in a)&&!(key in b))return [];
   const prev=key==="fixCommits"?commits(a[key]):text(a[key]);
   const next=key==="fixCommits"?commits(b[key]):text(b[key]);
   return prev===next?[]:[{label:label(key),before:prev,after:next}];
  });
}
