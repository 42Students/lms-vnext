"use client";

import { useState, type FormEvent } from "react";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {legacyPersonName,indianMobileToE164} from "@/modules/people/college-onboard-mobile-model";

type Choices = {
  programs: {id:string;name:string}[];
  batches: {id:string;name:string;programId:string}[];
  classes: {id:string;name:string;cohortId:string;capacity:number|null}[];
};
export function CollegeStudentRegisterForm({choices}:{choices:Choices}) {
  const router=useRouter();
  const {pending,run:guardedRun}=useGuardedAction({busyLabel:"Registering..."});
  const [result,setResult]=useState<string|null>(null);
  const [savedMemberId,setSavedMemberId]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [programId,setProgramId]=useState("");
  const [cohortId,setCohortId]=useState("");
  const [sectionId,setSectionId]=useState("");
  const [firstName,setFirstName]=useState("");
  const [lastName,setLastName]=useState("");
  const displayName=legacyPersonName(firstName,lastName);
  const [phoneE164,setPhone]=useState("");
  const [email,setEmail]=useState("");
  const [rollNumber,setRoll]=useState("");
  const [gender,setGender]=useState<""|"Male"|"Female"|"Other"|"Prefer not to say">("");
  const [dateOfBirth,setDob]=useState("");
  const [address,setAddress]=useState("");
  const field="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground";
  function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setResult(null);setSavedMemberId(null);
    if(!indianMobileToE164(phoneE164)){setError("Mobile number must be 10 digits");return;}
    if(!programId||!cohortId||!displayName.trim()||!phoneE164.trim()){
      setError("Name, phone, program and batch are required.");return;
    }
    if(!window.confirm("Register this student and enroll them in the selected batch?"))return;
    void guardedRun(async()=>{
      try {
        const body=await apiFetch<{
          status?:string;membershipId?:string;failures?:string[];
        }>("/api/college/students/register",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify({displayName,phoneE164:indianMobileToE164(phoneE164),email,programId,cohortId,
            sectionId:sectionId||undefined,rollNumber,gender,dateOfBirth,address}),
        });
        const isPartial=body?.status==="PARTIAL";
        setSavedMemberId(body?.membershipId??null);
        setResult(isPartial
          ? "Partially registered. Some enrollment steps need attention. Check the student roster before retrying."
          : "Student registered successfully! They can now login with their mobile number.");
        if(!isPartial){
          setFirstName("");setLastName("");setPhone("");setEmail("");setRoll("");setDob("");setAddress("");
          router.refresh();
        }
      }catch(reason){setError(reason instanceof Error?reason.message:"Registration failed");}
    });
  }
  return <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2">
    <label className="grid gap-1 text-sm font-semibold">First Name
      <input required maxLength={120} value={firstName} onChange={e=>setFirstName(e.target.value)} className={field}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Last Name
      <input required maxLength={120} value={lastName} onChange={e=>setLastName(e.target.value)} className={field}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Mobile Number
      <span className="text-xs font-normal text-muted-foreground">Used for OTP login</span>
      <input required type="tel" placeholder="9876543210" value={phoneE164}
        onChange={e=>setPhone(e.target.value)} className={field}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Email
      <input type="email" maxLength={320} value={email} onChange={e=>setEmail(e.target.value)} className={field}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Roll Number
      <input maxLength={128} value={rollNumber} onChange={e=>setRoll(e.target.value)} className={field}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Program
      <select required value={programId} onChange={e=>{setProgramId(e.target.value);setCohortId("");setSectionId("");}} className={field}>
        <option value="">Choose program</option>
        {choices.programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Batch
      <select required value={cohortId} onChange={e=>{setCohortId(e.target.value);setSectionId("");}} className={field}>
        <option value="">Choose batch</option>
        {choices.batches.filter(p=>p.programId===programId).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Class/Section
      <select value={sectionId} onChange={e=>setSectionId(e.target.value)} className={field}>
        <option value="">Assign class later</option>
        {choices.classes.filter(p=>p.cohortId===cohortId).map(p=>
          <option key={p.id} value={p.id}>{p.name} · {p.capacity??"Unlimited"} seats</option>)}
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Gender
      <select value={gender} onChange={e=>setGender(e.target.value as typeof gender)} className={field}>
        {["","Male","Female","Other","Prefer not to say"].map(g=><option key={g} value={g}>{g||"Not specified"}</option>)}
      </select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Date of Birth
      <input type="date" value={dateOfBirth} onChange={e=>setDob(e.target.value)} className={field}/>
    </label>
    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">Address
      <textarea maxLength={1000} rows={3} value={address} onChange={e=>setAddress(e.target.value)}
        className="rounded-md border border-border bg-surface p-3 text-foreground"/>
    </label>
    <div className="space-y-2 sm:col-span-2">
      <button disabled={pending} className="min-h-11 rounded-md bg-primary px-5 font-semibold text-on-primary disabled:opacity-50">
        {pending?"Registering…":"Register student"}
      </button>
      {result&&<p role="status" className="text-sm text-body">{result}</p>}
      {savedMemberId?<Link href={"/admin/people/directory/"+encodeURIComponent(savedMemberId)} className="inline-flex min-h-10 items-center text-sm font-semibold text-primary-text underline">Open registered student profile →</Link>:null}
      {error&&<p role="alert" className="text-sm text-error">{error}</p>}
    </div>
  </form>;
}
