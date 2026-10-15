"use client";
import {useEffect,useState} from "react";
type Fields={marksheets:string;waitingSince:string;sectionId:string;batchId:string;branchId:string};
const empty:Fields={marksheets:"ANY",waitingSince:"",sectionId:"",batchId:"",branchId:""};
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function VerificationFilterPanel({query,onApply}:{query:Record<string,string>;onApply:(filters:Fields)=>void}){
 const selected=():Fields=>({marksheets:query.marksheets??"ANY",waitingSince:query.waitingSince??"",
  sectionId:query.sectionId??"",batchId:query.batchId??"",branchId:query.branchId??""});
 const [fields,setFields]=useState<Fields>(selected),[error,setError]=useState("");
 useEffect(()=>{setFields(selected());},[query.marksheets,query.waitingSince,query.sectionId,query.batchId,query.branchId]);
 const change=(key:keyof Fields,value:string)=>setFields(old=>({...old,[key]:value}));
 function apply(value:Fields){
  for(const key of ["sectionId","batchId","branchId"] as const){
   if(value[key]&&!uuid.test(value[key])){setError(key+" must be a valid UUID");return;}
  }
  setError("");onApply(value);
 }
 return <details className="min-w-0 rounded-lg border p-3">
  <summary className="cursor-pointer text-sm font-medium">More filters: marksheets, batch, branch, class, waiting since</summary>
  <form className="mt-3 space-y-3" onSubmit={e=>{e.preventDefault();apply(fields);}}>
   <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
    <label className="min-w-0 text-sm">Marksheets
     <select value={fields.marksheets} onChange={e=>change("marksheets",e.target.value)}
      className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2">
      <option value="ANY">Any</option><option value="MISSING">Missing</option><option value="PRESENT">Present</option>
     </select></label>
    <label className="min-w-0 text-sm">Waiting since (submitted on/before)
     <input type="date" value={fields.waitingSince} onChange={e=>change("waitingSince",e.target.value)}
      className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2"/></label>
    {(["sectionId","batchId","branchId"] as const).map(key=>
     <label className="min-w-0 text-sm" key={key}>{key==="sectionId"?"Class/section":key==="batchId"?"Batch":"Branch"} ID
      <input type="text" value={fields[key]} onChange={e=>change(key,e.target.value.trim())}
       placeholder="UUID" className="mt-1 block w-full min-w-0 rounded-md border bg-background p-2"/></label>)}
   </div>
   {error&&<p role="alert" className="text-sm">{error}</p>}
   <div className="flex flex-wrap gap-2">
    <button type="submit" className="rounded-md border px-3 py-2 text-sm">Apply filters</button>
    <button type="button" onClick={()=>{setFields(empty);apply(empty);}} className="rounded-md border px-3 py-2 text-sm">Clear extra filters</button>
   </div>
  </form>
 </details>;
}
