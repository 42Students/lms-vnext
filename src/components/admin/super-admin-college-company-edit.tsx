"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Button} from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Alert} from "@/components/ui/alert";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {useToast} from "@/components/ui/toast";

type CollegeContact={
 contactName:string|null;
 contactEmail:string|null;
 contactPhone:string|null;
 internalNotes:string|null;
};
const emptyContact:CollegeContact={
 contactName:null,contactEmail:null,contactPhone:null,internalNotes:null,
};

/** Edits only this college's private relationship fields. Never updates the
 * globally shared employer identity or fetches another college's contact data. */
export function SuperAdminCollegeCompanyEdit({relationshipId,name}:{
 relationshipId:string;name:string;
}){
 const router=useRouter();
 const {pending,run}=useGuardedAction();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");
 const [details,setDetails]=useState<CollegeContact>(emptyContact);
 const [dirty,setDirty]=useState(false);
 const [confirmDiscard,setConfirmDiscard]=useState(false);
 const endpoint="/api/placements/companies/"+encodeURIComponent(relationshipId)+"/history";
 async function showEditor(){
  setError("");setLoading(true);setDirty(false);setOpen(true);
  try{
   const result=await apiFetch<{company:CollegeContact}>(endpoint);
   setDetails(result.company);
  }catch(reason){
   setError(reason instanceof Error?reason.message:"Unable to load private contact details. Retry.");
  }finally{setLoading(false);}
 }
 function requestClose(){
  if(pending)return;
  if(dirty){setConfirmDiscard(true);return;}
  setOpen(false);setError("");
 }
 function setField(field:keyof CollegeContact,value:string){
  setDirty(true);
  setDetails(current=>({...current,[field]:value}));
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(loading||pending)return;
  void run(async()=>{
   setError("");
   const email=(details.contactEmail??"").trim();
   const phone=(details.contactPhone??"").trim();
   if(email&&!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)){
    setError("Must be a valid contact email");return;
   }
   if(phone&&!/^[+()\\d][\\d\\s().-]{6,29}$/.test(phone)){
    setError("Enter a valid phone number");return;
   }
   try{
    await apiFetch(endpoint,{
     method:"PATCH",headers:{"content-type":"application/json"},
     body:JSON.stringify({
      contactPersonName:details.contactName?.trim()||null,
      contactEmail:email||null,
      contactPhone:phone||null,
      internalNotes:details.internalNotes?.trim()||null,
     }),
    });
    showToast({tone:"success",title:"Company contact updated",
     description:"Changes are private to this college."});
    setDirty(false);setOpen(false);router.refresh();
   }catch(reason){
    setError(reason instanceof Error?reason.message:"Could not update company details.");
   }
  });
 }
 const cls="min-h-11 w-full md:min-h-9";
 const label="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)]";
 return <>
  <Button type="button" variant="secondary" className="min-h-11 md:min-h-9"
   onClick={()=>void showEditor()} aria-label={"Edit "+name+" college contact"}>Edit</Button>
  <Dialog open={open} onOpenChange={next=>{if(!next)requestClose();}}
   title={"Edit "+name} className="max-w-[560px]" dismissible={!pending&&!loading}>
   <p className="mb-4 text-sm text-muted-foreground">
    Private contact and notes for the selected college only. Global company name,
    website and logo are managed separately by platform administrators.
   </p>
   {loading?<p role="status" className="py-4 text-sm">Loading contact details…</p>:
    error&&!dirty?<div className="space-y-3">
     <Alert role="alert" tone="error">{error}</Alert>
     <Button type="button" variant="secondary" onClick={()=>void showEditor()}>Retry</Button>
    </div>:<form onSubmit={submit} className="space-y-4">
     <fieldset disabled={pending} className="space-y-3">
      <label className={label}>Contact person
       <Input maxLength={150} className={cls} value={details.contactName??""}
        onChange={event=>setField("contactName",event.target.value)}/>
      </label>
      <label className={label}>Contact email
       <Input type="email" maxLength={150} className={cls} value={details.contactEmail??""}
        onChange={event=>setField("contactEmail",event.target.value)}/>
      </label>
      <label className={label}>Phone
       <Input type="tel" maxLength={30} className={cls} value={details.contactPhone??""}
        onChange={event=>setField("contactPhone",event.target.value)}/>
      </label>
      <label className={label}>Internal notes
       <Textarea rows={4} maxLength={2000} className={cls} value={details.internalNotes??""}
        onChange={event=>setField("internalNotes",event.target.value)}/>
      </label>
     </fieldset>
     {error?<Alert role="alert" tone="error">{error}</Alert>:null}
     <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-3">
      <Button type="button" variant="secondary" disabled={pending} onClick={requestClose}>Cancel</Button>
      <Button type="submit" loading={pending} disabled={pending||!dirty}>Save changes</Button>
     </div>
    </form>}
  </Dialog>
  <Dialog open={confirmDiscard} onOpenChange={setConfirmDiscard}
   title="Discard unsaved contact changes?" className="max-w-[420px]">
   <div className="flex flex-wrap justify-end gap-2">
    <Button type="button" variant="secondary" onClick={()=>setConfirmDiscard(false)}>Keep editing</Button>
    <Button type="button" variant="danger" onClick={()=>{setConfirmDiscard(false);setDirty(false);setOpen(false);}}>Discard</Button>
   </div>
  </Dialog>
 </>;
}
