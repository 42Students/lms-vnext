"use client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

import {useCollegeConfirmation} from "@/components/college/use-college-confirmation";

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
  collegeName?: string;
};
export function CollegeStudentRegisterForm({choices}:{choices:Choices}) {
  const router=useRouter();
  const {ask,confirmation}=useCollegeConfirmation();
  const {pending,run:guardedRun}=useGuardedAction({busyLabel:"Registering..."});
  const [result,setResult]=useState<string|null>(null);
  const [savedMemberId,setSavedMemberId]=useState<string|null>(null);
  const [error,setError]=useState("");
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
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
  const field="min-h-11 min-w-0 md:min-h-9";
  const availableBatches=choices.batches.filter(batch=>batch.programId===programId);
  const availableClasses=choices.classes.filter(section=>section.cohortId===cohortId);
  async function submit(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setError("");setFieldErrors({});setResult(null);setSavedMemberId(null);
    const invalid:Record<string,string>={};
    if(!firstName.trim())invalid.firstName="Enter the first name";
    if(!lastName.trim())invalid.lastName="Enter the last name";
    if(!rollNumber.trim())invalid.rollNumber="Enter the roll number";
    if(!phoneE164.trim())invalid.mobile="Enter the mobile number";
    else if(!indianMobileToE164(phoneE164))invalid.mobile="Mobile number must be 10 digits";
    if(!programId || !choices.programs.some(item=>item.id===programId))invalid.programId="Choose a program";
    if(!cohortId || !availableBatches.some(item=>item.id===cohortId))invalid.cohortId="Choose a batch";
    if(sectionId && !availableClasses.some(item=>item.id===sectionId))invalid.sectionId="Choose an available class";
    // vNext keeps a mandatory program+batch enrollment while permitting
    // assignment to a class later when none is available in that batch.
    if(Object.keys(invalid).length){
      setFieldErrors(invalid);
      setError("Check the highlighted fields before registering.");
      (event.currentTarget.elements.namedItem(Object.keys(invalid)[0]) as HTMLElement | null)?.focus();
      return;
    }
    if(!(await ask("Register this student and enroll them in the selected batch?")))return;
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
      }catch(reason){setError("Failed to register student: "+
        (reason instanceof Error?reason.message:"Registration failed"));}
    });
  }
  return <>{confirmation}<form onSubmit={event=>{void submit(event);}} className="grid min-w-0 max-w-4xl gap-4 sm:grid-cols-2">
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">First Name
      <Input name="firstName" autoComplete="given-name" placeholder="Enter first name" maxLength={120} value={firstName} onChange={e=>setFirstName(e.target.value)} className={field} aria-invalid={Boolean(fieldErrors.firstName)} aria-describedby={fieldErrors.firstName?"register-first-error":undefined}/>
      {fieldErrors.firstName?<span id="register-first-error" role="alert" className="text-xs text-error">{fieldErrors.firstName}</span>:null}
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Last Name
      <Input name="lastName" autoComplete="family-name" placeholder="Enter last name" maxLength={120} value={lastName} onChange={e=>setLastName(e.target.value)} className={field} aria-invalid={Boolean(fieldErrors.lastName)} aria-describedby={fieldErrors.lastName?"register-last-error":undefined}/>
      {fieldErrors.lastName?<span id="register-last-error" role="alert" className="text-xs text-error">{fieldErrors.lastName}</span>:null}
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Mobile Number
      <span className="text-xs font-normal text-muted-foreground">Used for OTP login</span>
      <Input name="mobile" type="tel" autoComplete="tel-national" inputMode="numeric" maxLength={10} placeholder="10-digit mobile" value={phoneE164}
        onChange={e=>{const digits=e.target.value.replace(/\D/g,"");setPhone(digits.replace(/^91(?=\d{10}$)/,"").slice(0,10));}} className={field}
        aria-invalid={Boolean(fieldErrors.mobile)} aria-describedby={fieldErrors.mobile?"register-mobile-error":undefined}/>
      {fieldErrors.mobile?<span id="register-mobile-error" role="alert" className="text-xs text-error">{fieldErrors.mobile}</span>:null}
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Email
      <Input type="email" maxLength={320} value={email} onChange={e=>setEmail(e.target.value)} className={field}/>
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Roll Number
      <Input name="rollNumber" maxLength={128} placeholder="e.g., 22CS101" value={rollNumber} onChange={e=>setRoll(e.target.value)} className={field}
        aria-invalid={Boolean(fieldErrors.rollNumber)} aria-describedby={fieldErrors.rollNumber?"register-roll-error":undefined}/>
      {fieldErrors.rollNumber?<span id="register-roll-error" role="alert" className="text-xs text-error">{fieldErrors.rollNumber}</span>:null}
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Program
      <Select name="programId" disabled={choices.programs.length===0} value={programId} onChange={e=>{setProgramId(e.target.value);setCohortId("");setSectionId("");}} className={field}
        aria-invalid={Boolean(fieldErrors.programId)} aria-describedby={fieldErrors.programId?"register-program-error":undefined}>
        <option value="">Choose program</option>
        {choices.programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      {fieldErrors.programId?<span id="register-program-error" role="alert" className="text-xs text-error">{fieldErrors.programId}</span>:null}
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Batch
      <Select name="cohortId" disabled={!programId||availableBatches.length===0} value={cohortId} onChange={e=>{setCohortId(e.target.value);setSectionId("");}} className={field}
        aria-invalid={Boolean(fieldErrors.cohortId)} aria-describedby={fieldErrors.cohortId?"register-batch-error":undefined}>
        <option value="">Choose batch</option>
        {availableBatches.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
      </Select>
      {fieldErrors.cohortId?<span id="register-batch-error" role="alert" className="text-xs text-error">{fieldErrors.cohortId}</span>:null}
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Class/Section
      <Select name="sectionId" value={sectionId} onChange={e=>setSectionId(e.target.value)} disabled={!cohortId||availableClasses.length===0} className={field}
        aria-invalid={Boolean(fieldErrors.sectionId)} aria-describedby={fieldErrors.sectionId?"register-class-error":undefined}>
        <option value="">Assign class later</option>
        {availableClasses.map(p=>
          <option key={p.id} value={p.id}>{p.name} · {p.capacity??"Unlimited"} seats</option>)}
      </Select>
      {fieldErrors.sectionId?<span id="register-class-error" role="alert" className="text-xs text-error">{fieldErrors.sectionId}</span>:null}
      <span className="text-xs font-normal text-muted-foreground">
        New batch-first enrollment: class placement is optional when no class is assigned yet.
      </span>
    </label>
    <label className="grid gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] sm:col-span-2">College
      <Input readOnly aria-label="Selected college" value={choices.collegeName??"Current selected college"} className={field}/>
      <span className="text-xs font-normal text-muted-foreground">Determined by your selected college workspace; cannot be changed for this registration.</span>
    </label>
    {choices.programs.length===0?<Alert tone="warning">No active programs are available for the selected college. Registration is unavailable until academic options are configured.</Alert>:null}
    <details className="group min-w-0 border-t border-border pt-4 sm:col-span-2">
      <summary className="flex min-h-11 cursor-pointer items-center font-semibold text-primary-text md:min-h-9">Gender · Date of Birth · Address</summary>
      <div className="grid min-w-0 gap-4 pt-3 sm:grid-cols-2">
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Gender
      <Select value={gender} onChange={e=>setGender(e.target.value as typeof gender)} className={field}>
        {["","Male","Female","Other","Prefer not to say"].map(g=><option key={g} value={g}>{g||"Not specified"}</option>)}
      </Select>
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Date of Birth
      <div className="flex items-center gap-2"><Input type="date" value={dateOfBirth} onChange={e=>setDob(e.target.value)} className={field}/>
      {dateOfBirth?<Button type="button" variant="ghost" onClick={()=>setDob("")} aria-label="Clear date of birth">Clear</Button>:null}</div>
      <span className="text-xs font-normal text-muted-foreground">Example: 2005-08-21. Optional.</span>
    </label>
    <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] sm:col-span-2 text-[13px]">Address
      <Textarea maxLength={1000} rows={3} value={address} onChange={e=>setAddress(e.target.value)}
        className="min-w-0"/>
    </label>
      </div>
    </details>
    <div className="sticky bottom-0 z-10 flex min-w-0 flex-col gap-2 border-t border-border bg-surface py-3 sm:col-span-2 md:flex-row md:flex-wrap md:items-center">
      <Button variant="primary" type="submit" loading={pending} disabled={pending} className="min-h-11 w-full md:min-h-9 md:w-auto">
        {pending?"Registering…":"Register student"}
      </Button>
      {result&&<Alert tone={result.startsWith("Partially")?"warning":"success"}>{result}</Alert>}
      {savedMemberId?<Link href={"/college/students/"+encodeURIComponent(savedMemberId)} className="inline-flex min-h-11 items-center font-semibold text-link underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Open registered student profile →</Link>:null}
      {error&&<Alert tone="error">{error}</Alert>}
    </div>
  </form></>;
}
