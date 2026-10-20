"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type Company = { id: string; name: string };
export function SuperAdminCompanyMerge({companies}:{companies:readonly Company[]}) {
  const router=useRouter();
  const [keep,setKeep]=useState(companies[0]?.id??"");
  const [source,setSource]=useState(companies[1]?.id??"");
  const [busy,setBusy]=useState(false);
  const inFlightRef=useRef(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState("");
  async function merge(){
    if(busy||inFlightRef.current||!keep||!source||keep===source)return;
    inFlightRef.current=true;
    setBusy(true);setError("");setResult("");
    try{
      const response=await fetch("/api/admin/companies/merge",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({keepCompanyId:keep,mergeCompanyId:source,confirm:true}),
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok)throw Error(payload?.error??"Company merge was rejected.");
      setConfirmOpen(false);
      setSource("");
      setResult("Company merged. Canonical company retained; duplicate archived.");
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Unable to merge companies");}
    finally{inFlightRef.current=false;setBusy(false);}
  }
  return <div className="mt-[var(--lms-space-3)] min-w-0 space-y-[var(--lms-space-3)] print:hidden">
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Keep company
      <Select className="min-h-11 w-full md:min-h-9"
        value={keep} disabled={busy} onChange={e=>{setKeep(e.target.value);setError("");setResult("");}}>
        {companies.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      </Select>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Merge duplicate
      <Select className="min-h-11 w-full md:min-h-9"
        value={source} disabled={busy} onChange={e=>{setSource(e.target.value);setError("");setResult("");}}>
        <option value="">Select company</option>
        {companies.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      </Select>
    </label>
    <p className="text-xs leading-5 text-muted-foreground">Select two different companies to review the merge.</p>
    <Button type="button" variant="danger" disabled={busy||!keep||!source||keep===source} onClick={()=>{setError("");setResult("");setConfirmOpen(true);}}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      {busy?"Merging…":"Review and merge"}
    </Button>
    <ConfirmDialog open={confirmOpen} onOpenChange={open=>{if(!busy)setConfirmOpen(open);}}
      title="Merge company identities?"
      description={`Merge "${companies.find(c=>c.id===source)?.name??source}" into "${companies.find(c=>c.id===keep)?.name??keep}"? Jobs and recruiter grants are reassigned. The duplicate identity is archived for audit. This cannot be undone.`}
      confirmLabel="Merge companies" confirmVariant="danger" pending={busy}
      confirmDisabled={busy||!keep||!source||keep===source} onConfirm={()=>void merge()}>
      {error?<p role="alert" className="break-words border-l-2 border-error bg-error-subtle p-[var(--lms-space-3)] text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {result?<p role="status" aria-live="polite" className="max-w-prose text-sm text-success-text">{result}</p>:null}
  </div>;
}
