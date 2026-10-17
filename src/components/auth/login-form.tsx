"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
type SavedAttempt = { attempt: StartResult; expiresAt: number; nextResendAt: number };
function saveLoginAttempt(value: SavedAttempt | null) {
  try {
    if (value) window.sessionStorage.setItem(ATTEMPT_KEY, JSON.stringify(value));
    else window.sessionStorage.removeItem(ATTEMPT_KEY);
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
    if (typeof record.expiresAt !== "number" || record.expiresAt <= Date.now() ||
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
  NOT_REGISTERED:
    "This number isn't registered. Check it, or sign in with your email.",
  NO_ACCOUNT_FOR_DOMAIN:
    "No account was found for this contact on this college's site.",
  ACCOUNT_DISABLED:
    "This account is disabled. Contact your administrator.",
  ACCOUNT_SUSPENDED:
    "This account is suspended. Contact your college administrator.",
  TOO_MANY_REQUESTS:
    "Too many codes were requested. Try again in about 10 minutes.",
  TOO_SOON: "A code was just sent. Wait a few seconds before asking for another.",
  OTP_DELIVERY_FAILED: "We couldn't send the text message just now. Try again, or get the code by email.",
  INCORRECT_OTP: "That code isn't right. Check it and try again.",
  OTP_EXPIRED: "This code can't be used any more. Ask for a new one to continue.",
  INVALID_ATTEMPT: "This code can't be used any more. Ask for a new one to continue.",
  OTP_ATTEMPTS_EXCEEDED:
    "Too many wrong codes. Ask for a new one.",
  WRONG_TENANT: "This code was asked for on another college's address. Start again here.",
  UNKNOWN_TENANT_HOST: "This address is not set up for sign-in.",
  EMAIL_NOT_AVAILABLE: "This account has no email address on file.",
  SECOND_FACTOR_REQUIRED: "Enter both codes to continue.",
  SECOND_FACTOR_UNAVAILABLE:
    "This administrator account needs both a verified phone number and email address.",
  CHANNEL_DISABLED: "This college does not allow that sign-in method. Select an available method.",
  AUTH_NOT_CONFIGURED:
    "Sign-in is temporarily unavailable. Please try again shortly.",
};

const RESTART_ERRORS = new Set([
  "OTP_EXPIRED",
  "INVALID_ATTEMPT",
  "OTP_ATTEMPTS_EXCEEDED",
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
}: {
  collegeName?: string | null;
  defaultChannel?: Channel;
  allowedChannels?: readonly Channel[];
}) {
  const [channel, setChannel] = useState<Channel>(defaultChannel);
  const errorSummaryRef=useRef<HTMLDivElement>(null);
  const contactRef=useRef<HTMLInputElement>(null);
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [secondCode, setSecondCode] = useState("");
  const [attempt, setAttempt] = useState<StartResult | null>(null);
  const [busy, setBusy] = useState(false);
  const { run: runGuarded } = useGuardedAction({ timeoutMs: 31_000 });
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);

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
      setNotice("Your verification is still in progress. Use the code already sent or request another when available.");
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
    const known = errorCode==="NOT_REGISTERED" && channel==="EMAIL"
      ?"We couldn't find an account with that email.":errorCode==="OTP_DELIVERY_FAILED"&&channel==="EMAIL"
      ?"We couldn't send the email just now. Try again.":errorCode==="NO_ACCOUNT_FOR_DOMAIN"
      ?(channel==="EMAIL"?"This email isn't registered at this college.":"This number isn't registered at this college.")+
       " If you belong to another college, use the main sign-in page (42lms.com).":
       errorCode==="CHANNEL_DISABLED"
      ?(channel==="EMAIL"?"This college signs in with a mobile number. Use your phone number instead.":
        "This college signs in with email. Use your email instead."):
       errorCode?ERROR_MESSAGES[errorCode]:undefined;
    setError(errorCode==="TOO_MANY_REQUESTS" && safeRetry !== null
      ? "Too many codes were requested. Try again in about "+
        (safeRetry < 120 ? safeRetry+" seconds." : Math.ceil(safeRetry/60)+" minutes.")
      : known ?? "Something went wrong. Try again in a moment.");
    if(safeRetry !== null)setCooldown(Math.max(cooldown,safeRetry));
    setErrorCode(errorCode ?? null);
    if (errorCode && RESTART_ERRORS.has(errorCode)) {
      setCooldown(0);
      setCode("");
      setSecondCode("");
      saveLoginAttempt(null);
    } else if(errorCode==="WRONG_TENANT"){
      setAttempt(null);
      saveLoginAttempt(null);
      setCode("");
      setSecondCode("");
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
      setNotice(channel === "PHONE" ? "Your code is on its way." : "Your email code is on its way.");
      setAttempt(result.data);
      saveLoginAttempt({
        attempt: result.data,
        expiresAt: Date.now() + Math.min(300, Math.max(1,result.data.expiresInSeconds)) * 1000,
        nextResendAt: Date.now() + RESEND_SECONDS * 1000,
      });
      setCode("");
      setSecondCode("");
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
    if (busy || !attempt) return;
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
    if (busy || !attempt) return;
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
    saveLoginAttempt(null);
    setAttempt(null);
    setCode("");
    setSecondCode("");
    setError(null);
    setErrorCode(null);
    setNotice(null);
  }

  return (
    <div className="w-full max-w-md" aria-label={collegeName?"Sign in to "+collegeName:"Sign in to 42LMS"}>
      <h2 className="m-0 text-2xl font-semibold text-foreground">
        {attempt?"Enter your code":"Sign in"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {attempt ? "We sent a code to "+attempt.maskedContact+".":
          channel==="PHONE"?"Use your registered mobile number.":
          "Use your registered email address."}
      </p>

      {error ? (
        <div
          role="alert" ref={errorSummaryRef} tabIndex={-1}
          className="mt-4 rounded-lg border border-error bg-[var(--lms-error-subtle)] p-3 text-sm text-error"
        >
          {error}
        </div>
      ) : null}
      {collegeName && (errorCode === "NO_ACCOUNT_FOR_DOMAIN" || errorCode === "WRONG_TENANT") ? (
        <p className="mt-2 text-sm text-body">
          This account may belong to another college.{" "}
          <a href="https://42lms.com/login" className="font-semibold text-primary-text underline">
            Use the main sign-in page (42lms.com)
          </a>
        </p>
      ) : null}
      {notice ? (
        <div
          role="status"
          className="mt-4 rounded-lg border border-border bg-primary-subtle p-3 text-sm text-body"
        >
          {notice}
        </div>
      ) : null}

      {!attempt ? (
        <form onSubmit={start} className="mt-5 space-y-4" noValidate>
          {allowedChannels.length>1?<div
            role="tablist"
            aria-label="Sign in method"
            className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1"
          >
            {(["PHONE", "EMAIL"] as const).filter(value=>allowedChannels.includes(value)).map((value) => (
              <button
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
                    ? "min-h-9 rounded-md bg-surface text-sm font-semibold text-primary-text shadow-sm"
                    : "min-h-9 rounded-md text-sm font-medium text-body hover:text-primary-text"
                }
              >
                {value === "PHONE" ? "Phone" : "Email"}
              </button>
            ))}
          </div>:null}

          <div id="login-method-panel"
            role={allowedChannels.length>1?"tabpanel":undefined}
            aria-labelledby={allowedChannels.length>1?`login-tab-${channel.toLowerCase()}`:undefined}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {channel === "PHONE" ? "Mobile number" : "Email"}
            </span>
            <Input
              name="contact" ref={contactRef}
              aria-invalid={Boolean(contactError)}
              aria-describedby={contactError ? "login-contact-error" : undefined}
              value={contact}
              onChange={(event) => { setContact(event.target.value); setContactError(null); }}
              type={channel === "PHONE" ? "tel" : "email"}
              inputMode={channel === "PHONE" ? "tel" : "email"}
              autoComplete={channel === "PHONE" ? "tel" : "email"}
              placeholder={
                channel === "PHONE" ? "98765 43210" : "you@example.com"
              }
              required
              autoFocus
            />
            {contactError ? (
              <span role="alert" id="login-contact-error" className="mt-1 block text-sm text-error">{contactError}</span>
            ) : null}
          </label>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={busy}
          >
            {busy ? "Sending code…" : "Continue"}
          </Button>
          <LoginConsent />
        </form>
      ) : (
        <form onSubmit={verify} className="mt-5 space-y-4" noValidate>
          {attempt.requiresSecondFactor ? (
            <p className="m-0 text-sm text-body">
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
            <p className="m-0 text-sm text-body">
              We sent a 6-digit code to{" "}
              <strong className="text-foreground">
                {attempt.maskedContact}
              </strong>
              . It expires in {Math.round(attempt.expiresInSeconds / 60)}{" "}
              minutes.
            </p>
          )}

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {attempt.requiresSecondFactor
                ? "Code from the text message"
                : "One-time code"}
            </span>
            <Input
              name="code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="Enter the code"
              maxLength={6}
              className="text-center text-lg tracking-[0.4em]"
              required
              autoFocus
            />
          </label>

          {attempt.requiresSecondFactor ? (
            <label className="block">
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

          <Button
            type="submit"
            className="w-full"
            disabled={
              busy ||
              Boolean(errorCode && RESTART_ERRORS.has(errorCode)) ||
              code.length < 6 ||
              (attempt.requiresSecondFactor === true && secondCode.length < 6)
            }
          >
            {busy ? "Verifying…" : "Verify and sign in"}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => void start()}
              disabled={busy || cooldown > 0}
              className="font-medium text-primary-text underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? "Resend code in "+Math.floor(cooldown/60)+":"+
                String(cooldown%60).padStart(2,"0") : "Resend code"}
            </button>
            {attempt.emailFallbackAvailable && !attempt.requiresSecondFactor ? (
              <button
                type="button"
                onClick={() => void sendEmailCode()}
                disabled={busy || emailCooldown > 0}
                className="font-medium text-primary-text underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                {emailCooldown>0?`Email another code in ${emailCooldown}s`:"Get the code by email"}
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={reset}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Change
          </button>
          <LoginConsent />
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
        className="text-primary-text underline" target="_blank" rel="noopener noreferrer">Terms of Use</a>
      {" "}and{" "}
      <a href="/privacy-policy" className="text-primary-text underline">Privacy Policy</a>.
    </p>
  );
}
