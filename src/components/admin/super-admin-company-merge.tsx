"use client";
import { useState } from "react";
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
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState("");
  async function merge(){
    if(busy||!keep||!source||keep===source)return;
    const survivor=companies.find(c=>c.id===keep)?.name??keep;
    const duplicate=companies.find(c=>c.id===source)?.name??source;
    setBusy(true);setError("");setResult("");
    try{
      const response=await fetch("/api/admin/companies/merge",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({keepCompanyId:keep,mergeCompanyId:source,confirm:true}),
      });
      const payload=await response.json().catch(()=>null);
      if(!response.ok)throw Error(payload?.error??"Company merge was rejected.");
      setConfirmOpen(false);
      setResult("Company merged. Canonical company retained; duplicate archived.");
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Unable to merge companies");}
    finally{setBusy(false);}
  }
  return <div className="mt-3 space-y-2 print:hidden">
    <label className="grid gap-1 text-xs font-semibold text-body">Keep company
      <Select className="min-h-11 w-full md:min-h-9"
        value={keep} onChange={e=>setKeep(e.target.value)}>
        {companies.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      </Select>
    </label>
    <label className="grid gap-1 text-xs font-semibold text-body">Merge duplicate
      <Select className="min-h-11 w-full md:min-h-9"
        value={source} onChange={e=>setSource(e.target.value)}>
        {companies.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      </Select>
    </label>
    <Button type="button" variant="danger" disabled={busy||keep===source} onClick={()=>setConfirmOpen(true)}
      className="min-h-11 md:min-h-9">
      {busy?"Merging…":"Review and merge"}
    </Button>
    <ConfirmDialog open={confirmOpen} onOpenChange={open=>{if(!busy)setConfirmOpen(open);}}
      title="Merge company identities?"
      description={`Merge "${companies.find(c=>c.id===source)?.name??source}" into "${companies.find(c=>c.id===keep)?.name??keep}"? Jobs and recruiter grants are reassigned. The duplicate identity is archived for audit. This cannot be undone.`}
      confirmLabel="Merge companies" confirmVariant="danger" pending={busy}
      confirmDisabled={busy||!keep||!source||keep===source} onConfirm={()=>void merge()}/>
    {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {result?<p role="status" className="text-sm text-body">{result}</p>:null}
  </div>;
}
