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
import { JOIN_ERROR_COPY,joinErrorMessage } from "@/modules/placements/public-join/error-copy";

function knownJoinError(code:unknown):boolean{
  return typeof code==="string"&&Object.prototype.hasOwnProperty.call(JOIN_ERROR_COPY,code);
}

export function PublicRecruiterJoinForm({
  token, scope, preview, blockedReason,
}: { token: string; scope: "COLLEGE" | "COMPANY"; preview: PublicJoinPreview; blockedReason?:string|null }) {
  const hasRecordedOpen=useRef(false);
  const submittingRef=useRef(false);
  const errorSummaryRef=useRef<HTMLDivElement>(null);
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
  useEffect(()=>{if(error)errorSummaryRef.current?.focus();},[error]);
  const college = preview.kind === "READY" ? preview.collegeName : "";
  const company = preview.kind === "READY" ? preview.companyDomain ?? "" : "";
  const companyLabel = preview.kind === "READY"
    ? preview.companyName?.trim() || preview.companyDomain || "your company" : "your company";

  async function sendCode() {
    if(submittingRef.current)return;
    const validation=validatePublicJoinClient({email,name,phone,companyName,companyDomain:company,scope,stage:"SEND"});
    const parsed = publicJoinFormSchema.safeParse({ email, name, designation, phone, companyName });
    if (validation || !parsed.success) {
      setError(validation??"Enter your work email and name before requesting a code.");
      return;
    }
    submittingRef.current=true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        scope === "COMPANY" ? "/api/public/company-join/send-code" : "/api/public/college-join/send-code",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, email: parsed.data.email }) },
      );
      if(!response.ok){
        const body:unknown=await response.json().catch(()=>null);
        const code=body&&typeof body==="object"&&"error" in body?(body as {error:unknown}).error:null;
        setError(knownJoinError(code)?joinErrorMessage(code,"SEND"):publicJoinErrorCopy("SEND",response.status,String(code??"COULD_NOT_SEND_CODE"),scope,company));return;
      }
      const responseData=await response.json().catch(()=>null) as {companyName?:string|null}|null;
      setKnownCompany(responseData?.companyName??null);
      if(responseData?.companyName)setCompanyName(responseData.companyName);
      setSentTo(parsed.data.email);
      setCode("");
    } catch {
      setError(joinErrorMessage(null,"SEND"));
    } finally {
      submittingRef.current=false;
      setPending(false);
    }
  }

  async function join() {
    if(submittingRef.current)return;
    const validation=validatePublicJoinClient({email,name,phone,companyName,companyDomain:company,scope});
    const parsed = publicJoinFormSchema.safeParse({ email, name, designation, phone, companyName });
    if (validation||!parsed.success||!/^[0-9]{6}$/.test(code)) {
      setError(validation??(!code.trim()?"Enter the 6-digit code":"The code has 6 digits"));
      return;
    }
    submittingRef.current=true;
    setPending(true);
    setError("");
    try {
      const response = await fetch(
        scope === "COMPANY" ? "/api/public/company-join/join" : "/api/public/college-join/join",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...parsed.data, code }) },
      );
      if(!response.ok){
        const body:unknown=await response.json().catch(()=>null);
        const code=body&&typeof body==="object"&&"error" in body?(body as {error:unknown}).error:null;
        setError(knownJoinError(code)?joinErrorMessage(code):publicJoinErrorCopy("JOIN",response.status,String(code??"COULD_NOT_JOIN"),scope,company));return;
      }
      const result=await response.json() as {outcome:"JOINED"|"ALREADY_JOINED";signInEmail:string};
      setAlreadyJoined(result.outcome==="ALREADY_JOINED");
      setSignInEmail(result.signInEmail);
      setJoined(true);
    } catch {
      setError(joinErrorMessage(null));
    } finally {
      submittingRef.current=false;
      setPending(false);
    }
  }

  return (
    <main className={`${authStyles.page} mx-auto flex min-h-dvh w-full max-w-xl min-w-0 flex-col justify-center px-4 py-8 min-[768px]:py-12`}>
      <Card as="section" className="w-full">
        {preview.kind !== "READY" ? (
          <>
            <PageHeader title="This link is no longer valid" />
            <p className="mt-3 text-sm text-body">Ask the placement cell for a new one.</p>
          </>
        ) : blockedReason ? (
          <div role="alert" className="space-y-3">
           <PageHeader title="Recruiter verification unavailable" />
           <p className="text-sm text-body">{blockedReason}</p>
          </div>
        ) : joined ? (
          <>
            <PageHeader title={alreadyJoined?"You already have access to "+college:"You now have access to "+college} />
            <p className="mt-3 text-sm text-body">
              {alreadyJoined
                ? "You already have an account. Sign in on "+college+"'s placement address with "+signInEmail+"."
                : "Sign in with your work email, "+signInEmail+". We'll email you a code each time."}
            </p>
            <Link href="/login" className="mt-4 inline-flex min-h-11 min-[768px]:min-h-9 items-center text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Sign in</Link>
          </>
        ) : (
          <>
            <PageHeader title={scope === "COLLEGE" ? "Hire from " + college : college + " would like " + companyLabel + " to hire from their students"} />
            <p className="mt-3 text-sm text-body">
              Join with your company email. You can then request placement drives and review the students who apply.
            </p>
            {sentTo?<h2 className="mt-5 text-lg font-semibold text-foreground">One more step</h2>:null}
            <form className="mt-5 space-y-4" onSubmit={event=>{
             event.preventDefault(); if(sentTo)void join();else void sendCode();
            }}>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Work email
                <Input type="email" required autoComplete="email" value={email} disabled={Boolean(sentTo)}
                  onChange={event => setEmail(event.target.value)} maxLength={254}
                  className="w-full min-w-0" />
                <span className="text-xs font-normal text-muted-foreground">
                  {scope === "COMPANY"
                    ? "Your " + companyLabel + " email. You'll sign in with it."
                    : "Your company email. Personal emails such as Gmail can't be used. You'll sign in with it."}
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Your name
                <Input type="text" required autoComplete="name" value={name} maxLength={150}
                  onChange={event => setName(event.target.value)}
                  className="w-full min-w-0" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Designation (optional)
                <Input type="text" value={designation} maxLength={100}
                  onChange={event => setDesignation(event.target.value)}
                  className="w-full min-w-0" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Mobile (optional)
                <Input type="tel" autoComplete="tel" value={phone} maxLength={14}
                  onChange={event => setPhone(event.target.value)}
                  className="w-full min-w-0" />
                <span className="text-xs font-normal text-muted-foreground">
                  Only for the placement cell to call you. You never sign in with it.
                </span>
              </label>
              {scope === "COLLEGE"&&knownCompany?<p role="status" className="text-sm font-semibold">You are joining as {knownCompany}.</p>:null}
              {scope === "COLLEGE"&&!knownCompany&&sentTo ? (
                <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                  Company name
                  <Input type="text" value={companyName} maxLength={200}
                    onChange={event => setCompanyName(event.target.value)}
                    className="w-full min-w-0" />
                </label>
              ) : null}
              {!sentTo ? (
                <Button type="submit" loading={pending} className="w-full min-[768px]:w-auto">Send me a code</Button>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                    Code sent to {sentTo}
                    <Input value={code} required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      onChange={event => setCode(event.target.value)}
                      className="w-full min-w-0" />
                    <span className="text-xs font-normal text-muted-foreground">This proves the email is yours.</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" loading={pending} className="w-full min-[768px]:w-auto">Join {college} placements</Button>
                    <Button type="button" variant="secondary" disabled={pending} onClick={()=>void sendCode()} className="w-full min-[768px]:w-auto">Send a new code</Button>
                  </div>
                </>
              )}
              {error ? <div ref={errorSummaryRef} tabIndex={-1} className="focus:outline-none"><InlineNotice tone="error" message={error} /></div> : null}
            </form>
          </>
        )}
      </Card>
    </main>
  );
}
