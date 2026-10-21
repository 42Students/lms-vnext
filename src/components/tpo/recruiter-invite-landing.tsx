"use client";

import authStyles from "@/components/public/public-auth-skin.module.css";
import { PageHeader } from "@/components/ui/page-header";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { InlineNotice } from "@/components/ui/inline-notice";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import { recruiterInvitePreviewDisposition,RECRUITER_INVITE_LOAD_ERROR_HEADING } from "@/modules/placements/recruiter-invite-preview-disposition-model";

type Invite = {
  collegeName: string;
  companyName: string | null;
  contactName: string;
  contactEmail:string|null;
  designation: string | null;
  expiresAt: string;
  reviewDrive?: string | null;
};
type State = "loading" | "ready" | "invalid" | "load_error" | "declined" | "joined" | "pending";
type Field = "email" | "name" | "mobile" | "code";

const UNCONFIRMED = "We could not confirm that the invitation was accepted. Your form is still here; please retry.";
const ACCOUNT_UNAVAILABLE = "This account can't be used. Please contact the placement cell.";
const fieldErrorMessages:Record<string,{field:Field;message:string}> = {
 INVALID_MOBILE:{field:"mobile",message:"Enter a valid 10-digit mobile number, or leave it blank."},
 FIRST_NAME_REQUIRED:{field:"name",message:"Enter your name."},
 COMPANY_EMAIL_REQUIRED:{field:"email",message:"Enter your work email"},
 EMAIL_REQUIRED:{field:"email",message:"Enter your work email"},
 WRONG_CODE:{field:"code",message:"That code did not work. Check the latest email or send a new code."},
 CODE_REQUIRED:{field:"code",message:"Enter the 6-digit code"},
 CODE_EXPIRED:{field:"code",message:"That code has expired. Send a new code."},
 CODE_LOCKED:{field:"code",message:"Too many attempts. Ask for a new code."},
};

const actionLink="lms-inline-link inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-button-primary)] bg-[var(--lms-button-primary)] px-4 py-2 text-[14px] font-[650] text-[var(--lms-on-primary)] transition-colors duration-[150ms] hover:border-[var(--lms-button-primary-hover)] hover:bg-[var(--lms-button-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] md:min-h-9 motion-reduce:transition-none";

