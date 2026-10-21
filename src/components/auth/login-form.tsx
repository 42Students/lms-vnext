"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {FRIENDLY_MESSAGES} from "@/lib/friendly-error";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {safeReturnTo} from "@/lib/return-to";

type Channel = "PHONE" | "EMAIL";

type StartResult = {
  attemptId: string;
  channel: Channel;
  maskedContact: string;
  expiresInSeconds: number;
  emailFallbackAvailable: boolean;
  maskedEmail: string | null;
  requiresSecondFactor?: boolean;
  maskedPhone?: string | null;
};

const RESEND_SECONDS = 30;
const EMAIL_RESEND_SECONDS = 60;
const ATTEMPT_KEY = "42lms-login-attempt-v1";
type SavedAttempt = {
  attempt: StartResult;
  expiresAt: number;
  nextResendAt: number;
  /** Exact requesting host including development port. Never resume elsewhere. */
  host: string;
};
function saveLoginAttempt(value: Omit<SavedAttempt, "host"> | null) {
  try {
    if (value) {
      window.sessionStorage.setItem(
        ATTEMPT_KEY,
        JSON.stringify({ ...value, host: window.location.host.toLowerCase() }),
      );
    } else {
      window.sessionStorage.removeItem(ATTEMPT_KEY);
    }
  } catch { /* Private browsing can disable session storage. */ }
}
function loadLoginAttempt(): SavedAttempt | null {
  try {
    const raw = window.sessionStorage.getItem(ATTEMPT_KEY);
    if (!raw) return null;
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || !("attempt" in data) || !("expiresAt" in data) || !("nextResendAt" in data))
      return null;
    const record = data as SavedAttempt;
    if (typeof record.host !== "string" ||
        record.host !== window.location.host.toLowerCase() ||
        typeof record.expiresAt !== "number" || record.expiresAt <= Date.now() ||
        typeof record.nextResendAt !== "number" || !record.attempt ||
        !/^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(record.attempt.attemptId) ||
        !["PHONE","EMAIL"].includes(record.attempt.channel)) {
      saveLoginAttempt(null); return null;
    }
    return record;
  } catch { return null; }
}

const ERROR_MESSAGES: Record<string, string> = {
  INVALID_CONTACT: "Enter a valid phone number or email address.",
  NOT_REGISTERED: "Sign-in is not available for these details. Check your contact and try again.",
  NO_ACCOUNT_FOR_DOMAIN:
    "No account was found for this contact on this college's site.",
  ACCOUNT_DISABLED:
    "This account is disabled. Contact your administrator.",
  ACCOUNT_SUSPENDED:
    "This account is suspended. Contact your college administrator.",
  ACCOUNT_UNAVAILABLE:
    "This account can't sign in right now. Contact your college administrator.",
  USER_NOT_FOUND:
    "This account can't sign in right now. Contact your college administrator.",
  TOO_MANY_REQUESTS:
    "Too many codes were requested. Try again in about 10 minutes.",
  TOO_SOON: "A code was just sent. Wait a few seconds before asking for another.",
  OTP_DELIVERY_FAILED: "We couldn't send the text message just now. Try again, or get the code by email.",
  INCORRECT_OTP: "That code isn't right. Check it and try again.",
  OTP_EXPIRED: "This code has expired. Ask for a new one.",
  EMAIL_OTP_EXPIRED: "This code has expired. Ask for a new one.",
  INVALID_ATTEMPT: "This code has expired. Ask for a new one.",
  OTP_ATTEMPTS_EXCEEDED:
    "Too many wrong codes. Ask for a new one.",
  WRONG_TENANT: "This code was asked for on another college's address. Start again here.",
  UNKNOWN_TENANT_HOST: "This address is not set up for sign-in.",
  EMAIL_NOT_AVAILABLE: "This account has no email address on file.",
  SECOND_FACTOR_REQUIRED: "Enter both codes to continue.",
  SECOND_FACTOR_UNAVAILABLE:
    "This administrator account needs both a verified phone number and email address.",
  CHANNEL_DISABLED: "This college does not allow that sign-in method. Select an available method.",
  LOGIN_METHOD_DISABLED: "This college does not allow that sign-in method. Select an available method.",
  INVALID_EMAIL: "Sign-in is not available for these details. Check your contact and try again.",
  MOBILE_AUTH_TIMEOUT: "That took too long. Check your connection and try again.",
  EMAIL_NOT_FOUND: "No email is saved on this account. Use the code sent to your phone.",
  COMPANY_EMAIL_REQUIRED:
    "Use your work email. Personal email (Gmail, Yahoo, Outlook and similar) can't be used for recruiting.",
  RECRUITER_COLLEGE_ADDRESS:
    "Recruiters sign in at their college's placement address, for example klu.42lms.com. It's in your invitation email.",
  INVALID_CHOICE: "The list of accounts changed. Choose your account again.",
  AUTH_NOT_CONFIGURED:
    "Sign-in is temporarily unavailable. Please try again shortly.",
};

