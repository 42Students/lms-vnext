"use client";

import Link from "next/link";
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
  const college = preview.kind === "READY" ? preview.collegeName : "";
  const company = preview.kind === "READY" ? preview.companyDomain ?? "" : "";
  const companyLabel = preview.kind === "READY"
    ? preview.companyName?.trim() || preview.companyDomain || "your company" : "your company";

  async function sendCode() {
    const validation=validatePublicJoinClient({email,name,phone,companyName,companyDomain:company,scope,stage:"SEND"});
    const parsed = publicJoinFormSchema.safeParse({ email, name, designation, phone, companyName });
    if (validation || !parsed.success) {
      setError(validation??"Enter your work email and name before requesting a code.");
      return;
    }
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
      setPending(false);
    }
  }

  async function join() {
    const validation=validatePublicJoinClient({email,name,phone,companyName,companyDomain:company,scope});
    const parsed = publicJoinFormSchema.safeParse({ email, name, designation, phone, companyName });
    if (validation||!parsed.success||!/^[0-9]{6}$/.test(code)) {
      setError(validation??(!code.trim()?"Enter the 6-digit code":"The code has 6 digits"));
      return;
    }
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
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-4 py-10">
      <section className="min-w-0 rounded-xl border border-border bg-surface p-5 sm:p-6">
        {preview.kind !== "READY" ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">This link is no longer valid</h1>
            <p className="mt-3 text-sm text-body">Ask the placement cell for a new one.</p>
          </>
        ) : blockedReason ? (
          <div role="alert" className="space-y-3">
           <h1 className="text-xl font-semibold">Recruiter verification unavailable</h1>
           <p className="text-sm text-body">{blockedReason}</p>
          </div>
        ) : joined ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">{alreadyJoined?"You already have access to "+college:"You now have access to "+college}</h1>
            <p className="mt-3 text-sm text-body">
              {alreadyJoined
                ? "You already have an account. Sign in on "+college+"'s placement address with "+signInEmail+"."
                : "Sign in with your work email, "+signInEmail+". We'll email you a code each time."}
            </p>
            <Link href="/login" className="mt-4 inline-flex min-h-11 items-center text-primary-text underline">Sign in</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground">
              {scope === "COLLEGE" ? "Hire from " + college : college + " would like " + companyLabel + " to hire from their students"}
            </h1>
            <p className="mt-3 text-sm text-body">
              Join with your company email. You can then request placement drives and review the students who apply.
            </p>
            {sentTo?<h2 className="mt-5 text-lg font-semibold text-foreground">One more step</h2>:null}
            <form className="mt-5 space-y-4" onSubmit={event=>{
             event.preventDefault(); if(sentTo)void join();else void sendCode();
            }}>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Work email
                <input type="email" required autoComplete="email" value={email} disabled={Boolean(sentTo)}
                  onChange={event => setEmail(event.target.value)} maxLength={254}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                <span className="text-xs font-normal text-muted-foreground">
                  {scope === "COMPANY"
                    ? "Your " + companyLabel + " email. You'll sign in with it."
                    : "Your company email. Personal emails such as Gmail can't be used. You'll sign in with it."}
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Your name
                <input type="text" required autoComplete="name" value={name} maxLength={150}
                  onChange={event => setName(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Designation (optional)
                <input type="text" value={designation} maxLength={100}
                  onChange={event => setDesignation(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Mobile (optional)
                <input type="tel" autoComplete="tel" value={phone} maxLength={14}
                  onChange={event => setPhone(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                <span className="text-xs font-normal text-muted-foreground">
                  Only for the placement cell to call you. You never sign in with it.
                </span>
              </label>
              {scope === "COLLEGE"&&knownCompany?<p role="status" className="text-sm font-semibold">You are joining as {knownCompany}.</p>:null}
              {scope === "COLLEGE"&&!knownCompany&&sentTo ? (
                <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                  Company name
                  <input type="text" value={companyName} maxLength={200}
                    onChange={event => setCompanyName(event.target.value)}
                    className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                </label>
              ) : null}
              {!sentTo ? (
                <button type="submit" disabled={pending}
                  className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
                  Send me a code
                </button>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                    Code sent to {sentTo}
                    <input value={code} required autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      onChange={event => setCode(event.target.value)}
                      className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                    <span className="text-xs font-normal text-muted-foreground">This proves the email is yours.</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button type="submit" disabled={pending}
                      className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
                      Join {college} placements
                    </button>
                    <button type="button" disabled={pending}
                      onClick={()=>void sendCode()}
                      className="min-h-11 rounded-md border border-border px-4 font-semibold text-foreground">
                      Send a new code
                    </button>
                  </div>
                </>
              )}
              {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            </form>
          </>
        )}
      </section>
    </main>
  );
}