export function RecruiterInviteLanding({ token }: { token: string }) {
  const [state, setState] = useState<State>("loading");
  const [retrySequence,setRetrySequence] = useState(0);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef=useRef(false);
  const errorRef=useRef<HTMLDivElement>(null);
  const [requestedEmail,setRequestedEmail]=useState("");
  const [codeSentTo,setCodeSentTo]=useState("");
  const [actionError, setActionError] = useState("");
  const [fieldErrors,setFieldErrors] = useState<Partial<Record<Field,string>>>({});
  const [joinedEmail,setJoinedEmail] = useState("");
  // Only a server-attested outcome can display JOINED or PENDING_HR.
  // The current backend returns JOINED; retain the legacy pending result
  // presentation for an explicitly verified future consent handoff.
  const errorFor=(field:Field)=>fieldErrors[field];
  const clearField=(field:Field)=>setFieldErrors(previous=>({...previous,[field]:undefined}));
  const showError=(error:unknown,fallback:string)=>{
    if(error instanceof FriendlyFetchError && (error.status===404 || error.status===410)){
      setState("invalid");
      return;
    }
    if(error instanceof FriendlyFetchError){
      if(error.code==="ACCOUNT_UNAVAILABLE"){
        setActionError(ACCOUNT_UNAVAILABLE);
        return;
      }
      const mapped=error.code?fieldErrorMessages[error.code]:undefined;
      if(mapped){
        setFieldErrors(previous=>({...previous,[mapped.field]:mapped.message}));
        return;
      }
      const fields=error.fieldErrors;
      const candidates:[string,Field][]=[
        ["firstName","name"],["name","name"],["phone","mobile"],
        ["mobile","mobile"],["email","email"],["code","code"],
      ];
      const serverErrors:Partial<Record<Field,string>>={};
      for(const [serverField,field] of candidates){
        const message=fields[serverField];
        if(message && !serverErrors[field]){
          serverErrors[field]=message;
        }
      }
      if(Object.keys(serverErrors).length){
        setFieldErrors(previous=>({...previous,...serverErrors}));
        return;
      }
    }
    // Do not render raw transport/server exception bodies on a public invite.
    // Field-level messages above are vetted and match the old LMS wording.
    setActionError(fallback);
  };
  useEffect(()=>{if(actionError)errorRef.current?.focus();},[actionError]);
  useEffect(()=>{
   const first=(["email","name","mobile","code"] as const)
    .find(field=>Boolean(fieldErrors[field]));
   if(first)document.getElementById("invite-"+first)?.focus();
  },[fieldErrors]);
  const [codeSent,setCodeSent]=useState(false);
  const [code,setCode]=useState("");
  const [name,setName]=useState("");
  const [designation,setDesignation]=useState("");
  const [mobile,setMobile]=useState("");

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{invite?:Invite}>("/api/public/recruiter-invite/" + encodeURIComponent(token), {
      cache:"no-store",signal:controller.signal,
    }).then(data=>{
      if(controller.signal.aborted)return;
      // A 200 with incomplete preview fields is not proof of a usable invite.
      const valid=Boolean(data.invite && typeof data.invite.collegeName==="string" &&
        data.invite.collegeName.trim() && typeof data.invite.contactName==="string");
      if(!valid){setState("load_error");return;}
      const outcome=recruiterInvitePreviewDisposition(200,true);
      if(outcome!=="ready"){setState(outcome);return;}
      setInvite(data.invite??null);
      setName(data.invite?.contactName??"");
      setDesignation(data.invite?.designation??"");
      setRequestedEmail(data.invite?.contactEmail??"");
      setCodeSentTo("");
      setFieldErrors({});
      setJoinedEmail("");
      setState("ready");
      void apiFetch<void>("/api/public/recruiter-invite/"+encodeURIComponent(token)+"/opened",{
        method:"POST",credentials:"same-origin",signal:controller.signal,
      }).catch(()=>undefined);
    }).catch(error=>{
      if(controller.signal.aborted)return;
      setState(error instanceof FriendlyFetchError && (error.status===404||error.status===410)?"invalid":"load_error");
    });
    return () => controller.abort();
  }, [token,retrySequence]);

  async function answer(kind: "not-hiring" | "unsubscribe") {
    if(busyRef.current)return;
    busyRef.current=true;
    setBusy(true);
    setActionError("");
    try {
      await apiFetch<void>(
        "/api/public/recruiter-invite/"+encodeURIComponent(token)+"/"+kind,
        {method:"POST",credentials:"same-origin"},
      );
      setState("declined");
    } catch(error) {
      showError(error,"That did not work. Please try again.");
    } finally {
      busyRef.current=false;
      setBusy(false);
    }
  }

  async function acceptCode(){
    if(busyRef.current)return;
    const problems:Partial<Record<Field,string>>={};
    if(!name.trim())problems.name="Enter your name.";
    else if(name.trim().length>100)problems.name="Name cannot exceed 100 characters.";
    if(!code.trim())problems.code="Enter the 6-digit code";
    else if(!/^[0-9]{6}$/.test(code))problems.code="The code has 6 digits";
    const digits=mobile.replace(/\D/g,"");
    if(digits && digits.length!==10 && !(digits.length===12&&digits.startsWith("91"))){
      problems.mobile="Enter a valid 10-digit mobile number, or leave it blank.";
    }
    if(!invite?.contactEmail?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.contactEmail)){
      // Current server binds the invite to a TPO-verified mailbox; accepting a
      // typed replacement would silently fail its email-ownership contract.
      problems.email="Ask the placement cell to add your work email to the invitation.";
    }
    if(Object.keys(problems).length){
      setFieldErrors(problems);
      setActionError("");
      return;
    }
    busyRef.current=true;
    setBusy(true);
    setActionError("");
    setFieldErrors({});
    try{
      const outcome=await apiFetch<unknown>("/api/public/recruiter-invite/"+encodeURIComponent(token)+"/accept",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({code,name:name.trim(),designation,mobile}),
      });
      if(!outcome || typeof outcome!=="object" || Array.isArray(outcome)){
        setActionError(UNCONFIRMED);
        return;
      }
      const result=outcome as Record<string,unknown>;
      if(result.accepted!==true ||
         (result.outcome!=="JOINED" && result.outcome!=="PENDING_HR") ||
         typeof result.signInEmail!=="string" || !result.signInEmail.trim() ||
         result.signInEmail.trim().toLowerCase()!==invite?.contactEmail?.trim().toLowerCase()){
        // An accepted response must affirm the SAME email that received OTP.
        // An unrelated mailbox is not proof of an authorized college grant.
        setActionError(UNCONFIRMED);
        return;
      }
      setJoinedEmail(result.signInEmail);
      setState(result.outcome==="PENDING_HR"?"pending":"joined");
    }catch(error){
      showError(error,"Something went wrong. Please try again.");
    }
    finally{busyRef.current=false;setBusy(false);}
  }
  async function sendCode(){
    if(busyRef.current)return;
    busyRef.current=true;
    setBusy(true);setActionError("");
    try{
      if(!invite?.contactEmail?.trim() ||
         !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(invite.contactEmail)){
        setFieldErrors({email:"Ask the placement cell to verify your work email before a code can be sent."});
        return;
      }
      const delivery=await apiFetch<unknown>("/api/public/recruiter-invite/"+encodeURIComponent(token)+"/send-code",{
        method:"POST",credentials:"same-origin",
      });
      if(!delivery || typeof delivery!=="object" || Array.isArray(delivery) ||
         (delivery as Record<string,unknown>).sent!==true){
        setActionError("We couldn't confirm that the code was sent. Please retry.");
        return;
      }
      // The endpoint does not echo a mailbox; it only delivers to the
      // persisted, verified invite email. Never present arbitrary client
      // input as the confirmed recipient.
      setCodeSentTo(invite.contactEmail.trim());
      setCodeSent(true);
      setCode("");
      setFieldErrors({});
    }catch(error){
      showError(error,"We couldn't send the code. Please try again.");
    }finally{busyRef.current=false;setBusy(false);}
  }

  const shell = (children: React.ReactNode) => (
    <main className={`${authStyles.page} flex min-h-dvh min-w-0 items-center justify-center bg-[#f5f7f9] px-4 py-8 md:py-12`}>
      <Card as="section" className="w-full max-w-[440px]">
        {children}
      </Card>
    </main>
  );

  if (state === "loading") {
    return shell(
      <Skeleton variant="form" count={4} label="Loading invitation…" />,
    );
  }

  if(state === "load_error") {
    return shell(<div className="space-y-4 text-center">
      <PageHeader title={RECRUITER_INVITE_LOAD_ERROR_HEADING} />
      <p className="text-sm text-muted-foreground leading-[22px]">Check your connection and try again. Your invitation has not been consumed.</p>
      <Button type="button" className="min-h-11 w-full md:min-h-9" onClick={()=>{
        setState("loading");setRetrySequence(i=>i+1);
      }}>Retry</Button>
    </div>);
  }

  if (state === "invalid" || !invite) {
    return shell(
      <div className="space-y-3 text-center" role="alert">
        <PageHeader title="This link is no longer valid" />
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">
          It may have expired or already been used. Ask the placement cell to send you a new one. Already joined? Sign in with your work email.
        </p>
        <Link className={actionLink} href="/login">Sign in</Link>
      </div>,
    );
  }

  if(state==="pending"){
    return shell(<div className="text-center space-y-3" role="status" aria-live="polite">
      <span aria-hidden="true" className="mx-auto flex size-12 items-center justify-center rounded-full border border-[var(--lms-canvas-border)] text-2xl text-[var(--lms-primary)]">i</span>
      <PageHeader title="One more step" />
      <p className="text-sm text-muted-foreground leading-[22px]">You already have a 42LMS account. Sign in on {invite.collegeName}&apos;s placement address with your work email to accept the invitation.</p>
      <Link className={actionLink} href="/login">Sign in</Link>
    </div>);
  }
  if(state==="joined"){
    return shell(<div className="text-center space-y-3" role="status" aria-live="polite">
      <span aria-hidden="true" className="mx-auto flex size-12 items-center justify-center rounded-full border border-[var(--lms-canvas-border)] text-2xl text-[var(--lms-primary)]">✓</span>
      <PageHeader title={"You now have access to "+invite.collegeName} />
      <p className="text-sm text-muted-foreground leading-[22px]">Sign in with your work email, {joinedEmail}. We&apos;ll email you a code each time.</p>
      <Link className={actionLink} href="/login">Sign in</Link>
    </div>);
  }
  if (state === "declined") {
    return shell(
      <div className="text-center">
        <PageHeader title="Thank you, we have told the placement cell" />
        <p className="mt-2 text-sm text-muted-foreground leading-[22px]">
          You will not be contacted about this again.
        </p>
      </div>,
    );
  }

  return shell(
    <>
      <PageHeader title={invite.collegeName+" would like you to hire from their students"} />
      {invite.reviewDrive?<p className="mt-3 text-sm font-semibold text-body">
        Please review {invite.reviewDrive} for the students at {invite.collegeName}.
      </p>:null}
      <p className="mt-3 text-sm text-muted-foreground leading-[22px]">

        {invite.companyName ? "You are joining as " + invite.companyName + ". " : ""}
        You can request placement drives and review the students who apply.
        Contact details are shared only as the placement cell allows.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
       Invitation expires {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",
        day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit",
        hour12:true}).format(new Date(invite.expiresAt))} IST.
      </p>

      <div className="mt-4 min-w-0 space-y-2 text-sm leading-6 text-body [overflow-wrap:anywhere]">
        <p><strong>Contact:</strong> {invite.contactName}</p>
        {invite.designation ? <p><strong>Designation:</strong> {invite.designation}</p> : null}
      </div>

      <div className="mt-5 space-y-3">
        <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Work email
          <Input id="invite-email" type="email" readOnly={Boolean(invite.contactEmail)}
            value={invite.contactEmail??requestedEmail} autoComplete="email" required
            onChange={event=>{if(!invite.contactEmail){setRequestedEmail(event.target.value);clearField("email");}}}
            aria-invalid={Boolean(errorFor("email"))} aria-describedby={errorFor("email")?"invite-email-error":undefined}
            className="mt-[6px] min-h-11 w-full md:min-h-9"/>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {invite.contactEmail?"From your invitation. You'll sign in with it.":
             "Enter your work email, then ask the placement cell to verify it on this invitation before requesting a code."}
          </span>
          {errorFor("email")?<span id="invite-email-error" role="alert" className="mt-1 block text-xs font-normal text-[var(--lms-error)]">{errorFor("email")}</span>:null}
        </label>
        <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Your name
         <Input id="invite-name" required maxLength={100} autoComplete="name" value={name}
           aria-invalid={Boolean(errorFor("name"))} aria-describedby={errorFor("name")?"invite-name-error":undefined}
           onChange={event=>{setName(event.target.value);clearField("name");}}
           className="mt-1 min-h-11 w-full md:min-h-9"/>
         {errorFor("name")?<span id="invite-name-error" role="alert" className="mt-1 block text-xs font-normal text-[var(--lms-error)]">{errorFor("name")}</span>:null}
        </label>
        <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Designation (optional)
         <Input maxLength={100} value={designation} onChange={event=>setDesignation(event.target.value)}
           className="mt-1 min-h-11 w-full md:min-h-9"/>
        </label>
        <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Mobile (optional)
         <Input id="invite-mobile" type="tel" autoComplete="tel" maxLength={14} value={mobile}
           aria-invalid={Boolean(errorFor("mobile"))} aria-describedby={errorFor("mobile")?"invite-mobile-error":undefined}
           onChange={event=>{setMobile(event.target.value);clearField("mobile");}}
           className="mt-1 min-h-11 w-full md:min-h-9"/>
         <span className="mt-1 block text-xs font-normal text-muted-foreground">Only for the placement cell to call you. You never sign in with it.</span>
         {errorFor("mobile")?<span id="invite-mobile-error" role="alert" className="mt-1 block text-xs font-normal text-[var(--lms-error)]">{errorFor("mobile")}</span>:null}
        </label>
        {!codeSent?(
          <Button type="button" className="min-h-11 w-full md:min-h-9" loading={busy} onClick={()=>void sendCode()}>
            {busy?"Sending…":"Send me a code"}
          </Button>
        ):(
          <>
            <label className="block font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
              Code sent to {codeSentTo || invite.contactEmail}
              <Input id="invite-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                pattern="[0-9]{6}" maxLength={6} value={code}
                aria-invalid={Boolean(errorFor("code"))} aria-describedby={errorFor("code")?"invite-code-error":undefined}
                onChange={event=>{setCode(event.target.value);clearField("code");}}
                className="mt-2 min-h-11 w-full md:min-h-9"/>
              {errorFor("code")?<span id="invite-code-error" role="alert" className="mt-1 block text-xs font-normal text-[var(--lms-error)]">{errorFor("code")}</span>:null}
            </label>
            <Button className="min-h-11 w-full md:min-h-9" type="button" loading={busy}
              onClick={()=>void acceptCode()}>{busy?"Joining…":"Join "+invite.collegeName+" placements"}</Button>
            <Button className="min-h-11 w-full justify-start text-link underline md:min-h-9" variant="link" type="button" disabled={busy} onClick={()=>void sendCode()}>Send a new code</Button>
          </>
        )}
        <p className="text-xs text-muted-foreground leading-[20px]">
          This proves the email is yours.
        </p>
      </div>

      {actionError ? <div ref={errorRef} tabIndex={-1} className="mt-4 outline-none">
       <InlineNotice tone="error" message={"⚠ "+actionError} />
      </div> : null}

      <div className="mt-5 space-y-2 border-t border-[var(--lms-canvas-border)] pt-4">
        <Button type="button" className="min-h-11 w-full justify-start text-link underline md:min-h-9" variant="link" disabled={busy} onClick={() => void answer("not-hiring")}>
          Not hiring from this college this season
        </Button>
        <Button type="button" className="min-h-11 w-full justify-start text-link underline md:min-h-9" variant="link" disabled={busy} onClick={() => void answer("unsubscribe")}>
          Stop contacting me
        </Button>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground leading-[20px]">
        Already have an account? <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary focus-visible:underline" href="/login">Sign in</Link>
      </p>
    </>,
  );
}
