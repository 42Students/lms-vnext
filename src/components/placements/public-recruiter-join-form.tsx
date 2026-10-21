"use client";
import { PageHeader } from "@/components/ui/page-header";

import authStyles from "@/components/public/public-auth-skin.module.css";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineNotice } from "@/components/ui/inline-notice";
import { useEffect,useRef,useState } from "react";
import type { PublicJoinPreview } from "@/modules/placements/public-join/preview-model";
import { publicJoinErrorCopy,validatePublicJoinClient } from "@/modules/placements/public-join/client-error-model";
import { publicJoinFormSchema } from "@/modules/placements/public-join/form-model";
import { publicRecruiterWorkEmailSchema } from "@/modules/placements/public-college-join-model";
import { JOIN_ERROR_COPY,joinErrorMessage } from "@/modules/placements/public-join/error-copy";

type JoinField="email"|"name"|"phone"|"companyName"|"code";
function joinFieldForError(message:string):JoinField|null{
 if(message.startsWith("Enter your company name"))return "companyName";
 if(message.startsWith("Enter your name"))return "name";
 if(message.includes("mobile")||message.includes("phone"))return "phone";
 if(message.includes("code")||message.includes("Code"))return "code";
 if(message.includes("email")||message.includes("domain"))return "email";
 return null;
}
function joinFieldForCode(code:unknown):JoinField|null{
 if(typeof code!=="string")return null;
 if(["WRONG_CODE","CODE_EXPIRED","CODE_LOCKED","CODE_REQUIRED"].includes(code))return "code";
 if(["EMAIL_NO_MX","EMAIL_MX_UNAVAILABLE","OTHER_COMPANY_EMAIL"].includes(code))return "email";
 if(["INVALID_MOBILE","PHONE_STORAGE_NOT_READY"].includes(code))return "phone";
 if(["INVALID_NAME","NAME_REQUIRED"].includes(code))return "name";
 if(["INVALID_COMPANY_NAME","COMPANY_REQUIRED"].includes(code))return "companyName";
 return null;
}
function knownJoinError(code:unknown):boolean{
  return typeof code==="string"&&Object.prototype.hasOwnProperty.call(JOIN_ERROR_COPY,code);
}

