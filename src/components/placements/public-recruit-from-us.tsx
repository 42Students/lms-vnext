"use client";
import { useRef,useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PUBLIC_RECRUIT_COPY,publicRecruitThanks } from "@/modules/placements/public-enquiry/public-copy";
import {publicRecruiterWorkEmailSchema} from "@/modules/placements/public-college-join-model";
import {Button} from "@/components/ui/button";

const control="w-full";
export function PublicRecruitFromUs({collegeName,enabled}:{collegeName:string;enabled:boolean}){
 const [email,setEmail]=useState(""),[name,setName]=useState(""),[company,setCompany]=useState("");
 const [mobile,setMobile]=useState(""),[hiringFor,setHiringFor]=useState("");
 const [code,setCode]=useState(""),[sent,setSent]=useState(""),[done,setDone]=useState(false);
 const [error,setError]=useState(""),[busy,setBusy]=useState(false),[unavailable,setUnavailable]=useState(false);
 const [fieldErrors,setFieldErrors]=useState({email:"",name:"",code:""});
 const clearFieldError=(field:"email"|"name"|"code")=>{
  setFieldErrors(previous=>({...previous,[field]:""}));setError("");
 };
 const savingRef=useRef(false);
 function fieldError(key:"email"|"name"|"code",message:string){
  setFieldErrors(previous=>({...previous,[key]:message}));
 }
 async function submit(kind:"send-code"|"recruit"){
  // A state update alone is not synchronous under a rapid double click.
  if(savingRef.current)return;
  const normalizedEmail=email.trim().toLowerCase();
  setError("");setFieldErrors({email:"",name:"",code:""});
  if(!normalizedEmail){fieldError("email","Enter your work email");return;}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)){
   fieldError("email","Enter a valid email");return;
  }
  if(!publicRecruiterWorkEmailSchema.max(150).safeParse(normalizedEmail).success){
   fieldError("email","Enter your company work email address. Personal email addresses cannot be used.");return;
  }
  if(!name.trim()){fieldError("name","Enter your name");return;}
  if(kind==="recruit"&&!code.trim()){
   fieldError("code","Enter the 6-digit code");return;
  }
  if(kind==="recruit"&&!/^[0-9]{6}$/.test(code.trim())){
   fieldError("code","The code has 6 digits");return;
  }
  savingRef.current=true;setBusy(true);
  try{
   const response=await fetch("/api/public/recruit-from-us/"+kind,{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify(kind==="send-code"?{email:normalizedEmail}:{
      email:normalizedEmail,code:code.trim(),name:name.trim(),company:company.trim(),
      mobile:mobile.trim(),hiringFor:hiringFor.trim(),
    }),
   });
   const data=await response.json() as {error?:string;email?:string;message?:string};
   if(!response.ok){
    if(response.status===503||data.error==="RECRUITER_ENQUIRIES_UNAVAILABLE"){
     setUnavailable(true);throw new Error(PUBLIC_RECRUIT_COPY.unavailable);
    }
    const safeMessage=typeof data.message==="string" && data.message.length<=250
      ?data.message:null;
    if(["EMAIL_REQUIRED","COMPANY_EMAIL_REQUIRED","EMAIL_INVALID",
        "INVALID_EMAIL","PERSONAL_EMAIL_NOT_ALLOWED"].includes(data.error??"")){
     fieldError("email",safeMessage??"Enter your work email");return;
    }
    if(data.error==="NAME_REQUIRED"){fieldError("name",safeMessage??"Enter your name");return;}
    if(data.error==="CODE_REQUIRED"){fieldError("code",safeMessage??"Enter the code");return;}
    if(data.error==="WRONG_CODE"||data.error==="CODE_EXPIRED"||
       data.error==="CODE_LOCKED"||data.error==="INVALID_CODE_OR_EXPIRED"||
       data.error==="INVALID_CODE"||data.error==="COULD_NOT_SEND_ENQUIRY"){
     fieldError("code",safeMessage??"The code was not accepted. Check it and try again.");return;
    }
    if(data.error==="TOO_MANY_TRIES"){
     throw new Error("Too many attempts. Please try again later.");
    }
    throw new Error(safeMessage??(kind==="send-code"?
      PUBLIC_RECRUIT_COPY.errorSend:PUBLIC_RECRUIT_COPY.errorSubmit));
   }
   if(kind==="send-code"){
    setSent(data.email??normalizedEmail);setCode("");
   }else setDone(true);
  }catch(cause){setError(cause instanceof Error?cause.message:PUBLIC_RECRUIT_COPY.errorSubmit);}
  finally{savingRef.current=false;setBusy(false);}
 }
 return <section className="mt-8 border-t border-border pt-6" aria-label="Recruit from us">
  <h2 className="text-xl font-semibold text-foreground">{PUBLIC_RECRUIT_COPY.heading}</h2>
  {done?<div role="status" className="mt-4 space-y-2">
    <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full border border-success text-2xl text-success">✓</span>
    <h3 className="font-semibold">{PUBLIC_RECRUIT_COPY.thankYou}</h3>
    <p className="text-sm text-body">{publicRecruitThanks(collegeName)}</p>
   </div>:!enabled||unavailable?<p role="alert" className="mt-3 text-sm text-body">
     {PUBLIC_RECRUIT_COPY.unavailable}
   </p>:<form className="mt-4 max-w-2xl space-y-4" onSubmit={e=>{
    e.preventDefault();void submit(sent?"recruit":"send-code");
   }} noValidate>
    <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">{PUBLIC_RECRUIT_COPY.workEmail}
     <Input className={control+" mt-1"} required type="email" maxLength={150} autoComplete="email"
      disabled={Boolean(sent)} value={email} onChange={e=>{setEmail(e.target.value);clearFieldError("email");}}/>
     <span className="block mt-1 text-xs font-normal">Your company email. We send a code to it.</span>
     {fieldErrors.email?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.email}</span>:null}
    </label>
    <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">{PUBLIC_RECRUIT_COPY.name}
     <Input className={control+" mt-1"} required maxLength={120} autoComplete="name"
      value={name} onChange={e=>{setName(e.target.value);clearFieldError("name");}}/>
     {fieldErrors.name?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.name}</span>:null}
    </label>
    {sent ? <div className="grid min-w-0 gap-4 sm:grid-cols-2">
    <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">{PUBLIC_RECRUIT_COPY.company}
     <Input className={control+" mt-1"} maxLength={150} autoComplete="organization"
      value={company} onChange={e=>setCompany(e.target.value)}/>
    </label>
    <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">{PUBLIC_RECRUIT_COPY.mobile}
     <Input className={control+" mt-1"} type="tel" maxLength={30}
      value={mobile} onChange={e=>setMobile(e.target.value)}/>
    </label>
    <label className="block min-w-0 text-[length:var(--lms-font-sm)] font-semibold sm:col-span-2 leading-4 text-[13px] text-[var(--lms-neutral-400)]">{PUBLIC_RECRUIT_COPY.hiringFor}
     <Textarea className={control+" mt-1 py-2"} maxLength={1000}
      value={hiringFor} onChange={e=>setHiringFor(e.target.value)}/>
    </label>
    </div> : null}
    {sent?<label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Code sent to {sent}
      <Input className={control+" mt-1"} inputMode="numeric" pattern="[0-9]{6}"
       required maxLength={6} autoComplete="one-time-code" value={code}
       onChange={e=>{setCode(e.target.value);clearFieldError("code");}}/>
      {fieldErrors.code?<span role="alert" className="mt-1 block text-xs text-error">{fieldErrors.code}</span>:null}
      <span className="block mt-1 text-xs font-normal">{PUBLIC_RECRUIT_COPY.code} Enter the six-digit code received by email; it may autofill on supported devices.</span>
     </label>:null}
    {error?<p role="alert" className="text-sm text-body">{error}</p>:null}
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="submit" disabled={busy} className="min-h-11 w-full sm:w-auto sm:min-h-9">
        {sent?PUBLIC_RECRUIT_COPY.submit:PUBLIC_RECRUIT_COPY.send}
      </Button>
      {sent?<Button variant="secondary" type="button" disabled={busy} className="min-h-11 w-full sm:w-auto sm:min-h-9"
        onClick={()=>void submit("send-code")}>Send a new code</Button>:null}
      {sent?<p className="text-xs text-muted-foreground">Requesting a new code invalidates the previous code. You can still use the verified work email, name and optional company details.</p>:null}
    </div>
   </form>}
 </section>;
}
