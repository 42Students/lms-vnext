"use client";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {Button} from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
export function TpoTrustedDomainEditor({domains}:{domains:readonly string[]}){
 const router=useRouter();
 const [domain,setDomain]=useState(""),[busy,setBusy]=useState(false),[status,setStatus]=useState("");
 const [statusTone,setStatusTone]=useState<"success"|"error">("success");
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
   setStatusTone("success");setStatus(action==="TRUST"?"Domain trusted.":"Stopped trusting domain.");
   router.refresh();
  }catch(error){setStatusTone("error");setStatus(error instanceof Error?error.message:"Could not save.");}
  finally{setBusy(false);}
 }
 return <section aria-label="Manage trusted email domains" className="min-w-0 space-y-3 border-t border-border pt-4">
  <Heading level={2} size="base" className="leading-[26px] md:text-[18px] md:leading-[28px] lg:text-[20px] lg:leading-[30px] text-[var(--lms-heading)]">Explicit trusted email domains</Heading>
  <p className="text-xs text-muted-foreground leading-[20px]">Free-mail addresses cannot be trusted. Trust never replaces verification or recruiter access checks.</p>
  <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,12rem)] sm:items-end">
  <Label stack className="min-w-0">Domain
   <Input value={domain} onChange={event=>{setDomain(event.target.value);setStatus("");}} maxLength={253} placeholder="company.example"
    className="min-h-11 w-full md:min-h-9"/></Label>
  <Button type="button" disabled={busy||domain.trim().length<4}
   onClick={()=>setReview({action:"TRUST",value:domain})}
   className="min-h-11 w-full min-w-0 truncate md:min-h-9">Trust @{domain.replace(/^@/,"")||"domain"}</Button>
  </div>
  {status&&!review?<div role={statusTone==="error"?"alert":"status"}><Alert tone={statusTone}>{status}</Alert></div>:null}
  <ul className="divide-y divide-border">{domains.map(item=><li key={item} className="flex min-h-12 min-w-0 flex-col items-stretch gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
   <span className="break-all text-sm">@{item}</span>
   <Button type="button" disabled={busy} onClick={()=>setReview({action:"REMOVE",value:item})}
    variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">Stop trusting</Button>
  </li>)}</ul>
  {domains.length===0?<EmptyState title="No explicit trusted domains."/>:null}
  <ConfirmDialog open={review!==null}
    onOpenChange={value=>{if(!value&&!busy)setReview(null);}}
    title={review?.action==="REMOVE"?"Stop trusting @"+review.value+"?":"Trust @"+(review?.value.trim().replace(/^@/,"")??"")+"?"}
    {...(review?.action==="TRUST"?{description:"Only verified recruiters are eligible."}:{})}
    confirmLabel={review?.action==="REMOVE"?"Stop trusting":"Trust domain"}
    confirmVariant={review?.action==="REMOVE"?"danger":"primary"}
    pending={busy}
    onConfirm={()=>{if(review)void change(review.action,review.value);}}>
    {status?statusTone==="error"?<p role="alert" className="text-sm text-foreground">{status}</p>:<Alert tone={statusTone}>{status}</Alert>:null}
  </ConfirmDialog>
 </section>;
}
