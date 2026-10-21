"use client";

import {useEffect,useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {facultyContactEditSchema} from "@/modules/people/faculty-profile-document";
import {facultyProfileSaveReceipt} from "@/modules/people/faculty-profile-save-response";

type Contact={contactMobile:string;contactPhone:string;contactMail:string};
type Field=keyof Contact;
const fields:readonly {name:Field;label:string;type:string;maxLength:number;hint:string}[]=[
 {name:"contactMobile",label:"Primary mobile",type:"tel",maxLength:10,hint:"10 digits · required"},
 {name:"contactPhone",label:"Alternate phone",type:"tel",maxLength:15,hint:"10–15 digits · optional"},
 {name:"contactMail",label:"Contact email",type:"email",maxLength:320,hint:"Optional contact address"},
];

export function FacultyContactEditor({initial,initialVersion}:{
 initial:Contact;initialVersion:number;
}){
 const router=useRouter();
 const [saved,setSaved]=useState(initial);
 const [draft,setDraft]=useState(initial);
 const [version,setVersion]=useState(initialVersion);
 const [pending,setPending]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [success,setSuccess]=useState<string|null>(null);
 const dirty=fields.some(field=>draft[field.name]!==saved[field.name]);
 useEffect(()=>{
  if(!dirty)return;
  const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
  window.addEventListener("beforeunload",guard);
  return ()=>window.removeEventListener("beforeunload",guard);
 },[dirty]);
 async function save(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending||!dirty)return;
  setError(null);setSuccess(null);
  const result=facultyContactEditSchema.safeParse(draft);
  if(!result.success){
   setError(result.error.issues[0]?.message??"Check contact numbers and email.");
   return;
  }
  setPending(true);
  try{
   const response=await fetch("/api/people/faculty-self-document",{
    method:"PATCH",credentials:"same-origin",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({section:"contact",value:result.data,expectedVersion:version}),
   });
   if(!response.ok){
    if(response.status===409){
     setError("These contact details changed in another session. Reload the profile before saving again.");
    }else{
     setError("Contacts could not be saved. Your edits are still here. Retry.");
    }
    return;
   }
   const receipt=facultyProfileSaveReceipt(await response.json(),version);
   setSaved(receipt.document.contact);
   setDraft(receipt.document.contact);
   setVersion(receipt.version);
   setSuccess("Contact details updated");
   router.refresh();
  }catch{
   setError("Save could not be confirmed. Check your saved contacts before retrying.");
  }finally{setPending(false);}
 }
 return <form onSubmit={save} aria-label="Edit contact details" noValidate
  className="max-w-2xl min-w-0 space-y-4 border-t border-border pt-4">
  <h3 className="text-base font-semibold text-[var(--lms-heading)]">Edit contacts</h3>
  <div className="grid gap-4 sm:grid-cols-2">
   {fields.map(field=><label key={field.name}
    className="min-w-0 space-y-1.5 text-sm font-semibold text-body">
    <span className="block">{field.label}</span>
    <Input name={field.name} type={field.type} inputMode={field.type==="tel"?"numeric":undefined}
     autoComplete={field.name==="contactMobile"?"tel":field.name==="contactMail"?"email":"off"}
     maxLength={field.maxLength} required={field.name==="contactMobile"}
     value={draft[field.name]} disabled={pending}
     onChange={event=>{setDraft(old=>({...old,[field.name]:event.target.value}));setError(null);setSuccess(null);}}/>
    <span className="block text-xs font-normal text-muted-foreground">{field.hint}</span>
   </label>)}
  </div>
  {error?<p role="alert" className="text-sm font-semibold text-danger">{error}</p>:null}
  {success?<p role="status" className="text-sm font-semibold text-success">{success}</p>:null}
  <div className="flex flex-wrap items-center gap-3">
   <Button type="submit" disabled={!dirty||pending} loading={pending}>Save contacts</Button>
   <Button type="button" variant="secondary" disabled={!dirty||pending} onClick={()=>{
    setDraft(saved);setError(null);setSuccess(null);
   }}>Discard changes</Button>
  </div>
 </form>;
}
