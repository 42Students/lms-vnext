"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
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
 const [openKind,setOpenKind]=useState<"domains"|"aliases"|null>(null);
 const [entry,setEntry]=useState("");
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
    if(action==="ADD")setEntry("");
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
  const value=entry.trim();
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
  <div className="flex flex-wrap items-center gap-2">
   {(["domains","aliases"] as const).map(kind=><Button key={kind} type="button"
    variant="secondary" disabled={pending}
    onClick={()=>{setOpenKind(kind);setEntry("");setError("");}}
    className="min-h-11 md:min-h-9">
    {kind==="domains"?"Edit Domains":"Other names"}
   </Button>)}
  </div>
  {(["domains","aliases"] as const).map(kind=>{
   const entries=kind==="domains"?domains:aliases;
   const title=kind==="domains"?"Domains of "+name:"Other names of "+name;
   return <Dialog key={kind} open={openKind===kind}
     onOpenChange={next=>{if(!next&&!pending){setOpenKind(null);setEntry("");setError("");}}}
     title={title} dismissible={!pending}>
     <div className="space-y-4">
      <p className="text-sm text-body">
        {kind==="domains"?"Manage the verified company domains. At least one domain must remain.":
         "Add short names, older names and the company’s full name so people can find it. If an alias belongs to another company, use Merge instead."}
      </p>
      {entries.length===0?<p className="text-sm text-muted-foreground">None yet</p>:null}
      <ul className="flex min-w-0 flex-wrap gap-2" aria-label={kind==="domains"?"Company domains":"Company other names"}>
       {entries.map(value=><li key={value}
         className="inline-flex min-w-0 items-center gap-1 rounded-full border border-border bg-[var(--lms-neutral-50)] px-3 py-1 text-sm">
        <span className="min-w-0 max-w-[220px] break-all">{value}</span>
        <Button type="button" variant="ghost" disabled={pending||(kind==="domains"&&domains.length<=1)}
          onClick={()=>void mutate(kind,"REMOVE",value)}
          aria-label={`Remove ${kind==="domains"?"domain":"other name"} ${value}`}
          className="min-h-9 min-w-9 rounded-full px-2 text-sm font-semibold"
          title={kind==="domains"&&domains.length<=1?"Keep at least one company domain":"Remove"}>
          <span aria-hidden="true">×</span>
        </Button>
       </li>)}
      </ul>
      <form onSubmit={e=>void add(e,kind)} className="flex min-w-0 flex-wrap items-end gap-2">
       <label className="grid min-w-0 flex-1 gap-1 text-[13px] font-semibold text-[var(--lms-neutral-400)]">
        {kind==="domains"?"Add domain":"Add Other name"}
        <Input name="value" value={entry} onChange={e=>{setEntry(e.target.value);setError("");}}
         maxLength={kind==="domains"?253:150} disabled={pending} required
         placeholder={kind==="domains"?"company.com or name@company.com":"TCS, L&T, an old or longer name"}
         aria-label={kind==="domains"?"Company domain or work email":"Company other name"}
         className="min-h-11 w-full md:min-h-9" />
       </label>
       <Button type="submit" loading={pending}
        disabled={pending||entry.trim().length<(kind==="aliases"?2:1)}
        className="min-h-11 md:min-h-9">Add</Button>
      </form>
      {error?<p role="alert" className="text-sm text-error">{error}</p>:null}
      <div className="flex justify-end">
        <Button type="button" variant="secondary" disabled={pending}
         onClick={()=>{setOpenKind(null);setEntry("");setError("");}}>Close</Button>
      </div>
     </div>
    </Dialog>;
  })}
 </section>;
}
