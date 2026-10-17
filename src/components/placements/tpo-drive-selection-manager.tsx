"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
type Candidate={applicationId:string;name:string;email?:string|null;roleTitle:string;offerReady:boolean;alreadyOffered:boolean};
type RoleOption={id:string;title:string;annualCtcInr:number|null};
type Selection={id:string;applicationId:string;name:string;roleTitle:string;annualCtcInr:number|null;status:string;recordedAt:string;offerReady:boolean;releasedOfferId:string|null};
type Result={selectionId:string;applicationId:string;status:string;reason?:string};
export function TpoDriveSelectionManager({jobId,candidates,selections,roleOptions}:{jobId:string;candidates:Candidate[];selections:Selection[];roleOptions:RoleOption[]}){
 const router=useRouter();const [mode,setMode]=useState<"RECORD"|"VERIFY_AND_RELEASE"|null>(null);
 const [chosen,setChosen]=useState<string[]>([]);const [role,setRole]=useState("");
 const [lpa,setLpa]=useState("");const [pending,setPending]=useState(false);
 const [search,setSearch]=useState("");
 const [error,setError]=useState("");const [report,setReport]=useState<Result[]>([]);
 const existing=new Set(selections.map(s=>s.applicationId));
 const recordable=candidates.filter(c=>c.offerReady&&!c.alreadyOffered&&!existing.has(c.applicationId));
 const releasable=selections.filter(s=>s.status!=="RELEASED");
 const visibleRecordable=recordable.filter(c=>(c.name+" "+c.email+" "+c.roleTitle).toLocaleLowerCase("en-IN").includes(search.toLocaleLowerCase("en-IN")));
 const visibleReleasable=releasable.filter(s=>(s.name+" "+s.roleTitle).toLocaleLowerCase("en-IN").includes(search.toLocaleLowerCase("en-IN")));
 function open(next:"RECORD"|"VERIFY_AND_RELEASE"){setMode(next);setChosen([]);setSearch("");setError("");setReport([]);}
 function toggle(id:string){setChosen(previous=>previous.includes(id)?previous.filter(x=>x!==id):
  previous.length<100?[...previous,id]:previous);}
 async function submit(){
  if(!mode||!chosen.length||pending)return;
  if(mode==="RECORD"&&(!role.trim()||lpa!==""&&(!Number.isFinite(Number(lpa))||Number(lpa)<0||Number(lpa)>1000))){
   setError("Provide a role and a package between 0 and 1000 LPA, or leave package blank.");return;
  }
  const body=mode==="RECORD"?{action:"RECORD",entries:chosen.map(applicationId=>({
   applicationId,roleTitle:role.trim(),annualCtcInr:lpa===""?null:Math.round(Number(lpa)*100000),
  }))}:{action:"VERIFY_AND_RELEASE",confirmed:true,selectionIds:chosen,
   expectedRecordedAt:Object.fromEntries(selections.filter(s=>chosen.includes(s.id)).map(s=>[s.id,s.recordedAt]))};
  setPending(true);setError("");
  try{
   const response=await fetch("/api/placements/tpo/jobs/"+encodeURIComponent(jobId)+"/selections",{
    method:"POST",credentials:"same-origin",headers:{"content-type":"application/json"},body:JSON.stringify(body),
   });
   const payload=await response.json().catch(()=>null) as {error?:string;issues?:Array<{message:string}>;results?:Result[]}|null;
   if(!response.ok)throw Error(payload?.issues?.[0]?.message??payload?.error??"Selection action failed");
   setReport(payload?.results??[]);setChosen([]);
   if(mode==="RECORD")setMode(null);
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save");}finally{setPending(false);}
 }
 return <section className="space-y-4">
  <div className="flex flex-wrap gap-3">
   <button type="button" onClick={()=>open("RECORD")} disabled={!recordable.length}
    className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">Record a selection</button>
   <button type="button" onClick={()=>open("VERIFY_AND_RELEASE")} disabled={!releasable.length}
    className="min-h-11 rounded border border-primary px-4 text-sm font-semibold text-primary-text disabled:opacity-50">
    Verify and release ({releasable.length})</button>
  </div>
  <p className="text-sm text-body">Selection alone does not issue an offer. Verify and release only after checking the company's selection list.</p>
  <div className="overflow-x-auto rounded border border-border bg-surface"><table className="min-w-full text-left text-sm">
   <thead><tr><th className="p-3">Student</th><th className="p-3">Role</th><th className="p-3">Package</th><th className="p-3">Stage</th></tr></thead>
   <tbody>{selections.length?selections.map(s=><tr key={s.id} className="border-t border-border">
    <td className="p-3">{s.name}</td><td className="p-3">{s.roleTitle}</td>
    <td className="p-3">{s.annualCtcInr==null?"Not recorded":"₹"+(s.annualCtcInr/100000).toLocaleString("en-IN")+" LPA"}</td>
    <td className="p-3">{s.status==="RELEASED"?"Released":s.status==="VERIFIED"?"Verified, release pending":"Selected"}</td>
   </tr>):<tr><td colSpan={4} className="p-4 text-body">No selections yet.</td></tr>}</tbody>
  </table></div>
  {report.length&&!mode?<p role="status">{report.filter(r=>r.status==="released").length} offers released.</p>:null}
  {mode?<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
   <div role="dialog" aria-modal="true" aria-label={mode==="RECORD"?"Record selections":"Verify and release selections"}
    className="max-h-[90vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-xl">
    <h2 className="text-lg font-semibold">{mode==="RECORD"?"Record the company's selections":"Verify and release selections"}</h2>
    <p className="text-sm text-body">{mode==="RECORD"
      ?"Choose selected students and enter their package. Nothing is sent until release."
      :"Releasing issues offers immediately. Eligibility, held-offer limits and response deadlines are rechecked for each student. Skipped rows will be reported."}</p>
    {mode==="RECORD"?<label className="grid gap-1 text-sm">Package from this drive
     <select className="min-h-11 rounded border border-border bg-surface px-3" defaultValue=""
      onChange={e=>{const option=roleOptions.find(o=>o.id===e.target.value);
        if(option){setRole(option.title);setLpa(option.annualCtcInr==null?"":String(option.annualCtcInr/100000));}}}>
      <option value="">Choose a role package or enter manually</option>
      {roleOptions.map(o=><option value={o.id} key={o.id}>{o.title}{o.annualCtcInr==null?"":" · ₹"+(o.annualCtcInr/100000).toLocaleString("en-IN")+" LPA"}</option>)}
     </select></label>:null}
    {mode==="RECORD"?<div className="grid gap-3 sm:grid-cols-2">
     <label className="grid gap-1 text-sm">Role<input required value={role} onChange={e=>setRole(e.target.value)}
      maxLength={200} className="min-h-11 rounded border border-border bg-surface px-3"/></label>
     <label className="grid gap-1 text-sm">Package (LPA, optional)<input type="number" min={0} max={1000} step="0.01"
      value={lpa} onChange={e=>setLpa(e.target.value)} className="min-h-11 rounded border border-border bg-surface px-3"/></label>
    </div>:null}
    <label className="grid gap-1 text-sm">Find student
     <input type="search" value={search} onChange={e=>setSearch(e.target.value)} maxLength={100}
      placeholder="Search name, email or role" className="min-h-10 rounded border border-border bg-surface px-3"/>
    </label>
    <div className="flex flex-wrap gap-3 text-sm">
      <button type="button" disabled={pending} className="font-semibold text-primary-text" onClick={()=>setChosen(previous=>[
       ...new Set([...previous,...(mode==="RECORD"?visibleRecordable.map(x=>x.applicationId):visibleReleasable.map(x=>x.id))])].slice(0,100))}>
       Select matching (max 100)
      </button>
      <button type="button" disabled={pending||!chosen.length} className="font-semibold text-primary-text" onClick={()=>setChosen([])}>Clear selection</button>
    </div>
    <fieldset className="max-h-60 space-y-1 overflow-auto rounded border border-border p-3">
     <legend className="font-semibold">Students ({chosen.length} selected, maximum 100)</legend>
     {(mode==="RECORD"?visibleRecordable.map(c=>({id:c.applicationId,name:c.name,note:c.roleTitle})):
       visibleReleasable.map(s=>({id:s.id,name:s.name,note:s.roleTitle+(s.offerReady?"":" · Needs eligibility review")})))
       .map(item=><label key={item.id} className="flex min-h-10 items-center gap-3 px-2 text-sm">
        <input type="checkbox" checked={chosen.includes(item.id)} disabled={pending} onChange={()=>toggle(item.id)}/>
        <span>{item.name} · {item.note}</span>
       </label>)}
    </fieldset>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {report.length?<div role="status" className="max-h-32 overflow-auto text-sm">
     {report.map(x=><p key={x.selectionId}>{x.status}: {x.applicationId} {x.reason??""}</p>)}
    </div>:null}
    <div className="flex gap-3">
     <button type="button" disabled={pending||!chosen.length||(mode==="RECORD"&&!role.trim())}
      onClick={()=>void submit()} className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
      {pending?"Saving…":mode==="RECORD"?"Record "+chosen.length+" selection(s)":"Verify and release "+chosen.length+" offer(s)"}</button>
     <button type="button" disabled={pending} onClick={()=>{setMode(null);setError("");}}
      className="min-h-11 rounded border border-border px-4 text-sm">Close</button>
    </div>
   </div>
  </div>:null}
 </section>;
}
