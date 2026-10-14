"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
export function CollegeOfferingMetadataAction({offering}:{
  offering:{id:string;courseName:string;type:"CORE"|"ELECTIVE";credits:number|null;
    displayOrder:number;updatedAt:string};
}) {
  const router=useRouter();
  const [open,setOpen]=useState(false),[pending,start]=useTransition(),[error,setError]=useState("");
  const [type,setType]=useState<"CORE"|"ELECTIVE">(offering.type);
  const [credits,setCredits]=useState(offering.credits===null?"":String(offering.credits));
  const [displayOrder,setDisplayOrder]=useState(String(offering.displayOrder));
  function save(){
    if(!window.confirm("Save course offering metadata for "+offering.courseName+
      "? Type and credit edits are blocked when active deliveries depend on this offering."))return;
    setError("");
    start(async()=>{
      try{
        const body={type,credits:credits.trim()?Number(credits):null,
          displayOrder:Number(displayOrder),expectedUpdatedAt:offering.updatedAt,confirm:true};
        const response=await fetch("/api/college/offerings/"+encodeURIComponent(offering.id)+"/metadata",{
          method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(body),
        });
        if(!response.ok){
          const payload=await response.json().catch(()=>({error:"OFFERING_EDIT_FAILED"})) as {error?:string};
          throw new Error(payload.error??"OFFERING_EDIT_FAILED");
        }
        setOpen(false);router.refresh();
      }catch(err){setError(err instanceof Error?err.message:"Offering edit failed");}
    });
  }
  return <div className="space-y-1">
    <button type="button" disabled={pending} onClick={()=>setOpen(true)}
      className="min-h-10 rounded-md border border-border px-3 text-sm font-semibold text-primary-text">Edit</button>
    {open?<div role="dialog" aria-modal="true" aria-label={"Edit offering "+offering.courseName}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">Edit course offering</h2>
        <label className="grid gap-1 text-sm font-semibold text-body">Offering type
          <select value={type} onChange={e=>setType(e.target.value as "CORE"|"ELECTIVE")}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
            <option value="CORE">Core</option><option value="ELECTIVE">Elective</option>
          </select></label>
        <label className="grid gap-1 text-sm font-semibold text-body">Credits (optional)
          <input type="number" min={1} max={30} value={credits}
            onChange={e=>setCredits(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Display order
          <input type="number" min={0} max={10000} required value={displayOrder}
            onChange={e=>setDisplayOrder(e.target.value)}
            className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
        </label>
        {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={()=>setOpen(false)} disabled={pending}
            className="min-h-11 rounded-md border border-border px-4 text-sm font-semibold text-primary-text">Cancel</button>
          <button type="button" onClick={save} disabled={pending}
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
            {pending?"Saving…":"Confirm edit"}</button>
        </div>
      </div>
    </div>:null}
    {!open&&error?<p role="alert" className="text-xs text-error">{error}</p>:null}
  </div>;
}
