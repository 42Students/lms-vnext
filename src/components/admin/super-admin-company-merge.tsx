"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {useToast} from "@/components/ui/toast";
import {Button} from "@/components/ui/button";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";

type Company = { id: string; name: string };
export function SuperAdminCompanyMerge({companies}:{companies:readonly Company[]}) {
  const router=useRouter(),{showToast}=useToast();
  const [keep,setKeep]=useState(companies[0]?.id??"");
  const [source,setSource]=useState(companies[1]?.id??"");
  const [busy,setBusy]=useState(false);
  const inFlightRef=useRef(false);
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [error,setError]=useState("");
  const [result,setResult]=useState("");
  const [searchTerm,setSearchTerm]=useState("");
  const [targetOptions,setTargetOptions]=useState<Company[]>([]);
  const [targetPage,setTargetPage]=useState(0);
  const [moreTargets,setMoreTargets]=useState(false);
  const [searching,setSearching]=useState(false);
  const searchSeq=useRef(0);
  const allCompanies=[...new Map([...companies,...targetOptions].map(item=>[item.id,item])).values()];
  async function searchTargets(nextPage:number){
   const seq=++searchSeq.current;
   setSearching(true);setError("");
   try{
    const params=new URLSearchParams({q:searchTerm.trim(),page:String(nextPage)});
    const response=await fetch("/api/admin/companies/merge-targets?"+params,{
      credentials:"same-origin",cache:"no-store",
    });
    if(!response.ok)throw Error("Could not search the authorized companies. Check the selected college and retry.");
    const data=await response.json() as {items:Company[];page:number;more:boolean};
    if(searchSeq.current!==seq)return;
    setTargetOptions(current=>nextPage===1?data.items:[
      ...new Map([...current,...data.items].map(item=>[item.id,item])).values(),
    ]);
    setTargetPage(data.page);setMoreTargets(data.more);
   }catch(cause){if(searchSeq.current===seq)setError(cause instanceof Error?cause.message:"Company search unavailable.");}
   finally{if(searchSeq.current===seq)setSearching(false);}
  }
  async function merge(){
    if(busy||inFlightRef.current||!keep||!source||keep===source){
      setError("Pick two different companies.");return;
    }
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
      showToast({tone:"success",title:"Merged"});
      router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Unable to merge companies");}
    finally{inFlightRef.current=false;setBusy(false);}
  }
  return <div className="mt-[var(--lms-space-3)] min-w-0 space-y-[var(--lms-space-3)] print:hidden">
    <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
        Search merge targets in the selected college
        <Input value={searchTerm} maxLength={100} disabled={busy||searching}
          onChange={event=>setSearchTerm(event.target.value)}
          placeholder="Company name or domain" className="min-h-11 md:min-h-9"/>
      </label>
      <Button type="button" variant="secondary" disabled={busy||searching}
        onClick={()=>void searchTargets(1)} className="min-h-11 md:min-h-9">
        {searching?"Searching…":"Search"}
      </Button>
      <Button type="button" variant="secondary" disabled={busy||searching||!moreTargets}
        onClick={()=>void searchTargets(targetPage+1)} className="min-h-11 md:min-h-9">
        More results
      </Button>
    </div>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Keep company
      <Select className="min-h-11 w-full md:min-h-9"
        value={keep} disabled={busy} onChange={e=>{setKeep(e.target.value);setError("");setResult("");}}>
        {allCompanies.filter(x=>x.id!==source).map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      </Select>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Merge duplicate
      <Select className="min-h-11 w-full md:min-h-9"
        value={source} disabled={busy} onChange={e=>{setSource(e.target.value);setError("");setResult("");}}>
        <option value="">Select company</option>
        {companies.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
      </Select>
    </label>
    <p className="text-xs leading-5 text-muted-foreground">Pick two different companies. Targets are restricted to active identities with a relationship to the acting college; search results can be paged beyond the duplicate group. The server rejects a source shared outside this college.</p>
    <Button type="button" variant="danger" disabled={busy||!keep||!source||keep===source} onClick={()=>{setError("");setResult("");setConfirmOpen(true);}}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      {busy?"Merging…":"Review and merge"}
    </Button>
    <ConfirmDialog open={confirmOpen} onOpenChange={open=>{if(!busy)setConfirmOpen(open);}}
      title="Merge company identities?"
      description={`Merge "${companies.find(c=>c.id===source)?.name??source}" into "${allCompanies.find(c=>c.id===keep)?.name??keep}"? Jobs and recruiter grants in this college are reassigned; the source relationship is archived. Existing company domains, aliases and per-college notes are NOT bulk-migrated by this operation. Review those separately. This cannot be undone.`}
      confirmLabel="Merge companies" confirmVariant="danger" pending={busy}
      confirmDisabled={busy||!keep||!source||keep===source} onConfirm={()=>void merge()}>
      {error?<p role="alert" className="break-words border-l-2 border-error bg-error-subtle p-[var(--lms-space-3)] text-sm text-error">{error}</p>:null}
    </ConfirmDialog>
    {error&&!confirmOpen?<p role="alert" className="text-sm text-error">{error}</p>:null}
    {result?<p role="status" aria-live="polite" className="max-w-prose text-sm text-success-text">{result}</p>:null}
  </div>;
}
