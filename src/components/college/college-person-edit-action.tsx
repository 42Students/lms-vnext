"use client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import {Dialog} from "@/components/ui/dialog";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {useCollegeConfirmation} from "@/components/college/use-college-confirmation";

import {useRef,useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {LEGACY_FACULTY_TYPES} from "@/modules/people/college-faculty-type-model";

type Kind="FACULTY"|"LEARNER";
function normalizeLegacyDateOfBirth(value:string):string {
  if(/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  const match=/^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if(!match)return value;
  const iso=match[3]+"-"+match[2]+"-"+match[1];
  const date=new Date(iso+"T00:00:00Z");
  return Number.isNaN(date.getTime())||date.toISOString().slice(0,10)!==iso?"":iso;
}
type Department={id:string;name:string};
type Person={
  id:string;kind:Kind;name:string;canonicalPhone:string;canonicalEmail:string;
  gender:string;dateOfBirth:string;address:string;contactPhone:string;contactEmail:string;
  bio:string;primaryDepartmentId:string|null;employmentType:string|null;academicTitle:string|null;
  rollNumber:string|null;registrationNumber:string|null;
};
export function CollegePersonEditAction({membershipId,kind,departments=[]}:{
  membershipId:string;kind:Kind;departments?:Department[];
}){
  const router=useRouter();
  const requestId=useRef(0);
  const saving=useRef(false);
  const initialProfile=useRef<string|null>(null);
  function leave(){
    requestId.current+=1;
    setOpen(false);
    setDiscardOpen(false);
    initialProfile.current=null;
  }
  function close(){
    if(pending||saving.current||discardOpen)return;
    if(person&&initialProfile.current!==null&&
      JSON.stringify(person)!==initialProfile.current){
      setDiscardOpen(true);
      return;
    }
    leave();
  }
  const {ask,confirmation}=useCollegeConfirmation();
  const [open,setOpen]=useState(false);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [pending,start]=useTransition();
  const [person,setPerson]=useState<Person|null>(null);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const base="/api/college/people/"+encodeURIComponent(membershipId)+"/edit";
  const field="min-h-11 w-full min-w-0 md:min-h-9";
  async function load(){
    const request=++requestId.current;
    setLoading(true);setError("");setSuccess("");setPerson(null);initialProfile.current=null;setDiscardOpen(false);setOpen(true);
    try{
      const result=await apiFetch<{person:Person}>(base+"?kind="+kind,{cache:"no-store"});
      if(!result.person)throw Error("Profile details unavailable");
      if(request===requestId.current){
        const normalized={...result.person,dateOfBirth:normalizeLegacyDateOfBirth(result.person.dateOfBirth??"")};
        initialProfile.current=JSON.stringify(normalized);
        setPerson(normalized as Person);
      }
    }catch(reason){if(request===requestId.current)setError(reason instanceof Error?reason.message:friendlyApiError({}));}
    finally{if(request===requestId.current)setLoading(false);}
  }
  function patch(key:keyof Person,value:string){
    setPerson(current=>current?{...current,[key]:value}:current);
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!person||pending||saving.current)return;
    saving.current=true;
    if(!(await ask("Save these changes to this college profile?"))){saving.current=false;return;}
    start(async()=>{
      setError("");setSuccess("");
      try{
        await apiFetch(base,{method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({
            kind,gender:person.gender,dateOfBirth:person.dateOfBirth,
            address:person.address,bio:person.bio,
            contactPhone:person.contactPhone,contactEmail:person.contactEmail,
            ...(kind==="FACULTY"?{
              primaryDepartmentId:person.primaryDepartmentId||null,
              employmentType:person.employmentType??"",
              academicTitle:person.academicTitle??"",
            }:{
              rollNumber:person.rollNumber??"",
              registrationNumber:person.registrationNumber??"",
            }),
          })});
        setSuccess(kind==="FACULTY"?"Faculty updated successfully!":"Student updated successfully!");
        router.refresh();leave();
      }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({}));}
      finally{saving.current=false;}
    });
  }
  return <div className="inline-block">{confirmation}
    <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
      title={kind==="LEARNER"?"Discard student edits?":"Discard faculty edits?"}
      description="Unsaved changes to this profile will be lost."
      confirmLabel="Discard edits" cancelLabel="Keep editing"
      onConfirm={leave}/>
    <Button variant="secondary" type="button" onClick={()=>void load()}
      aria-label={(kind==="FACULTY"?"Edit Faculty ":"Edit Student ")+membershipId}
      title={kind==="FACULTY"?"Edit Faculty":"Edit Student"} className="min-h-11 md:min-h-9">
      {kind==="FACULTY"?"Edit Faculty":"Edit Student"}
    </Button>
    {success&&<Alert tone="success" className="mt-2">{success}</Alert>}
    <Dialog open={open} onOpenChange={next=>{if(!next)close();}} title={kind==="FACULTY"?"Edit Faculty":"Edit Student"} dismissible={!pending&&!discardOpen} className="max-w-[600px]">
        
        {loading&&<Skeleton variant="form" count={4} label="Loading profile"/>}
        {error&&<Alert tone="error" className="my-2">{error}</Alert>}
        {person&&<form onSubmit={submit} className="grid min-w-0 gap-3 md:grid-cols-2">
          <p className="md:col-span-2 text-xs text-muted-foreground">
            Canonical identity name, login phone and login email are managed separately to protect access to other memberships. Academic program and class moves use permission-checked enrollment actions; editing this profile never impersonates or deletes the person.
          </p>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name
            <Input disabled={pending} value={person.name} readOnly className={field+" opacity-70"}/>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Login Mobile
            <Input disabled={pending} value={person.canonicalPhone} readOnly className={field+" opacity-70"}/>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Login Email
            <Input disabled={pending} value={person.canonicalEmail} readOnly className={field+" opacity-70"}/>
          </label>
          {kind==="FACULTY"?<>
            <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department
              <Select disabled={pending} className={field} value={person.primaryDepartmentId??""}
                onChange={e=>patch("primaryDepartmentId",e.target.value)}>
                <option value="">No department</option>
                {person.primaryDepartmentId&&!departments.some(d=>d.id===person.primaryDepartmentId)&&
                  <option value={person.primaryDepartmentId}>Current department</option>}
                {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </label>
            <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty Type
              <Select disabled={pending} className={field} value={person.employmentType??""}
                onChange={e=>patch("employmentType",e.target.value)}>
                <option value="">Not specified</option>
                {person.employmentType&&!LEGACY_FACULTY_TYPES.some(v=>v===person.employmentType)&&
                  <option value={person.employmentType}>{person.employmentType} (existing)</option>}
                {LEGACY_FACULTY_TYPES.map(type=><option key={type} value={type}>{type}</option>)}
              </Select>
            </label>
            <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic title
              <Input disabled={pending} className={field} maxLength={128} value={person.academicTitle??""}
                onChange={e=>patch("academicTitle",e.target.value)}/>
            </label>
          </>:<>
            <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Roll Number
              <Input disabled={pending} className={field} maxLength={128} value={person.rollNumber??""}
                onChange={e=>patch("rollNumber",e.target.value)}/>
            </label>
            <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Registration Number
              <Input disabled={pending} className={field} maxLength={128} value={person.registrationNumber??""}
                onChange={e=>patch("registrationNumber",e.target.value)}/>
            </label>
          </>}
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Gender
            <Select disabled={pending} className={field} value={person.gender} onChange={e=>patch("gender",e.target.value)}>
              {["","Male","Female","Other","Prefer not to say"].map(value=>
                <option key={value} value={value}>{value||"Not specified"}</option>)}
            </Select>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Date of Birth
            <Input disabled={pending} className={field} type="date" value={person.dateOfBirth}
              onChange={e=>patch("dateOfBirth",e.target.value)}/>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Contact mobile
            <Input disabled={pending} className={field} maxLength={32} value={person.contactPhone}
              onChange={e=>patch("contactPhone",e.target.value)}/>
          </label>
          <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Contact email
            <Input disabled={pending} className={field} type="email" value={person.contactEmail}
              onChange={e=>patch("contactEmail",e.target.value)}/>
          </label>
          <label className="grid gap-[6px] md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Address
            <Textarea disabled={pending} className="min-w-0" rows={2} maxLength={1000}
              value={person.address} onChange={e=>patch("address",e.target.value)}/>
          </label>
          <label className="grid gap-[6px] md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Bio / Description
            <span className="text-xs font-normal text-muted-foreground">Brief description</span>
            <Textarea disabled={pending} className="min-w-0" rows={3} maxLength={3000}
              value={person.bio} onChange={e=>patch("bio",e.target.value)}/>
          </label>
          <div className="flex min-w-0 flex-col-reverse gap-2 border-t border-border pt-3 sm:flex-row sm:justify-end md:col-span-2 [&>button]:min-h-11 [&>button]:w-full sm:[&>button]:w-auto md:[&>button]:min-h-9">
            <Button variant="secondary" type="button" disabled={pending} onClick={close}
              className="min-h-11 md:min-h-9">Cancel</Button>
            <Button variant="primary" type="submit" disabled={pending} loading={pending} className="min-h-11 md:min-h-9">
              {pending?"Saving…":"Save Changes"}
            </Button>
          </div>
        </form>}
    </Dialog>
  </div>;
}
