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
};
type State = "loading" | "ready" | "invalid" | "load_error" | "declined" | "joined";

const actionLink="lms-inline-link inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-primary bg-primary px-4 py-2 text-sm font-semibold text-on-primary hover:bg-primary-hover md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function RecruiterInviteLanding({ token }: { token: string }) {
  const [state, setState] = useState<State>("loading");
  const [retrySequence,setRetrySequence] = useState(0);
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef=useRef(false);
  const errorRef=useRef<HTMLDivElement>(null);
  const [actionError, setActionError] = useState("");
  useEffect(()=>{if(actionError)errorRef.current?.focus();},[actionError]);
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
      const outcome=recruiterInvitePreviewDisposition(data.invite?200:404,Boolean(data.invite));
      if(outcome!=="ready"){setState(outcome);return;}
      setInvite(data.invite??null);
      setName(data.invite?.contactName??"");
      setDesignation(data.invite?.designation??"");
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
      if(error instanceof FriendlyFetchError && error.status===404)setState("invalid");
      else setActionError(error instanceof Error?error.message:"That did not work. Please try again.");
    } finally {
      busyRef.current=false;
      setBusy(false);
    }
  }

  async function acceptCode(){
    if(busyRef.current)return;
    if(!name.trim()){setActionError("Enter your name");return;}
    if(!code.trim()){setActionError("Enter the 6-digit code");return;}
    if(!/^[0-9]{6}$/.test(code)){setActionError("The code has 6 digits");return;}
    const digits=mobile.replace(/\D/g,"");
    if(digits && digits.length!==10 && !(digits.length===12&&digits.startsWith("91"))){
      setActionError("Enter a valid 10-digit mobile number, or leave it blank.");return;
    }
    busyRef.current=true;
    setBusy(true);setActionError("");
    try{
      await apiFetch<void>("/api/public/recruiter-invite/"+encodeURIComponent(token)+"/accept",{
        method:"POST",credentials:"same-origin",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({code,name,designation,mobile}),
      });
      setState("joined");
    }catch(error){
      if(error instanceof FriendlyFetchError && error.status===404)setState("invalid");
      else setActionError(error instanceof FriendlyFetchError && error.status===400
        ?"That code did not work. Check the latest email or send a new code."
        :error instanceof Error?error.message:"Couldn't join. Please try again.");
    }
    finally{busyRef.current=false;setBusy(false);}
  }
  async function sendCode(){
    if(busyRef.current)return;
    busyRef.current=true;
    setBusy(true);setActionError("");
    try{
      await apiFetch<void>("/api/public/recruiter-invite/"+encodeURIComponent(token)+"/send-code",{
        method:"POST",credentials:"same-origin",
      });
      setCodeSent(true);
      setCode("");
    }catch(error){
      if(error instanceof FriendlyFetchError && error.status===404)setState("invalid");
      else setActionError(error instanceof Error?error.message:"We couldn't send the code. Please try again.");
    }finally{busyRef.current=false;setBusy(false);}
  }

  const shell = (children: React.ReactNode) => (
    <main className={`${authStyles.page} flex min-h-dvh min-w-0 items-center justify-center px-4 py-8 md:py-12`}>
      <Card as="section" className="w-full max-w-md">
        {children}
      </Card>
    </main>
  );

  if (state === "loading") {
    return shell(
      <Skeleton variant="form" count={3} label="Loading invitation…" />,
    );
  }

  if(state === "load_error") {
    return shell(<div className="space-y-4 text-center">
      <PageHeader title={RECRUITER_INVITE_LOAD_ERROR_HEADING} />
      <p className="text-sm text-muted-foreground">Check your connection and try again. Your invitation has not been consumed.</p>
      <Button type="button" className="min-h-11 w-full md:min-h-9" onClick={()=>{
        setState("loading");setRetrySequence(i=>i+1);
      }}>Retry</Button>
    </div>);
  }

  if (state === "invalid" || !invite) {
    return shell(
      <div className="text-center">
        <PageHeader title="This link is no longer valid" />
        <p className="mt-2 text-sm text-muted-foreground">
          It may have expired or already been used. Ask the placement cell to send you a new one.
        </p>
      </div>,
    );
  }

  if(state==="joined"){
    return shell(<div className="text-center space-y-3">
      <PageHeader title={"You now have access to "+invite.collegeName} />
      <p className="text-sm text-muted-foreground">Sign in with your work email, {invite.contactEmail}. We&apos;ll email you a code each time.</p>
      <Link className={actionLink} href="/login">Sign in</Link>
    </div>);
  }
  if (state === "declined") {
    return shell(
      <div className="text-center">
        <PageHeader title="Thank you, we have told the placement cell" />
        <p className="mt-2 text-sm text-muted-foreground">
          You will not be contacted about this again.
        </p>
      </div>,
    );
  }

  return shell(
    <>
      <PageHeader title={invite.collegeName+" would like you to hire from their students"} />
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {invite.companyName ? "You are joining as " + invite.companyName + ". " : ""}
        You can request placement drives and review the students who apply.
        Contact details are shared only as the placement cell allows.
      </p>

      <div className="mt-5 rounded-[var(--lms-control-radius)] border border-border bg-surface-secondary p-4 text-sm text-body">
        <p><strong>Contact:</strong> {invite.contactName}</p>
        {invite.designation ? <p><strong>Designation:</strong> {invite.designation}</p> : null}
      </div>

      <div className="mt-5 space-y-3">
        <label className="block text-sm font-semibold text-foreground">
          Work email
          <Input type="email" readOnly value={invite.contactEmail??""} autoComplete="email"
            className="mt-1 min-h-11 w-full md:min-h-9"/>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {"From your invitation. You'll sign in with it."}
          </span>
        </label>
        <label className="block text-sm font-semibold text-foreground">Your name
         <Input required maxLength={150} autoComplete="name" value={name}
           onChange={event=>setName(event.target.value)}
           className="mt-1 min-h-11 w-full md:min-h-9"/>
        </label>
        <label className="block text-sm font-semibold text-foreground">Designation (optional)
         <Input maxLength={100} value={designation} onChange={event=>setDesignation(event.target.value)}
           className="mt-1 min-h-11 w-full md:min-h-9"/>
        </label>
        <label className="block text-sm font-semibold text-foreground">Mobile (optional)
         <Input type="tel" autoComplete="tel" maxLength={30} value={mobile}
           onChange={event=>setMobile(event.target.value)}
           className="mt-1 min-h-11 w-full md:min-h-9"/>
         <span className="mt-1 block text-xs font-normal text-muted-foreground">Only for the placement cell to call you. You never sign in with it.</span>
        </label>
        {!codeSent?(
          <Button type="button" className="min-h-11 w-full md:min-h-9" loading={busy} onClick={()=>void sendCode()}>
            {busy?"Sending…":"Send me a code"}
          </Button>
        ):(
          <>
            <label className="block text-sm font-semibold text-foreground">
              Code sent to {invite.contactEmail}
              <Input type="text" inputMode="numeric" autoComplete="one-time-code"
                pattern="[0-9]{6}" maxLength={6} value={code} onChange={event=>setCode(event.target.value)}
                className="mt-2 min-h-11 w-full md:min-h-9"/>
            </label>
            <Button className="min-h-11 w-full md:min-h-9" type="button" loading={busy}
              onClick={()=>void acceptCode()}>{busy?"Joining…":"Join "+invite.collegeName+" placements"}</Button>
            <Button className="min-h-11 w-full md:min-h-9" variant="secondary" type="button" disabled={busy} onClick={()=>void sendCode()}>Send a new code</Button>
          </>
        )}
        <p className="text-xs text-muted-foreground">
          This proves the email is yours.
        </p>
      </div>

      {actionError ? <div ref={errorRef} tabIndex={-1} className="mt-4 outline-none"><InlineNotice tone="error" message={actionError} /></div> : null}

      <div className="mt-5 space-y-2">
        <Button type="button" className="min-h-11 w-full md:min-h-9" variant="secondary" disabled={busy} onClick={() => void answer("not-hiring")}>
          Not hiring from this college this season
        </Button>
        <Button type="button" className="min-h-11 w-full md:min-h-9" variant="secondary" disabled={busy} onClick={() => void answer("unsubscribe")}>
          Stop contacting me
        </Button>
      </div>

      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already have an account? <Link className="lms-inline-link inline-flex min-h-11 items-center text-link underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary" href="/login">Sign in</Link>
      </p>
    </>,
  );
}
