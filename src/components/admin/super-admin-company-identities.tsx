"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {useGuardedAction} from "@/hooks/use-guarded-action";
export function SuperAdminCompanyIdentities({companyId,name,domains,aliases}:{
 companyId:string;name:string;domains:readonly string[];aliases:readonly string[];
}){
 const router=useRouter();
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
    router.refresh();
   }catch(e){setError(e instanceof Error?e.message:"Company identity change failed. Retry.");}
  });
 }
 async function add(event:FormEvent<HTMLFormElement>,kind:"domains"|"aliases"){
  event.preventDefault();
  const field=event.currentTarget.elements.namedItem("value");
  if(!(field instanceof HTMLInputElement))return;
  const value=field.value.trim();
  if(!value)return;
  await mutate(kind,"ADD",value);
 }
 return <section aria-label={"Domains and other names for "+name}
  className="mt-3 space-y-3 border-b border-border pb-5 text-sm print:hidden">
  {(["domains","aliases"] as const).map(kind=>{
   const entries=kind==="domains"?domains:aliases;
   return <div key={kind} className="space-y-2">
    <h3 className="font-semibold text-foreground">{kind==="domains"?"Domains":"Other names"}</h3>
    <form className="flex flex-wrap gap-2" onSubmit={e=>void add(e,kind)}>
     <Input name="value" aria-label={kind==="domains"?"Company domain or email":"Company other name"}
      maxLength={kind==="domains"?253:160} required disabled={pending}
      placeholder={kind==="domains"?"company.com or name@company.com":"e.g. TCS"}
      className="min-h-11 min-w-0 flex-1 md:min-h-9"/>
     <Button type="submit" disabled={pending}
      className="min-h-11 md:min-h-9">Add</Button>
    </form>
    <ul className="space-y-1">{entries.map(value=><li key={value} className="flex items-center justify-between gap-2">
     <span className="break-all">{value}</span>
     <Button type="button" variant="secondary" disabled={pending||(kind==="domains"&&domains.length<=1)}
      onClick={()=>void mutate(kind,"REMOVE",value)}
      className="min-h-11 md:min-h-9">Remove</Button>
    </li>)}</ul>
   </div>;
  })}
  {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
 </section>;
}
