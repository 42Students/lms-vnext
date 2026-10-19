"use client";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {useCollegeConfirmation} from "@/components/college/use-college-confirmation";

import {useState,useTransition,type FormEvent} from "react";
import {useRouter} from "next/navigation";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";
import {LEGACY_FACULTY_TYPES} from "@/modules/people/college-faculty-type-model";

type Kind="FACULTY"|"LEARNER";
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
  const {ask,confirmation}=useCollegeConfirmation();
  const [open,setOpen]=useState(false);
  const [loading,setLoading]=useState(false);
  const [pending,start]=useTransition();
  const [person,setPerson]=useState<Person|null>(null);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const base="/api/college/people/"+encodeURIComponent(membershipId)+"/edit";
  const field="min-h-11 w-full rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-base sm:text-sm text-foreground";
  async function load(){
    setLoading(true);setError("");setSuccess("");setPerson(null);setOpen(true);
    try{
      const result=await apiFetch<{person:Person}>(base+"?kind="+kind,{cache:"no-store"});
      if(!result.person)throw Error("Profile details unavailable");
      setPerson(result.person as Person);
    }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({}));}
    finally{setLoading(false);}
  }
  function patch(key:keyof Person,value:string){
    setPerson(current=>current?{...current,[key]:value}:current);
  }
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(!person)return;
    if(!(await ask("Save these changes to this college profile?")))return;
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
        router.refresh();setOpen(false);
      }catch(reason){setError(reason instanceof Error?reason.message:friendlyApiError({}));}
    });
  }
  return <div className="inline-block">{confirmation}
    <Button variant="secondary" type="button" onClick={()=>void load()}
      className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-3 text-xs font-semibold text-primary-text">
      {kind==="FACULTY"?"Edit Faculty":"Edit Student"}
    </Button>
    {success&&<span role="status" className="ml-2 text-xs text-body">{success}</span>}
    <Dialog open={open} onOpenChange={next=>{if(!next&&!pending)setOpen(false);}} title={kind==="FACULTY"?"Edit Faculty":"Edit Student"} dismissible={!pending}>
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">{kind==="FACULTY"?"Edit Faculty":"Edit Student"}</h2>
          <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
            className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-3">Close</Button>
        </div>
        {loading&&<p role="status" className="mt-4 text-sm">Loading profile…</p>}
        {error&&<p role="alert" className="my-2 text-sm text-error">{error}</p>}
        {person&&<form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs text-muted-foreground">
            Canonical identity name, login phone and login email are managed separately to protect access to other memberships.
          </p>
          <label className="grid gap-1 text-sm">Name
            <Input value={person.name} readOnly className={field+" opacity-70"}/>
          </label>
          <label className="grid gap-1 text-sm">Login Mobile
            <Input value={person.canonicalPhone} readOnly className={field+" opacity-70"}/>
          </label>
          <label className="grid gap-1 text-sm">Login Email
            <Input value={person.canonicalEmail} readOnly className={field+" opacity-70"}/>
          </label>
          {kind==="FACULTY"?<>
            <label className="grid gap-1 text-sm">Department
              <Select className={field} value={person.primaryDepartmentId??""}
                onChange={e=>patch("primaryDepartmentId",e.target.value)}>
                <option value="">No department</option>
                {person.primaryDepartmentId&&!departments.some(d=>d.id===person.primaryDepartmentId)&&
                  <option value={person.primaryDepartmentId}>Current department</option>}
                {departments.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </label>
            <label className="grid gap-1 text-sm">Faculty Type
              <Select className={field} value={person.employmentType??""}
                onChange={e=>patch("employmentType",e.target.value)}>
                <option value="">Not specified</option>
                {person.employmentType&&!LEGACY_FACULTY_TYPES.some(v=>v===person.employmentType)&&
                  <option value={person.employmentType}>{person.employmentType} (existing)</option>}
                {LEGACY_FACULTY_TYPES.map(type=><option key={type} value={type}>{type}</option>)}
              </Select>
            </label>
            <label className="grid gap-1 text-sm">Academic title
              <Input className={field} maxLength={128} value={person.academicTitle??""}
                onChange={e=>patch("academicTitle",e.target.value)}/>
            </label>
          </>:<>
            <label className="grid gap-1 text-sm">Roll Number
              <Input className={field} maxLength={128} value={person.rollNumber??""}
                onChange={e=>patch("rollNumber",e.target.value)}/>
            </label>
            <label className="grid gap-1 text-sm">Registration Number
              <Input className={field} maxLength={128} value={person.registrationNumber??""}
                onChange={e=>patch("registrationNumber",e.target.value)}/>
            </label>
          </>}
          <label className="grid gap-1 text-sm">Gender
            <Select className={field} value={person.gender} onChange={e=>patch("gender",e.target.value)}>
              {["","Male","Female","Other","Prefer not to say"].map(value=>
                <option key={value} value={value}>{value||"Not specified"}</option>)}
            </Select>
          </label>
          <label className="grid gap-1 text-sm">Date of Birth
            <Input className={field} type="date" value={person.dateOfBirth}
              onChange={e=>patch("dateOfBirth",e.target.value)}/>
          </label>
          <label className="grid gap-1 text-sm">Contact mobile
            <Input className={field} maxLength={32} value={person.contactPhone}
              onChange={e=>patch("contactPhone",e.target.value)}/>
          </label>
          <label className="grid gap-1 text-sm">Contact email
            <Input className={field} type="email" value={person.contactEmail}
              onChange={e=>patch("contactEmail",e.target.value)}/>
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">Address
            <Textarea className="rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-3 text-base sm:text-sm" rows={2} maxLength={1000}
              value={person.address} onChange={e=>patch("address",e.target.value)}/>
          </label>
          <label className="grid gap-1 text-sm sm:col-span-2">Bio
            <Textarea className="rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-3 text-base sm:text-sm" rows={3} maxLength={3000}
              value={person.bio} onChange={e=>patch("bio",e.target.value)}/>
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <Button variant="primary" type="submit" disabled={pending} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] bg-primary px-4 text-on-primary disabled:opacity-50">
              {pending?"Saving…":"Save changes"}
            </Button>
            <Button variant="secondary" type="button" disabled={pending} onClick={()=>setOpen(false)}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border px-4">Cancel</Button>
          </div>
        </form>}
    </Dialog>
  </div>;
}