const RESTART_ERRORS = new Set([
  "OTP_EXPIRED",
  "EMAIL_OTP_EXPIRED",
  "INVALID_ATTEMPT",
  "OTP_ATTEMPTS_EXCEEDED",
  "ACCOUNT_SUSPENDED",
  "ACCOUNT_DISABLED",
  "ACCOUNT_UNAVAILABLE",
  "WRONG_TENANT",
  "INVALID_CHOICE",
]);

/**
 * GR-04/53: preserve OTP-specific error codes for the existing safe copy
 * table, while all response/transport parsing goes through apiFetch.
 */
async function post<T>(url: string, body: unknown): Promise<{
  ok: boolean; data: T & { error?: string; retryAfterSeconds?: number };
}> {
  try {
    const data = await apiFetch<T>(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      timeoutMs: 30_000,
    });
    return { ok: true, data: data as T & { error?: string } };
  } catch (reason) {
    if (reason instanceof FriendlyFetchError && reason.status > 0) {
      return { ok: false, data: {
        error: reason.code ?? undefined,
        retryAfterSeconds: reason.retryAfterSeconds ?? undefined,
      } as T & { error?: string; retryAfterSeconds?: number } };
    }
    throw reason;
  }
}

export function LoginForm({
  collegeName,
  defaultChannel = "EMAIL",
  allowedChannels = ["EMAIL", "PHONE"],
  legacySuperAdmin = false,
}: {
  collegeName?: string | null;
  defaultChannel?: Channel;
  allowedChannels?: readonly Channel[];
  legacySuperAdmin?: boolean;
}) {
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const [recruiterEntry, setRecruiterEntry] = useState(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setRecruiterEntry(query.get("recruiter") === "email");
    if (query.get("auth") === "handoff-retired") {
      // Legacy handoff target labels are unauthenticated local hints. Never
      // reuse them after retiring cross-host raw-token handoff.
      window.localStorage.removeItem("lms_handoff_target_label");
    }
  }, []);
  const errorSummaryRef=useRef<HTMLDivElement>(null);
  const contactRef=useRef<HTMLInputElement>(null);
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [acceptedTerms,setAcceptedTerms]=useState(false);
  const [secondCode, setSecondCode] = useState("");
  const [attempt, setAttempt] = useState<StartResult | null>(null);
  const [busy, setBusy] = useState(false);
  const { run: runGuarded } = useGuardedAction({ timeoutMs: 31_000 });
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);
  const [emailResends,setEmailResends]=useState(0);
  const codeRef=useRef<HTMLInputElement>(null);

  useEffect(()=>{if(error)errorSummaryRef.current?.focus();},[error]);
  useEffect(() => {
    let live = true;
    void Promise.resolve().then(() => {
      if (!live) return;
      const stored = loadLoginAttempt();
      if (!stored) return;
      setAttempt(stored.attempt);
      setChannel(stored.attempt.channel);
      setCooldown(Math.max(0, Math.ceil((stored.nextResendAt - Date.now()) / 1000)));
      setNotice("You have a code from an interrupted sign-in. Use the code already sent, or request another when the resend timer ends.");
    });
    return () => { live = false; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if(emailCooldown<=0)return;
    const timer=setTimeout(()=>setEmailCooldown(value=>Math.max(0,value-1)),1000);
    return ()=>clearTimeout(timer);
  },[emailCooldown]);

  function fail(errorCode: string | undefined, retryAfterSeconds?: number) {
    const safeRetry = typeof retryAfterSeconds === "number" &&
      Number.isInteger(retryAfterSeconds) && retryAfterSeconds >= 1 &&
      retryAfterSeconds <= 3600 ? retryAfterSeconds : null;
    const known = (errorCode==="NOT_REGISTERED"||errorCode==="INVALID_EMAIL")
      ?"Sign-in is not available for these details. Check your contact and try again.":errorCode==="OTP_DELIVERY_FAILED"&&channel==="EMAIL"
      ?"We couldn't send the email just now. Try again.":errorCode==="NO_ACCOUNT_FOR_DOMAIN"
      ?"These details cannot sign in at this college. Check the address or use the main sign-in page (42lms.com).":
       (errorCode==="CHANNEL_DISABLED"||errorCode==="LOGIN_METHOD_DISABLED")
      ?(channel==="EMAIL"?"This college signs in with a mobile number. Use your phone number instead.":
        "This college signs in with email. Use your email instead."):
       errorCode?ERROR_MESSAGES[errorCode]:undefined;
    setError(legacySuperAdmin&&errorCode==="INCORRECT_OTP"?"OTP InValid!":errorCode==="TOO_MANY_REQUESTS" && safeRetry !== null
      ? "Too many codes were requested. Try again in about "+
        (safeRetry < 120 ? safeRetry+" seconds." : Math.ceil(safeRetry/60)+" minutes.")
      : known ?? "Something went wrong. Try again in a moment.");
    if(safeRetry !== null)setCooldown(Math.max(cooldown,safeRetry));
    setErrorCode(errorCode ?? null);
    if (errorCode && RESTART_ERRORS.has(errorCode)) {
      // A verification lockout must never clear a server-provided retry window.
      setCooldown(safeRetry ?? 0);
      setCode("");
      setSecondCode("");
      setAttempt(null);
      saveLoginAttempt(null);
    }
  }

  async function start(event?: React.FormEvent) {
    event?.preventDefault();
    if (busy) return;
    if(attempt&&!contact.trim()){reset();setNotice("Enter your contact again to request a new code.");return;}
    if(!allowedChannels.includes(channel))return;
    const input = contact.trim();
    const phone = input.replace(/[\s()-]/g, "");
    const validation = channel === "PHONE"
      ? !input ? "Enter your mobile number"
        : !(/^[0-9]{10}$/.test(phone) || /^91[0-9]{10}$/.test(phone) || /^\+[1-9][0-9]{7,14}$/.test(phone))
          ? "Enter a valid 10-digit mobile number" : null
      : !input ? "Enter your email"
        : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)
          ? "Enter a valid email address" : null;
    if (validation) {
      setContactError(validation);
      contactRef.current?.focus();
      return;
    }
    setContactError(null);
    setBusy(true);
    setError(null);
    setErrorCode(null);
    setNotice(null);
    const slowNotice = window.setTimeout(() =>
      setNotice("Your code is on its way. You can request another code when the timer ends."), 3_000);
    try {
      const result = await runGuarded(() => post<StartResult>("/api/auth/login/start", {
        channel,
        contact: contact.trim(),
      }));
      if (!result) return;
      if (!result.ok) { setNotice(null); return fail(result.data.error,result.data.retryAfterSeconds); }
      setErrorCode(null);
      setNotice(channel === "PHONE" ? "Your code is on its way." :
        "We sent a code to " + result.data.maskedContact + ". It expires in 5 minutes.");
      setAttempt(result.data);
      setAcceptedTerms(false);
      saveLoginAttempt({
        attempt: result.data,
        expiresAt: Date.now() + Math.min(300, Math.max(1,result.data.expiresInSeconds)) * 1000,
        nextResendAt: Date.now() + RESEND_SECONDS * 1000,
      });
      setCode("");
      setSecondCode("");
      setEmailResends(0);
      setCooldown(RESEND_SECONDS);
    } catch {
      setError("That took too long. Check your connection and try again.");
    } finally {
      window.clearTimeout(slowNotice);
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !attempt || (legacySuperAdmin&&!acceptedTerms)) return;
    if(!code.trim()){
      setError("OTP is required");codeRef.current?.focus();return;
    }
    if (!/^[0-9]{4,6}$/.test(code.trim()) ||
        (attempt.requiresSecondFactor && !/^[0-9]{4,6}$/.test(secondCode.trim()))) {
      setError("The code is 4 to 6 digits");codeRef.current?.focus();return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await runGuarded(() => post<{ next?: string }>(
        "/api/auth/login/verify",
        {
          attemptId: attempt.attemptId,
          code: code.trim(),
          ...(attempt.requiresSecondFactor
            ? { secondCode: secondCode.trim() }
            : {}),
        },
      ));
      if (!result) return;
      if (!result.ok) return fail(result.data.error,result.data.retryAfterSeconds);
      saveLoginAttempt(null);
      const returnTo = safeReturnTo(new URLSearchParams(window.location.search).get("returnTo"));
      const defaultLanding = safeReturnTo(result.data.next) ?? "/dashboard";
      window.location.assign(returnTo ?? defaultLanding);
    } catch (reason) {
      setError(reason instanceof FriendlyFetchError ? reason.message : FRIENDLY_MESSAGES.unexpected);
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailCode() {
    if (busy || !attempt||emailResends>=5) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await runGuarded(() => post<{ maskedEmail?: string }>(
        "/api/auth/login/email",
        { attemptId: attempt.attemptId },
      ));
      if (!result) return;
      if (!result.ok) return fail(result.data.error,result.data.retryAfterSeconds);
      setNotice(`We emailed a code to ${result.data.maskedEmail ?? "you"}. It expires in 5 minutes.`);
      setEmailCooldown(EMAIL_RESEND_SECONDS);
      setEmailResends(count=>Math.min(5,count+1));
      setCooldown(RESEND_SECONDS);
      if (attempt) saveLoginAttempt({
        attempt,
        expiresAt: Date.now() + Math.min(300, Math.max(1,attempt.expiresInSeconds)) * 1000,
        nextResendAt: Date.now() + RESEND_SECONDS * 1000,
      });
    } catch (reason) {
      setError(reason instanceof FriendlyFetchError ? reason.message : FRIENDLY_MESSAGES.unexpected);
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setAcceptedTerms(false);
    saveLoginAttempt(null);
    setAttempt(null);
    setCode("");
    setSecondCode("");
    setError(null);
    setErrorCode(null);
    setNotice(null);
  }

  return (
    <div className="login-form w-full max-w-md" data-legacy-superadmin={legacySuperAdmin||undefined} data-step={attempt ? "code" : "contact"} aria-label={collegeName?"Sign in to "+collegeName:"Sign in to 42LMS"}>
      <h1 className="m-0 text-[30px] font-semibold leading-10 tracking-tight text-[var(--lms-heading)]">
        {legacySuperAdmin?(attempt?"OTP sent to your Mobile Number":"Mobile Number"):(attempt?"Enter your code":"Sign in")}
      </h1>
      <p className="mt-1 text-sm text-muted-foreground leading-[22px]">
        {legacySuperAdmin?(attempt?"Use the code sent to your registered mobile number.":"Enter your registered mobile number to receive an OTP."):
         attempt ? "We sent a code to "+attempt.maskedContact+".":
          channel==="PHONE"?"Use your registered mobile number.":
          recruiterEntry ? "Recruiter? Sign in with email." : "Use your registered email address."}
      </p>

      {error ? (
        <div
          role="alert" ref={errorSummaryRef} tabIndex={-1}
          className="mt-4 rounded-[var(--lms-control-radius)] border border-error bg-[var(--lms-error-subtle)] p-3 text-sm text-error focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]"
        >
          {error}
        </div>
      ) : null}
      {collegeName && (errorCode === "NO_ACCOUNT_FOR_DOMAIN" || errorCode === "WRONG_TENANT") ? (
        <p className="mt-2 text-sm text-body leading-[22px]">
          {recruiterEntry
            ? "Recruiters must use the college placement address listed in their invitation email. "
            : "This account may belong to another college. "}
          <a href="https://42lms.com/login" className="font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
            Use the main sign-in page (42lms.com)
          </a>
        </p>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="mt-4 rounded-[var(--lms-control-radius)] border border-border bg-primary-subtle p-3 text-sm text-body"
        >
          {legacySuperAdmin&&attempt?"OTP Sent!":notice}
        </div>
      ) : null}

      {legacySuperAdmin&&busy?<div role="status" aria-live="polite" className="flex min-h-52 items-center justify-center gap-3 text-sm font-medium text-body">
        <span aria-hidden="true" className="size-6 animate-spin rounded-full border-2 border-border border-t-primary"/>
        {attempt?"Verifying your code…":"Sending OTP…"}
       </div>:!attempt ? (
        <form onSubmit={start} className="mt-5 space-y-4" noValidate>
          {allowedChannels.length>1?<div
            role="tablist"
            aria-label="Sign in method"
            className="relative grid grid-cols-2 gap-1 rounded-[var(--lms-control-radius)] bg-muted p-1"
          >
            <span aria-hidden="true" className={"pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-lg bg-surface shadow-sm transition-transform duration-150 " +
              (channel === "PHONE" ? "translate-x-[calc(100%+4px)]" : "")}/>
            {(["EMAIL", "PHONE"] as const).filter(value=>allowedChannels.includes(value)).map((value) => (
              <Button variant="ghost"
                key={value}
                type="button"
                role="tab"
                id={`login-tab-${value.toLowerCase()}`}
                data-channel={value}
                aria-controls="login-method-panel"
                aria-selected={channel === value}
                tabIndex={channel === value ? 0 : -1}
                onClick={() => {
                  setChannel(value);
                  setContact("");
                  setContactError(null);
                  setError(null);
                  setErrorCode(null);
                }}
                onKeyDown={(event) => {
                  const keys = ["ArrowLeft", "ArrowRight", "Home", "End"];
                  if (!keys.includes(event.key)) return;
                  event.preventDefault();
                  const channels = (["EMAIL", "PHONE"] as const).filter(method => allowedChannels.includes(method));
                  const currentIndex = channels.indexOf(value);
                  const next = event.key === "Home" ? channels[0] :
                    event.key === "End" ? channels[channels.length - 1] :
                    channels[(currentIndex + (event.key === "ArrowLeft" ? channels.length - 1 : 1)) % channels.length];
                  setChannel(next);
                  setContact("");
                  setContactError(null);
                  setError(null);
                  setErrorCode(null);
                  event.currentTarget.parentElement
                    ?.querySelector<HTMLButtonElement>(`[data-channel="${next}"]`)?.focus();
                }}
                className={
                  channel === value
                    ? "relative z-10 min-h-11 rounded-[var(--lms-control-radius)] !bg-transparent text-sm font-semibold text-primary-text shadow-none md:min-h-9 "
                    : "relative z-10 min-h-11 rounded-[var(--lms-control-radius)] !bg-transparent text-sm font-medium text-body hover:text-primary-text md:min-h-9 "
                }
              >
                {value === "PHONE" ? "Phone" : "Email"}
              </Button>
            ))}
          </div>:null}

          <div id="login-method-panel"
            role={allowedChannels.length>1?"tabpanel":undefined}
            aria-labelledby={allowedChannels.length>1?`login-tab-${channel.toLowerCase()}`:undefined}>
          <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {channel === "PHONE" ? (legacySuperAdmin?"Mobile Number":"Mobile number") : "Email"}
            </span>
            <div className="relative">
              {channel === "PHONE" ? <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-3 z-10 inline-flex items-center border-r border-border pr-3 text-sm font-semibold text-foreground">+91</span> : null}
            <Input className={channel === "PHONE" ? "pl-[58px]" : undefined}
              name="contact" ref={contactRef}
              aria-invalid={Boolean(contactError)}
              aria-describedby={contactError ? "login-contact-error" : undefined}
              value={contact}
              onChange={(event) => { setContact(legacySuperAdmin&&channel==="PHONE"?event.target.value.replace(/\D/g,"").slice(0,10):event.target.value); setContactError(null); }}
              type={channel === "PHONE" ? "tel" : "email"}
              inputMode={channel === "PHONE" ? "numeric" : "email"}
              maxLength={legacySuperAdmin&&channel==="PHONE"?10:undefined}
              onWheel={legacySuperAdmin?event=>event.currentTarget.blur():undefined}
              autoComplete={channel === "PHONE" ? "tel" : "email"}
              placeholder={
                channel === "PHONE" ? "Enter mobile number" : "you@example.com"
              }
              required
              autoFocus
            />
            </div>
            {contactError ? (
              <span role="alert" id="login-contact-error" className="mt-1 block text-sm text-error">{contactError}</span>
            ) : null}
          </label>
          </div>

          <Button
            type="submit"
            className="min-h-11 w-full md:min-h-9"
            disabled={busy}
          >
            {busy ? "Sending code…" : legacySuperAdmin?"Send OTP":"Send code"}
          </Button>
          <LoginConsent />
        </form>
      ) : (
        <form onSubmit={verify} className="mt-5 space-y-4" noValidate>
          {attempt.requiresSecondFactor ? (
            <p className="m-0 text-sm text-body leading-[22px]">
              Administrator sign-in needs two codes. We texted one to{" "}
              <strong className="text-foreground">
                {attempt.maskedPhone}
              </strong>{" "}
              and emailed one to{" "}
              <strong className="text-foreground">
                {attempt.maskedEmail}
              </strong>
              . They expire in{" "}
              {Math.round(attempt.expiresInSeconds / 60)} minutes.
            </p>
          ) : (
            <p className="m-0 text-sm text-body leading-[22px]">
              We sent a one-time code to{" "}
              <strong className="text-foreground">
                {attempt.maskedContact}
              </strong>
              . It expires in {Math.round(attempt.expiresInSeconds / 60)}{" "}
              minutes.
            </p>
          )}

          <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {attempt.requiresSecondFactor
                ? "Code from the text message"
                : legacySuperAdmin?"OTP sent to your Mobile Number":"One-time code"}
            </span>
            <Input
              name="code"
              ref={codeRef}
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter OTP"
              maxLength={6}
              className="text-center text-lg tracking-[0.4em]"
              required
              autoFocus
            />
          </label>

          {attempt.requiresSecondFactor ? (
            <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              <span className="mb-1 block text-sm font-medium text-foreground">
                Code from the email
              </span>
              <Input
                name="secondCode"
                value={secondCode}
                onChange={(event) =>
                  setSecondCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                inputMode="numeric"
                autoComplete="off"
                placeholder="123456"
                maxLength={6}
                className="text-center text-lg tracking-[0.4em]"
                required
              />
            </label>
          ) : null}

          <p className="text-xs text-muted-foreground">The code is 4 to 6 digits. Codes expire after five minutes. You have up to five verification attempts; email resend limit is five.</p>
          {legacySuperAdmin?<label className="flex min-h-11 items-center gap-2 text-sm text-body">
           <Checkbox checked={acceptedTerms} onChange={event=>setAcceptedTerms(event.target.checked)}/>
           <span>By clicking here, I agree to 42 LMS&apos; <a href="/assets/static/terms-and-conditions-view.html" target="_blank" rel="noopener noreferrer" className="text-primary-text underline">Terms &amp; Conditions</a>.</span>
          </label>:null}
          <Button
            type="submit"
            className="min-h-11 w-full md:min-h-9"
            disabled={
              busy ||
              (legacySuperAdmin&&!acceptedTerms) ||
              Boolean(errorCode && RESTART_ERRORS.has(errorCode)) ||
              code.length < 4 ||
              (attempt.requiresSecondFactor === true && secondCode.length < 4)
            }
          >
            {busy ? "Verifying…" : legacySuperAdmin?"Login":"Verify and sign in"}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <Button variant="ghost"
              type="button"
              onClick={() => void start()}
              disabled={busy || cooldown > 0}
              className="inline-flex min-h-11 items-center font-medium text-primary-text underline-offset-2 hover:underline disabled:text-muted-foreground disabled:no-underline md:min-h-9"
            >
              {cooldown > 0 ? "Resend code in "+Math.floor(cooldown/60)+":"+
                String(cooldown%60).padStart(2,"0") : "Resend code"}
            </Button>
            {attempt.emailFallbackAvailable && !attempt.requiresSecondFactor ? (
              <Button variant="ghost"
                type="button"
                onClick={() => void sendEmailCode()}
                disabled={busy || emailCooldown > 0 || emailResends>=5}
                className="inline-flex min-h-11 items-center font-medium text-primary-text underline-offset-2 hover:underline disabled:text-muted-foreground disabled:no-underline md:min-h-9"
              >
                {emailResends>=5?"Email resend limit reached":emailCooldown>0?`Email another code in ${emailCooldown}s`:"Email me instead"}
              </Button>
            ) : null}
          </div>

          <Button variant="ghost"
            type="button"
            onClick={reset}
            className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground md:min-h-9"
          >
            Change
          </Button>
          {!legacySuperAdmin?<LoginConsent />:null}
        </form>
      )}
    </div>
  );
}

function LoginConsent() {
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      By continuing, you agree to the{" "}
      <a href="/assets/static/terms-and-conditions-view.html"
        className="text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]" target="_blank" rel="noopener noreferrer">Terms of Use</a>
      {" "}and{" "}
      <a href="/privacy-policy" className="text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Privacy Policy</a>.
    </p>
  );
}
