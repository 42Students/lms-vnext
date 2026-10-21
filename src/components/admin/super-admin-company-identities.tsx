"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";
import {companyDomainSchema} from "@/modules/placements/company-curation-domain-model";
import {displayCompanyAlias} from "@/modules/placements/company-curation-alias-model";
export function SuperAdminCompanyIdentities({companyId,name,domains,aliases}:{
 companyId:string;name:string;domains:readonly string[];aliases:readonly string[];
}){
 const router=useRouter();
 const {showToast}=useToast();
 const [error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 async function mutate(kind:"domains"|"aliases",action:"ADD"|"REMOVE",value:string){
  await run(async()=>{
   setError("");
   try{
    await apiFetch("/api/admin/companies/"+kind,{method:"POST",
     headers:{"content-type":"application/json"},
     body:JSON.stringify({companyId,action,[kind==="domains"?"domain":"alias"]:value}),
    });
    showToast({tone:"success",title:kind==="domains"?
      (action==="ADD"?"Domain added":"Domain removed"):
      (action==="ADD"?"Name added. The company search finds it now.":"Name removed")});
    router.refresh();
   }catch(e){
    const original=e instanceof Error?e.message:"";
    setError(original.includes("conflicts with another company")||
     original.includes("registered to another company")
      ?"This name belongs to another company. Merge them instead.":
      original.includes("Keep at least one company domain")
      ?"Keep at least one company domain.":original||
       "Company identity change failed. Retry.");
   }
  });
 }
 async function add(event:FormEvent<HTMLFormElement>,kind:"domains"|"aliases"){
  event.preventDefault();
  const field=event.currentTarget.elements.namedItem("value");
  if(!(field instanceof HTMLInputElement))return;
  const value=field.value.trim();
  if(!value)return;
  if(kind==="domains"){
   const parsed=companyDomainSchema.safeParse(value);
   if(!parsed.success){setError("Enter a valid company domain or work email.");return;}
   await mutate(kind,"ADD",parsed.data);
  }else{
   const alias=displayCompanyAlias(value);
   if(alias.length<2||alias.length>150){
    setError("An alias needs 2 to 150 characters");return;
   }
   await mutate(kind,"ADD",alias);
  }
 }
 return <section aria-label={"Domains and other names for "+name}
  className="mt-3 space-y-3 border-b border-border pb-5 text-sm print:hidden">
  {(["domains","aliases"] as const).map(kind=>{
   const entries=kind==="domains"?domains:aliases;
   return <div key={kind} className="space-y-2">
    <h3 className="font-semibold text-foreground">{kind==="domains"?"Domains":"Other names"}</h3>
    <form className="flex flex-wrap gap-2" onSubmit={e=>void add(e,kind)}>
     <Input name="value" aria-label={kind==="domains"?"Company domain or email":"Company other name"}
      maxLength={kind==="domains"?253:150} required disabled={pending}
      placeholder={kind==="domains"?"company.com or name@company.com":"e.g. TCS"}
      className="min-h-11 min-w-0 flex-1 md:min-h-9"/>
     <Button type="submit" loading={pending} disabled={pending}
      aria-label={kind==="domains"?"Add company domain":"Add company other name"} className="min-h-11 md:min-h-9">Add</Button>
    </form>
    <ul className="space-y-1">{entries.map(value=><li key={value} className="flex items-center justify-between gap-2 flex-wrap">
     <span className="break-all">{value}</span>
     <Button type="button" variant="danger" disabled={pending||(kind==="domains"&&domains.length<=1)}
      onClick={()=>void mutate(kind,"REMOVE",value)}
      aria-label={`Remove ${kind==="domains"?"domain":"other name"} ${value}`}
      className="min-h-11 md:min-h-9">Remove</Button>
    </li>)}</ul>
   </div>;
  })}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
