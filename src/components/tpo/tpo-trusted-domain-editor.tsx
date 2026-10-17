"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
export function TpoTrustedDomainEditor({domains}:{domains:readonly string[]}){
 const router=useRouter();
 const [domain,setDomain]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 async function change(action:"TRUST"|"REMOVE",value:string){
  const normalized=value.trim().toLowerCase().replace(/^@/,"");
  if(busy||!normalized)return;
  if(!window.confirm(action==="TRUST"?"Trust @"+normalized+"? Only verified recruiters are eligible.":"Stop trusting @"+normalized+"?"))return;
  setBusy(true);setStatus("");
  try{
   const response=await fetch("/api/placements/tpo/trusted-domains",{method:"POST",
    credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({action,domain:normalized})});
   if(!response.ok){
    const result=await response.json().catch(()=>({})) as {error?:string};
    throw Error(result.error==="TRUST_STORAGE_PENDING"?"Trusted-domain storage is unavailable.":
     result.error==="DOMAIN_ALREADY_TRUSTED"?"Already trusted.":
     "Could not change the trusted domain.");
   }
   if(action==="TRUST")setDomain("");
   setStatus(action==="TRUST"?"Domain trusted.":"Stopped trusting domain.");
   router.refresh();
  }catch(error){setStatus(error instanceof Error?error.message:"Could not save.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Manage trusted email domains" className="space-y-3 rounded-xl border border-border bg-surface p-4">
  <h2 className="text-lg font-semibold">Explicit trusted email domains</h2>
  <p className="text-xs text-muted-foreground">Free-mail addresses cannot be trusted. Trust never replaces verification or recruiter access checks.</p>
  <label className="grid gap-1 text-sm font-semibold">Domain
   <input value={domain} onChange={event=>setDomain(event.target.value)} maxLength={253} placeholder="company.example"
    className="min-h-11 rounded border border-border px-3 text-sm"/></label>
  <button type="button" disabled={busy||domain.trim().length<4}
   onClick={()=>void change("TRUST",domain)}
   className="min-h-11 rounded bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">Trust @{domain.replace(/^@/,"")||"domain"}</button>
  <ul className="divide-y divide-border">{domains.map(item=><li key={item} className="flex min-h-12 items-center justify-between gap-3 py-2">
   <span className="break-all text-sm">@{item}</span>
   <button type="button" disabled={busy} onClick={()=>void change("REMOVE",item)}
    className="rounded border border-border px-3 py-2 text-sm text-primary-text disabled:opacity-50">Stop trusting</button>
  </li>)}</ul>
  {domains.length===0?<p role="status" className="text-sm text-muted-foreground">No explicit trusted domains.</p>:null}
  {status?<p role="status" className="text-sm">{status}</p>:null}
 </section>;
}
