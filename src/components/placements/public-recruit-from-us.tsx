"use client";
import { useState } from "react";
import { PUBLIC_RECRUIT_COPY,publicRecruitThanks } from "@/modules/placements/public-enquiry/public-copy";
import {publicRecruiterWorkEmailSchema} from "@/modules/placements/public-college-join-model";

const control="min-h-11 w-full rounded-[9px] border border-border bg-surface px-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-[var(--lms-focus-ring)] md:min-h-9";
export function PublicRecruitFromUs({collegeName,enabled}:{collegeName:string;enabled:boolean}){
 const [email,setEmail]=useState(""),[name,setName]=useState(""),[company,setCompany]=useState("");
 const [mobile,setMobile]=useState(""),[hiringFor,setHiringFor]=useState("");
 const [code,setCode]=useState(""),[sent,setSent]=useState(""),[done,setDone]=useState(false);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[unavailable,setUnavailable]=useState(false);
 async function submit(kind:"send-code"|"recruit"){
  if(!publicRecruiterWorkEmailSchema.max(150).safeParse(email).success){
   setError("Enter your company work email address. Personal email addresses cannot be used.");return;
  }
  if(kind==="recruit"&&!/^[0-9]{6}$/.test(code)){
   setError("Enter the 6-digit code sent to your email.");return;
  }
  setBusy(true);setError("");
  try{
   const response=await fetch("/api/public/recruit-from-us/"+kind,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(kind==="send-code"?{email}:{email,code,name,company,mobile,hiringFor}),
   });
   const data=await response.json() as {error?:string};
   if(!response.ok){
    if(response.status===503||data.error==="RECRUITER_ENQUIRIES_UNAVAILABLE"){
     setUnavailable(true);throw new Error(PUBLIC_RECRUIT_COPY.unavailable);
    }
    throw new Error(kind==="send-code"?PUBLIC_RECRUIT_COPY.errorSend:PUBLIC_RECRUIT_COPY.errorSubmit);
   }
   if(kind==="send-code"){setSent(email);setCode("");}
   else setDone(true);
  }catch(cause){setError(cause instanceof Error?cause.message:PUBLIC_RECRUIT_COPY.errorSubmit);}
  finally{setBusy(false);}
 }
 return <section className="mt-8 border-t border-border pt-6" aria-label="Recruit from us">
  <h2 className="text-xl font-semibold text-foreground">{PUBLIC_RECRUIT_COPY.heading}</h2>
  {done?<div role="status" className="mt-4 space-y-2">
    <h3 className="font-semibold">{PUBLIC_RECRUIT_COPY.thankYou}</h3>
    <p className="text-sm text-body">{publicRecruitThanks(collegeName)}</p>
   </div>:!enabled||unavailable?<p role="alert" className="mt-3 text-sm text-body">
     {PUBLIC_RECRUIT_COPY.unavailable}
   </p>:<form className="mt-4 space-y-4" onSubmit={e=>{
    e.preventDefault();void submit(sent?"recruit":"send-code");
   }}>
    <label className="block text-sm font-semibold text-body">{PUBLIC_RECRUIT_COPY.workEmail}
     <input className={control+" mt-1"} required type="email" maxLength={150} autoComplete="email"
      disabled={Boolean(sent)} value={email} onChange={e=>setEmail(e.target.value)}/>
     <span className="block mt-1 text-xs font-normal">Your company email. We send a code to it.</span>
    </label>
    <label className="block text-sm font-semibold text-body">{PUBLIC_RECRUIT_COPY.name}
     <input className={control+" mt-1"} required maxLength={120} disabled={Boolean(sent)}
      value={name} onChange={e=>setName(e.target.value)}/>
    </label>
    <label className="block text-sm font-semibold text-body">{PUBLIC_RECRUIT_COPY.company}
     <input className={control+" mt-1"} required maxLength={150} disabled={Boolean(sent)}
      value={company} onChange={e=>setCompany(e.target.value)}/>
    </label>
    <label className="block text-sm font-semibold text-body">{PUBLIC_RECRUIT_COPY.mobile}
     <input className={control+" mt-1"} type="tel" maxLength={30} disabled={Boolean(sent)}
      value={mobile} onChange={e=>setMobile(e.target.value)}/>
    </label>
    <label className="block text-sm font-semibold text-body">{PUBLIC_RECRUIT_COPY.hiringFor}
     <textarea className={control+" mt-1 py-2"} maxLength={1500} disabled={Boolean(sent)}
      value={hiringFor} onChange={e=>setHiringFor(e.target.value)}/>
    </label>
    {sent?<label className="block text-sm font-semibold text-body">Code sent to {sent}
      <input className={control+" mt-1"} inputMode="numeric" pattern="[0-9]{6}"
       required maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/>
      <span className="block mt-1 text-xs font-normal">{PUBLIC_RECRUIT_COPY.code}</span>
     </label>:null}
    {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
    {sent?<button type="button" disabled={busy}
      className="min-h-11 rounded-[9px] md:min-h-9 border border-border px-4 text-sm text-primary-text disabled:opacity-50"
      onClick={()=>void submit("send-code")}>Send a new code</button>:null}
    <button type="submit" disabled={busy}
     className="min-h-11 rounded-[9px] md:min-h-9 bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
      {sent?PUBLIC_RECRUIT_COPY.submit:PUBLIC_RECRUIT_COPY.send}
    </button>
   </form>}
 </section>;
}