export function PublicRecruiterJoinForm({
  token, scope, preview, blockedReason,
}: { token: string; scope: "COLLEGE" | "COMPANY"; preview: PublicJoinPreview; blockedReason?:string|null }) {
  const hasRecordedOpen=useRef(false);
  const submittingRef=useRef(false);
  const errorSummaryRef=useRef<HTMLDivElement>(null);
  const emailRef=useRef<HTMLInputElement>(null);
  const nameRef=useRef<HTMLInputElement>(null);
  const phoneRef=useRef<HTMLInputElement>(null);
  const companyNameRef=useRef<HTMLInputElement>(null);
  const codeRef=useRef<HTMLInputElement>(null);
  useEffect(()=>{
    if(preview.kind!=="READY"||hasRecordedOpen.current)return;
    hasRecordedOpen.current=true;
    void fetch("/api/public/join-link/open",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({token,scope})}).catch(()=>undefined);
  },[token,scope,preview.kind]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [knownCompany,setKnownCompany]=useState<string|null>(null);
  const [joined, setJoined] = useState(false);
  const [alreadyJoined,setAlreadyJoined]=useState(false);
  const [signInEmail,setSignInEmail]=useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors,setFieldErrors]=useState<Partial<Record<JoinField,string>>>({});
  const [focusField,setFocusField]=useState<JoinField|null>(null);
  function showError(message:string,field:JoinField|null=null){
   setError(message);setFocusField(field);
   setFieldErrors(field?{[field]:message}:{});
  }
  function clearField(field:JoinField){
   setFieldErrors(current=>({...current,[field]:undefined}));
   if(focusField===field){setError("");setFocusField(null);}
  }
  useEffect(()=>{
   if(!error)return;
   const target=focusField==="email"?emailRef.current:
    focusField==="name"?nameRef.current:
    focusField==="phone"?phoneRef.current:
    focusField==="companyName"?companyNameRef.current:
    focusField==="code"?codeRef.current:null;
   (target??errorSummaryRef.current)?.focus();
  },[error,focusField]);
  const college = preview.kind === "READY" ? preview.collegeName : "";
  const company = preview.kind === "READY" ? preview.companyDomain ?? "" : "";
  const companyLabel = preview.kind === "READY"
    ? preview.companyName?.trim() || "your company" : "your company";

  async function sendCode() {
    if(submittingRef.current)return;
    // Email-only stage: name, phone and company are checked when joining.
    const validation=validatePublicJoinClient({email,name,phone,companyName,companyDomain:company,scope,stage:"SEND"});
    const parsed=publicRecruiterWorkEmailSchema.safeParse(email);
    if(validation||!parsed.success){
      showError(validation??"Enter a valid email","email");return;
    }
    submittingRef.current=true;
    setPending(true);
    setError("");setFieldErrors({});setFocusField(null);
    try {
      const response = await fetch(
        scope === "COMPANY" ? "/api/public/company-join/send-code" : "/api/public/college-join/send-code",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: parsed.data }) },
      );
      if(!response.ok){
        const body:unknown=await response.json().catch(()=>null);
        const code=body&&typeof body==="object"&&"error" in body?(body as {error:unknown}).error:null;
        showError(knownJoinError(code)?joinErrorMessage(code,"SEND"):publicJoinErrorCopy("SEND",response.status,String(code??"COULD_NOT_SEND_CODE"),scope,company),joinFieldForCode(code));return;
      }
      const responseData=await response.json().catch(()=>null) as {companyName?:string|null}|null;
      setKnownCompany(responseData?.companyName??null);
      if(responseData?.companyName)setCompanyName(responseData.companyName);
      setSentTo(parsed.data);
      setCode("");
      queueMicrotask(()=>codeRef.current?.focus());
    } catch {
      showError(joinErrorMessage(null,"SEND"));
    } finally {
      submittingRef.current=false;
      setPending(false);
    }
  }

  async function join() {
    if(submittingRef.current)return;
    const validation=validatePublicJoinClient({email,name,phone,companyName,companyDomain:company,scope});
    const parsed = publicJoinFormSchema.safeParse({ email, name, designation, phone, companyName });
    if(validation||!parsed.success||!/^[0-9]{6}$/.test(code)){
     const rawField=validation?joinFieldForError(validation):
      (parsed.success?null:parsed.error.issues[0]?.path[0]);
     const field:JoinField|null=rawField==="email"||rawField==="name"||
      rawField==="phone"||rawField==="companyName"?rawField:
      !/^[0-9]{6}$/.test(code)?"code":null;
     const message=validation??(field==="code"?
      (!code.trim()?"Enter the 6-digit code":"The code has 6 digits"):
      field==="name"?"Enter your name":field==="email"?"Enter a valid email":
      field==="companyName"?"Enter your company name":
      field==="phone"?"Enter a valid 10-digit mobile number, or leave it blank.":"Check the contact details.");
     showError(message,field);return;
    }
    submittingRef.current=true;
    setPending(true);
    setError("");setFieldErrors({});setFocusField(null);
    try {
      const response = await fetch(
        scope === "COMPANY" ? "/api/public/company-join/join" : "/api/public/college-join/join",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...parsed.data, code }) },
      );
      if(!response.ok){
        const body:unknown=await response.json().catch(()=>null);
        const code=body&&typeof body==="object"&&"error" in body?(body as {error:unknown}).error:null;
        showError(knownJoinError(code)?joinErrorMessage(code):publicJoinErrorCopy("JOIN",response.status,String(code??"COULD_NOT_JOIN"),scope,company),joinFieldForCode(code));return;
      }
      const result=await response.json() as {
        outcome?:"JOINED"|"ALREADY_JOINED";status?:"JOINED"|"ALREADY_JOINED";
        signInEmail?:string;email?:string;
      };
      setAlreadyJoined((result.outcome??result.status)==="ALREADY_JOINED");
      setSignInEmail(result.signInEmail||result.email||email);
      setJoined(true);
    } catch {
      showError(joinErrorMessage(null));
    } finally {
      submittingRef.current=false;
      setPending(false);
    }
  }

  return (
    <main className={`${authStyles.page} !bg-[#f5f7f9] mx-auto flex min-h-dvh w-full min-w-0 items-center justify-center px-4 py-4`}>
      <Card as="section" className="w-full max-w-[440px] rounded-[8px] border border-[var(--lms-canvas-border)] bg-white p-4 shadow-sm sm:p-5">
        {preview.kind !== "READY" ? (
          <>
            <div className="mb-4 flex justify-center" aria-hidden="true">
             <svg className="size-12 text-warning" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="24" cy="24" r="21"/><path strokeLinecap="round" d="M24 12v16m0 7v1"/></svg>
            </div>
            <PageHeader title="This link is no longer valid" />
            <p className="mt-3 max-w-prose break-words text-sm leading-6 text-body">Ask the placement cell for a new one. Already joined? Sign in with your work email.</p>
            <Link href="/login" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Sign in</Link>
          </>
        ) : blockedReason ? (
          <div role="alert" className="space-y-3">
           <PageHeader title="Recruiter verification unavailable" />
           <p className="text-sm text-body">{blockedReason}</p>
          </div>
        ) : joined ? (
          <>
            <span aria-hidden="true" className="mb-3 flex size-10 items-center justify-center rounded-full bg-[var(--lms-primary-subtle)] text-lg font-bold text-primary-text">✓</span>
            <PageHeader title={alreadyJoined?"You already have access to "+college:"You now have access to "+college} />
            <p className="mt-3 text-sm text-body">
              {"Sign in with your work email, "+signInEmail+", on the college's placement address. We'll email you a code each time."}
            </p>
            <Link href="/login" className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] bg-primary px-4 text-sm font-semibold text-on-primary min-[768px]:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Sign in</Link>
          </>
        ) : (
          <>
            <PageHeader title={scope === "COLLEGE" ? "Hire from " + college : college + " would like " + companyLabel + " to hire from their students"} />
            <p className="mt-3 text-sm text-body">
              Join with your {companyLabel} email. You can then request placement drives and review the students who apply.
            </p>
            {sentTo?<h2 className="mt-5 text-lg font-semibold text-foreground">One more step</h2>:null}
            <form noValidate className="mt-4 min-w-0 space-y-4" aria-busy={pending} onSubmit={event=>{
             event.preventDefault(); if(sentTo)void join();else void sendCode();
            }}>
              <label className="flex flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                Work email
                <Input ref={emailRef} type="email" required autoComplete="email" value={email} readOnly={Boolean(sentTo)}
                  aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email?"join-email-error":undefined}
                  onChange={event => {setEmail(event.target.value);clearField("email");}} maxLength={254}
                  className="w-full min-w-0" />
                {fieldErrors.email?<span id="join-email-error" role="alert" className="text-xs font-normal text-error">{fieldErrors.email}</span>:null}
                <span className="text-xs font-normal text-muted-foreground">
                  {scope === "COMPANY"
                    ? "Your " + companyLabel + " email. You'll sign in with it."
                    : "Your company email. Personal emails such as Gmail can't be used. You'll sign in with it."}
                </span>
              </label>
              <label className="flex flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                Your name
                <Input ref={nameRef} type="text" required autoComplete="name" value={name} maxLength={150}
                  aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name?"join-name-error":undefined}
                  onChange={event => {setName(event.target.value);clearField("name");}}
                  className="w-full min-w-0" />
                {fieldErrors.name?<span id="join-name-error" role="alert" className="text-xs font-normal text-error">{fieldErrors.name}</span>:null}
              </label>
              <div className="min-w-0 space-y-4 border-t border-[var(--lms-canvas-border)] pt-3">
              <label className="flex flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                Designation (optional)
                <Input type="text" value={designation} maxLength={150}
                  onChange={event => setDesignation(event.target.value)}
                  className="w-full min-w-0" />
              </label>
              <label className="flex flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                Mobile (optional)
                <Input ref={phoneRef} type="tel" autoComplete="tel" value={phone} maxLength={14}
                  aria-invalid={Boolean(fieldErrors.phone)} aria-describedby={fieldErrors.phone?"join-phone-error":undefined}
                  onChange={event => {setPhone(event.target.value);clearField("phone");}}
                  className="w-full min-w-0" />
                {fieldErrors.phone?<span id="join-phone-error" role="alert" className="text-xs font-normal text-error">{fieldErrors.phone}</span>:null}
                <span className="text-xs font-normal text-muted-foreground">
                  Only for the placement cell to call you. You never sign in with it.
                </span>
              </label>
              </div>
              {scope === "COLLEGE"&&knownCompany?<p role="status" className="text-sm font-semibold">You are joining as {knownCompany}.</p>:null}
              {scope === "COLLEGE"&&!knownCompany&&sentTo ? (
                <label className="flex flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                  Company name
                  <Input ref={companyNameRef} type="text" value={companyName} maxLength={200}
                    required={scope==="COLLEGE"&&!knownCompany} autoComplete="organization"
                    aria-invalid={Boolean(fieldErrors.companyName)} aria-describedby={fieldErrors.companyName?"join-company-error":undefined}
                    onChange={event => {setCompanyName(event.target.value);clearField("companyName");}}
                    className="w-full min-w-0" />
                  {fieldErrors.companyName?<span id="join-company-error" role="alert" className="text-xs font-normal text-error">{fieldErrors.companyName}</span>:null}
                </label>
              ) : null}
              {!sentTo ? (
                <Button type="submit" loading={pending} className="min-h-11 w-full min-[768px]:min-h-9">Send me a code</Button>
              ) : (
                <>
                  <label className="flex flex-col gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">
                    Code sent to {sentTo}
                    <Input ref={codeRef} value={code} required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      aria-invalid={Boolean(fieldErrors.code)} aria-describedby={fieldErrors.code?"join-code-error":undefined}
                      onChange={event => {setCode(event.target.value);clearField("code");}}
                      className="w-full min-w-0" />
                    {fieldErrors.code?<span id="join-code-error" role="alert" className="text-xs font-normal text-error">{fieldErrors.code}</span>:null}
                    <span className="text-xs font-normal text-muted-foreground">This proves the email is yours.</span>
                  </label>
                  <div className="flex min-w-0 flex-col items-stretch gap-2">
                    <Button type="submit" loading={pending} className="w-full">Join {college} placements</Button>
                    <button type="button" disabled={pending} onClick={()=>void sendCode()} className="min-h-11 w-full px-2 text-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover disabled:opacity-50 md:min-h-9">Send a new code</button>
                  </div>
                </>
              )}
              {error ? <div ref={errorSummaryRef} tabIndex={-1} role="alert" aria-live="assertive" className="focus:outline-none"><InlineNotice tone="error" message={error} /></div> : null}
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
