"use client";
import { Input } from "@/components/ui/input";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
export function TpoTrustedDomainEditor({domains}:{domains:readonly string[]}){
 const router=useRouter();
 const [domain,setDomain]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 const [review,setReview]=useState<{action:"TRUST"|"REMOVE";value:string}|null>(null);
 async function change(action:"TRUST"|"REMOVE",value:string){
  const normalized=value.trim().toLowerCase().replace(/^@/,"");
  if(busy||!normalized)return;
  // Confirmation happens in the focus-managed shared dialog.
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
   setReview(null);
   setStatus(action==="TRUST"?"Domain trusted.":"Stopped trusting domain.");
   router.refresh();
  }catch(error){setStatus(error instanceof Error?error.message:"Could not save.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Manage trusted email domains" className="space-y-3 border-t border-border pt-4">
  <h2 className="text-lg font-semibold">Explicit trusted email domains</h2>
  <p className="text-xs text-muted-foreground">Free-mail addresses cannot be trusted. Trust never replaces verification or recruiter access checks.</p>
  <label className="grid gap-1 text-sm font-semibold">Domain
   <Input value={domain} onChange={event=>setDomain(event.target.value)} maxLength={253} placeholder="company.example"
    className="min-h-11 sm:min-h-9"/></label>
  <Button type="button" disabled={busy||domain.trim().length<4}
   onClick={()=>setReview({action:"TRUST",value:domain})}
   className="min-h-11 sm:min-h-9">Trust @{domain.replace(/^@/,"")||"domain"}</Button>
  <ul className="divide-y divide-border">{domains.map(item=><li key={item} className="flex min-h-12 items-center justify-between gap-3 py-2">
   <span className="break-all text-sm">@{item}</span>
   <Button type="button" disabled={busy} onClick={()=>setReview({action:"REMOVE",value:item})}
    variant="secondary" className="min-h-11 sm:min-h-9">Stop trusting</Button>
  </li>)}</ul>
  {domains.length===0?<p role="status" className="text-sm text-muted-foreground">No explicit trusted domains.</p>:null}
  {status?<p role="status" className="text-sm">{status}</p>:null}
  <ConfirmDialog open={review!==null}
    onOpenChange={value=>{if(!value&&!busy)setReview(null);}}
    title={review?.action==="REMOVE"?"Stop trusting @"+review.value+"?":"Trust @"+(review?.value.trim().replace(/^@/,"")??"")+"?"}
    description={review?.action==="TRUST"?"Only verified recruiters are eligible.":undefined}
    confirmLabel={review?.action==="REMOVE"?"Stop trusting":"Trust domain"}
    pending={busy}
    onConfirm={()=>{if(review)void change(review.action,review.value);}}>
    {status?<p role="alert" className="text-sm text-foreground">{status}</p>:null}
  </ConfirmDialog>
 </section>;
}
