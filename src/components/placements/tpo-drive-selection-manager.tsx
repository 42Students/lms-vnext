"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {DataTable} from "@/components/ui/data-table";
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
 const [lastRecorded,setLastRecorded]=useState(0);
 const [confirmOpen,setConfirmOpen]=useState(false);
 const existing=new Set(selections.map(s=>s.applicationId));
 const recordable=candidates.filter(c=>c.offerReady&&!c.alreadyOffered&&!existing.has(c.applicationId));
 const releasable=selections.filter(s=>s.status==="SELECTED"||s.status==="VERIFIED");
 const visibleRecordable=recordable.filter(c=>(c.name+" "+c.email+" "+c.roleTitle).toLocaleLowerCase("en-IN").includes(search.toLocaleLowerCase("en-IN")));
 const visibleReleasable=releasable.filter(s=>(s.name+" "+s.roleTitle).toLocaleLowerCase("en-IN").includes(search.toLocaleLowerCase("en-IN")));
 function open(next:"RECORD"|"VERIFY_AND_RELEASE"){setMode(next);setChosen([]);setSearch("");setError("");setReport([]);}
 function toggle(id:string){setChosen(previous=>previous.includes(id)?previous.filter(x=>x!==id):
  previous.length<100?[...previous,id]:previous);}
 async function submit(confirmed=false){
  if(!mode||!chosen.length||pending)return;
  if(mode==="RECORD"&&(!role.trim()||lpa!==""&&(!Number.isFinite(Number(lpa))||Number(lpa)<0||Number(lpa)>1000))){
   setError("Provide a role and a package between 0 and 1000 LPA, or leave package blank.");return;
  }
  if(mode==="VERIFY_AND_RELEASE"&&!confirmed){setConfirmOpen(true);return;}
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
   if(!response.ok)throw Error(response.status===409
    ?"Selections changed while you were reviewing. Refresh and check the selected students before retrying."
    :"Could not complete the selection action. Your selected students are preserved; try again.");
   setReport(payload?.results??[]);setChosen([]);
   if(mode==="RECORD"){setLastRecorded(chosen.length);setMode(null);}
   router.refresh();
  }catch(e){setError(e instanceof Error?e.message:"Unable to save");}finally{setPending(false);setConfirmOpen(false);}
 }
 return <section className="space-y-4">
  <div className="flex flex-wrap gap-3">
   <button type="button" onClick={()=>open("RECORD")} disabled={!recordable.length}
    className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] disabled:opacity-50 text-primary-foreground">Record a selection</button>
   <button type="button" onClick={()=>open("VERIFY_AND_RELEASE")} disabled={!releasable.length}
    className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] disabled:opacity-50">
    Verify and release ({releasable.length})</button>
  </div>
  {lastRecorded>0?<p role="status" className="text-sm font-semibold">{lastRecorded} selection(s) recorded, not yet released.</p>:null}
  <p className="text-sm text-body">Selection alone does not issue an offer. Verify and release only after checking the company&apos;s selection list.</p>
  <DataTable<(typeof selections)[number]> caption="Recorded selections"
    rows={selections} getRowKey={row=>row.id}
    empty={<p role="status">No selections yet.</p>}
    columns={[
      {key:"student",header:"Student",mobilePriority:"primary",cell:row=><strong>{row.name}</strong>},
      {key:"role",header:"Role",mobilePriority:"secondary",cell:row=>row.roleTitle},
      {key:"package",header:"Package",mobilePriority:"secondary",cell:row=>row.annualCtcInr==null
        ?"Not recorded":"₹"+(row.annualCtcInr/100000).toLocaleString("en-IN")+" LPA"},
      {key:"stage",header:"Stage",mobilePriority:"secondary",cell:row=>row.status==="RELEASED"
        ?"Released":row.status==="VERIFIED"?"Verified, release pending":"Selected"},
    ]}/>
  {report.length&&!mode?<p role="status">{report.filter(r=>r.status==="released").length} offers released.</p>:null}
  <Dialog open={mode!==null} onOpenChange={next=>{if(!next&&!pending){setMode(null);setError("");}}}
    dismissible={!pending} title={mode==="RECORD"?"Record the company's selections":"Verify and release selections"}>
    <div className="min-w-0 space-y-4">
    <p className="text-sm text-body">{mode==="RECORD"
      ?"Choose selected students and enter their package. Nothing is sent until release."
      :"Releasing issues offers immediately. Eligibility, held-offer limits and response deadlines are rechecked for each student. Skipped rows will be reported."}</p>
    {mode==="VERIFY_AND_RELEASE" && chosen.length>0 ? <p role="status" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm">
      {chosen.length} selections · {selections.filter(s=>chosen.includes(s.id)&&s.offerReady).length} ready to verify · {selections.filter(s=>chosen.includes(s.id)&&!s.offerReady).length} need review.
      Successful releases issue official offers and notify learners.
    </p>:null}
    {mode==="RECORD"?<label className="grid gap-1 text-sm">Package from this drive
     <select className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3" defaultValue=""
      onChange={e=>{const option=roleOptions.find(o=>o.id===e.target.value);
        if(option){setRole(option.title);setLpa(option.annualCtcInr==null?"":String(option.annualCtcInr/100000));}}}>
      <option value="">Choose a role package or enter manually</option>
      {roleOptions.map(o=><option value={o.id} key={o.id}>{o.title}{o.annualCtcInr==null?"":" · ₹"+(o.annualCtcInr/100000).toLocaleString("en-IN")+" LPA"}</option>)}
     </select></label>:null}
    {mode==="RECORD"?<div className="grid gap-3 sm:grid-cols-2">
     <label className="grid gap-1 text-sm">Role<input required value={role} onChange={e=>setRole(e.target.value)}
      maxLength={200} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"/></label>
     <label className="grid gap-1 text-sm">Package (LPA, optional)<input type="number" min={0} max={1000} step="0.01"
      value={lpa} onChange={e=>setLpa(e.target.value)} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"/></label>
    </div>:null}
    <label className="grid gap-1 text-sm">Find student
     <input type="search" value={search} onChange={e=>setSearch(e.target.value)} maxLength={100}
      placeholder="Search name, email or role" className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3"/>
    </label>
    <div className="flex flex-wrap gap-3 text-sm">
      <button type="button" disabled={pending} className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-[var(--lms-teal-deep)]" onClick={()=>setChosen(previous=>[
       ...new Set([...previous,...(mode==="RECORD"?visibleRecordable.map(x=>x.applicationId):visibleReleasable.map(x=>x.id))])].slice(0,100))}>
       Select matching (max 100)
      </button>
      <button type="button" disabled={pending||!chosen.length} className="inline-flex min-h-11 md:min-h-9 items-center font-semibold text-[var(--lms-teal-deep)]" onClick={()=>setChosen([])}>Clear selection</button>
    </div>
    <fieldset className="max-h-60 min-h-0 divide-y divide-border overflow-auto overscroll-contain rounded-[var(--lms-canvas-radius)] border border-border px-3 [mask-image:linear-gradient(to_bottom,black_0%,black_88%,transparent_100%)]">
     <legend className="font-semibold">Students ({chosen.length} selected, maximum 100)</legend>
     {(mode==="RECORD"?visibleRecordable.map(c=>({id:c.applicationId,name:c.name,note:c.roleTitle})):
       visibleReleasable.map(s=>({id:s.id,name:s.name,note:s.roleTitle+(s.offerReady?"":" · Needs eligibility review")})))
       .map(item=><label key={item.id} className="flex min-h-11 items-center gap-3 px-2 text-sm hover:bg-muted md:min-h-9">
        <input type="checkbox" checked={chosen.includes(item.id)} disabled={pending} onChange={()=>toggle(item.id)}/>
        <span>{item.name} · {item.note}</span>
       </label>)}
    </fieldset>
    {error?<p role="alert" className="text-sm text-foreground">{error}</p>:null}
    {report.length?<div role="status" tabIndex={0} aria-label="Selection release results, scroll for more" className="max-h-32 min-h-0 overflow-auto overscroll-contain rounded-[var(--lms-control-radius)] border border-border p-2 text-sm [mask-image:linear-gradient(to_bottom,black_0%,black_85%,transparent_100%)]">
     {report.map(x=><p key={x.selectionId}>{x.status}: {x.applicationId} {x.reason??""}</p>)}
    </div>:null}
    <div className="flex gap-3">
     <button type="button" disabled={pending||!chosen.length||(mode==="RECORD"&&!role.trim())}
      onClick={()=>void submit()} className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-[650] disabled:opacity-50 text-primary-foreground">
      {pending?"Saving…":mode==="RECORD"?"Record "+chosen.length+" selection(s)":"Verify and release "+chosen.length+" offer(s)"}</button>
     <button type="button" disabled={pending} onClick={()=>{setMode(null);setError("");}}
      className="min-h-11 md:min-h-9 rounded-[var(--lms-control-radius)] border border-border px-4 text-sm">Close</button>
    </div>
    </div>
  </Dialog>
  <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} pending={pending}
    title={"Verify and release "+chosen.length+" selection(s)?"}
    description={selections.filter(item=>chosen.includes(item.id)&&!item.offerReady).length+
      " currently need eligibility review and may be skipped. Official offers and learner notifications are issued immediately for successful rows. This cannot be undone from this dialog."}
    confirmLabel="Verify and release" onConfirm={()=>void submit(true)}/>

 </section>;
}
