"use client";
import {useState,type FormEvent} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Textarea} from "@/components/ui/textarea";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Alert} from "@/components/ui/alert";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Disclosure} from "@/components/ui/disclosure";
import {useToast} from "@/components/ui/toast";
export function SuperAdminCollegeCompanyCreate({collegeId}:{collegeId:string}){
 const router=useRouter();
 const {pending,run}=useGuardedAction();
 const {showToast}=useToast();
 const [open,setOpen]=useState(false),[discardOpen,setDiscardOpen]=useState(false);
 const [error,setError]=useState(""),[notice,setNotice]=useState("");
 const [name,setName]=useState(""),[primaryDomain,setPrimaryDomain]=useState("");
 const [websiteUrl,setWebsiteUrl]=useState(""),[industry,setIndustry]=useState("");
 const [about,setAbout]=useState(""),[contactName,setContactName]=useState("");
 const [contactEmail,setContactEmail]=useState(""),[contactPhone,setContactPhone]=useState("");
 const [notes,setNotes]=useState("");
 const dirty=Boolean([name,primaryDomain,websiteUrl,industry,about,contactName,contactEmail,contactPhone,notes].some(v=>v.trim()));
 function clear(){
  setName("");setPrimaryDomain("");setWebsiteUrl("");setIndustry("");setAbout("");
  setContactName("");setContactEmail("");setContactPhone("");setNotes("");setError("");
 }
 function requestClose(){
  if(pending)return;
  if(dirty){setDiscardOpen(true);return;}
  setOpen(false);setError("");
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  if(pending)return;
  const companyName=name.trim(),domain=primaryDomain.trim(),website=websiteUrl.trim();
  const email=contactEmail.trim(),phone=contactPhone.trim();
  if(companyName.length<2||companyName.length>150){
   setError("Company name must be between 2 and 150 characters");return;
  }
  if(!domain&&!website){setError("Add the company's website or a company email domain");return;}
  if(website){try{
   const url=new URL(website);
   if(url.protocol!=="https:"||url.username||url.password)
    throw new Error("INVALID_URL");
  }catch{setError("Company website must be a valid https link");return;}}
  if(industry.trim().length>100||about.trim().length>2000||notes.trim().length>2000){
   setError("Industry is limited to 100 characters; description and notes to 2,000.");return;
  }
  if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
   setError("Must be a valid contact email");return;
  }
  if(phone&&!/^[+()\d][\d\s().-]{6,29}$/.test(phone)){
   setError("Enter a valid phone number");return;
  }
  void run(async()=>{
   setError("");setNotice("");
   let relationshipId:string|null=null;
   try{
    const created=await apiFetch<{relationship:{id:string};existed:boolean}>("/api/placements/companies",{
     method:"POST",headers:{"content-type":"application/json"},
     body:JSON.stringify({collegeId,name:companyName,primaryDomain:domain||undefined,
      websiteUrl:website||undefined,industry:industry.trim()||undefined,
      about:about.trim()||undefined}),
    });
    relationshipId=created.relationship.id;
    const details={
     contactPersonName:contactName.trim()||null,contactEmail:email||null,
     contactPhone:phone||null,internalNotes:notes.trim()||null,
    };
    if(Object.values(details).some(v=>v!==null)){
     await apiFetch("/api/placements/companies/"+encodeURIComponent(relationshipId)+"/history",{
      method:"PATCH",headers:{"content-type":"application/json"},body:JSON.stringify(details),
     });
    }
    showToast({tone:"success",title:"Company added",
     description:created.existed?"Existing verified company linked to this college.":"Company linked to the selected college."});
    setNotice(created.existed&&Boolean(industry.trim()||about.trim())?
     "Existing global company linked. Its industry and description were preserved; these fields were not overwritten.":
     "Company created for this college.");
   }catch(reason){
    if(relationshipId){
     setNotice("Company linked, but college-only contact details could not be saved. Open History to finish editing them.");
     showToast({tone:"info",title:"Company added",description:"Contact details need to be updated in History."});
    }else{
     setError(reason instanceof Error?reason.message:"Company could not be created. Retry.");
     return;
    }
   }
   clear();setOpen(false);router.refresh();
  });
 }
 const fieldClass="min-h-11 w-full md:min-h-9";
 const labelClass="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]";
 return <section className="min-w-0 border-b border-border pb-5">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <h2 className="text-base font-semibold text-foreground">This college&apos;s companies</h2>
   <Button variant="primary" type="button" disabled={pending}
    onClick={()=>{setError("");setOpen(true);}} className="min-h-11 w-full sm:w-auto md:min-h-9 print:hidden">
    <svg aria-hidden="true" viewBox="0 0 16 16" className="mr-1 inline-block size-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M8 2.5v11M2.5 8h11" strokeLinecap="round"/></svg>
    Add company
   </Button>
  </div>
  {notice?<Alert tone="info" role="status" className="mt-3">{notice}</Alert>:null}
  <Dialog open={open} onOpenChange={next=>{if(!next)requestClose();}}
   title="Add company" description="Create or link a company in this college. Global company identity is shared."
   dismissible={!pending} className="!max-w-[560px]">
   <form noValidate onSubmit={submit} className="min-w-0 space-y-4">
    <fieldset className="min-w-0 space-y-3" disabled={pending}>
     <legend className="font-semibold text-[var(--lms-heading)]">Identity</legend>
     <label className={labelClass}>Company name
      <Input required minLength={2} maxLength={150} value={name} onChange={e=>setName(e.target.value)}
       placeholder="Company name" className={fieldClass}/>
     </label>
     <label className={labelClass}>Industry
      <Input maxLength={100} value={industry} onChange={e=>setIndustry(e.target.value)}
       placeholder="e.g. IT Services" className={fieldClass}/>
      <span className="text-xs font-normal text-muted-foreground">Industry is saved only when a new canonical company is created.</span>
     </label>
     <label className={labelClass}>Description
      <Textarea rows={3} maxLength={2000} value={about} onChange={e=>setAbout(e.target.value)} className={fieldClass}/>
      <span className="text-right text-xs font-normal text-muted-foreground">{about.length}/2000</span>
     </label>
     <label className={labelClass}>Company email domain
      <Input maxLength={255} placeholder="example.com" value={primaryDomain} onChange={e=>setPrimaryDomain(e.target.value)} className={fieldClass}/>
     </label>
     <label className={labelClass}>Website (HTTPS)
      <Input type="url" maxLength={500} placeholder="https://example.com" value={websiteUrl} onChange={e=>setWebsiteUrl(e.target.value)} className={fieldClass}/>
     </label>
    </fieldset>
    <fieldset className="min-w-0 space-y-3 border-t border-border pt-3" disabled={pending}>
     <legend className="font-semibold text-[var(--lms-heading)]">Contact</legend>
     <label className={labelClass}>Contact person
      <Input maxLength={150} value={contactName} onChange={e=>setContactName(e.target.value)} className={fieldClass}/>
     </label>
     <label className={labelClass}>Contact email
      <Input type="email" maxLength={150} value={contactEmail} onChange={e=>setContactEmail(e.target.value)} className={fieldClass}/>
     </label>
     <label className={labelClass}>Phone
      <Input type="tel" maxLength={30} placeholder="+91 98765 43210" value={contactPhone}
       onChange={e=>setContactPhone(e.target.value)} className={fieldClass}/>
     </label>
    </fieldset>
    <fieldset className="min-w-0 space-y-2 border-t border-border pt-3" disabled={pending}>
     <legend className="font-semibold text-[var(--lms-heading)]">Internal only</legend>
     <label className={labelClass}>Notes
      <Textarea rows={3} maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} className={fieldClass}/>
      <span className="text-right text-xs font-normal text-muted-foreground">{notes.length}/2000</span>
     </label>
     <p className="text-xs text-muted-foreground">Contacts and notes are only available to authorized staff at this college.</p>
    </fieldset>
    {error?<Alert role="alert" tone="error">{error}</Alert>:null}
    <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 border-t border-border pt-3">
     <Button type="button" variant="secondary" disabled={pending} onClick={requestClose}>Cancel</Button>
     <Button type="submit" variant="primary" loading={pending} disabled={pending}>{pending?"Saving…":"Save company"}</Button>
    </div>
   </form>
  </Dialog>
  <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
   title="Discard unsaved changes?" description="Your company details have not been saved."
   cancelLabel="Keep editing" confirmLabel="Discard changes" confirmVariant="danger"
   pending={pending} onConfirm={()=>{setDiscardOpen(false);setOpen(false);clear();}}/>
 </section>;
}
export function SuperAdminCollegeCompanyRelationshipActions({relationshipId,name,trusted,status,driveCount,companyStatus}:{
 relationshipId:string;name:string;trusted:boolean;status:string;driveCount:number;companyStatus:string;
}){
 const router=useRouter(),[confirm,setConfirm]=useState(false),[error,setError]=useState("");
 const {pending,run}=useGuardedAction();
 const {showToast}=useToast();
 async function trust(){
  await run(async()=>{setError("");
   try{await apiFetch("/api/placements/companies/"+encodeURIComponent(relationshipId),{
    method:"PATCH",headers:{"content-type":"application/json"},
    body:JSON.stringify({isTrusted:!trusted}),
   });showToast({tone:"success",title:"Company updated"});router.refresh();}
   catch(e){setError(e instanceof Error?e.message:"Could not change college trust.");}
  });
 }
 async function change(){
  await run(async()=>{setError("");
   try{await apiFetch("/api/admin/companies/relationships",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({relationshipId,
     action:status==="ACTIVE"?"ARCHIVE":"RESTORE",confirmed:true}),
   });setConfirm(false);
   showToast({tone:"success",title:archive?"Company deleted":"Company restored",
    description:archive?"Removed from this college; the global company record is retained.":undefined});
   router.refresh();}
   catch(e){setError(e instanceof Error?e.message:"Could not update company. Retry.");}
  });
 }
 const archive=status==="ACTIVE";
 return <Disclosure title="Manage company relationship" className="mt-2 print:hidden" contentClassName="space-y-2 pt-2">
  <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
   {archive?<Button type="button" variant="secondary" disabled={pending} onClick={()=>void trust()}
    className="min-h-11 w-full sm:w-auto md:min-h-9">
    {trusted?"Mark not trusted":"Mark trusted"}</Button>:null}
   <Button type="button" variant={archive?"danger":"secondary"} disabled={pending||(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
    title={archive&&driveCount>0?"Cannot delete a company with drives":undefined}
    onClick={()=>{setError("");setConfirm(true);}}
    className="min-h-11 w-full sm:w-auto md:min-h-9">
    {archive?"Delete company":"Restore company"}</Button>
  </div>
  {archive&&driveCount>0?<p className="text-xs leading-5 text-muted-foreground">Cannot delete a company with drives</p>:null}
  <ConfirmDialog open={confirm} onOpenChange={next=>{if(!pending)setConfirm(next);}}
   title={archive?"Delete this company?":"Restore this company?"}
   description={archive?
    "This action removes "+name+" from this college's companies. The global company record is kept for other colleges and can be restored later.":
    "It will reappear across job postings at this college. The global company record is kept."}
   confirmLabel={archive?"Confirm delete":"Confirm restore"}
   confirmVariant={archive?"danger":"primary"} pending={pending}
   confirmDisabled={(archive&&driveCount>0)||companyStatus!=="ACTIVE"}
   onConfirm={()=>void change()}>
   {error?<Alert tone="error">{error}</Alert>:null}
  </ConfirmDialog>
  {error?<Alert tone="error">{error}</Alert>:null}
 </Disclosure>;
}
