"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
    "No account was found for this contact. Check it, or ask your college administrator.",
  NO_ACCOUNT_FOR_DOMAIN:
    "No account was found for this contact on this college's site.",
  ACCOUNT_DISABLED:
    "This account is disabled. Contact your administrator.",
  ACCOUNT_SUSPENDED:
    "This account is suspended. Contact your college administrator.",
  TOO_MANY_REQUESTS:
    "Too many attempts. Please wait a few minutes and try again.",
  TOO_SOON: "A code was just sent. Wait a few seconds before asking again.",
  OTP_DELIVERY_FAILED: "We could not send the code. Please try again.",
  INCORRECT_OTP: "That code is not correct. Check it and try again.",
  OTP_EXPIRED: "That code has expired. Request a new one.",
  INVALID_ATTEMPT: "That code is no longer valid. Request a new one.",
  OTP_ATTEMPTS_EXCEEDED:
    "Too many wrong codes. Request a new code to continue.",
  WRONG_TENANT: "This code was requested on a different site. Start again.",
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
  "WRONG_TENANT",
]);

async function post<T>(url: string, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json().catch(() => ({}))) as T & {
    error?: string;
  };
  return { ok: response.ok, data };
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
  const [contact, setContact] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [secondCode, setSecondCode] = useState("");
  const [attempt, setAttempt] = useState<StartResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [emailCooldown, setEmailCooldown] = useState(0);

  useEffect(() => {
    const stored = loadLoginAttempt();
    if (!stored) return;
    setAttempt(stored.attempt);
    setChannel(stored.attempt.channel);
    setCooldown(Math.max(0, Math.ceil((stored.nextResendAt - Date.now()) / 1000)));
    setNotice("Your verification is still in progress. Use the code already sent or request another when available.");
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

  function fail(errorCode: string | undefined) {
    const known = errorCode ? ERROR_MESSAGES[errorCode] : undefined;
    setError(known ?? "Something went wrong. Please try again.");
    setErrorCode(errorCode ?? null);
    if (errorCode && RESTART_ERRORS.has(errorCode)) {
      setAttempt(null);
      saveLoginAttempt(null);
      setCode("");
      setSecondCode("");
    }
  }

  async function start(event?: React.FormEvent) {
    event?.preventDefault();
    if (busy) return;
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
      return;
    }
    setContactError(null);
    setBusy(true);
    setError(null);
    setErrorCode(null);
    setNotice(null);
    try {
      const result = await post<StartResult>("/api/auth/login/start", {
        channel,
        contact: contact.trim(),
      });
      if (!result.ok) return fail(result.data.error);
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
      setError("Network problem. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !attempt) return;
    setBusy(true);
    setError(null);
    try {
      const result = await post<{ next?: string }>(
        "/api/auth/login/verify",
        {
          attemptId: attempt.attemptId,
          code: code.trim(),
          ...(attempt.requiresSecondFactor
            ? { secondCode: secondCode.trim() }
            : {}),
        },
      );
      if (!result.ok) return fail((result.data as { error?: string }).error);
      saveLoginAttempt(null);
      window.location.assign(result.data.next ?? "/dashboard");
    } catch {
      setError("Network problem. Check your connection and try again.");
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
      const result = await post<{ maskedEmail?: string }>(
        "/api/auth/login/email",
        { attemptId: attempt.attemptId },
      );
      if (!result.ok) return fail((result.data as { error?: string }).error);
      setNotice(`We emailed a code to ${result.data.maskedEmail ?? "you"}. It expires in 15 minutes.`);
      setEmailCooldown(EMAIL_RESEND_SECONDS);
      setCooldown(RESEND_SECONDS);
      if (attempt) saveLoginAttempt({
        attempt,
        expiresAt: Date.now() + Math.min(300, Math.max(1,attempt.expiresInSeconds)) * 1000,
        nextResendAt: Date.now() + RESEND_SECONDS * 1000,
      });
    } catch {
      setError("Network problem. Check your connection and try again.");
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
    <div className="w-full max-w-md">
      <h2 className="m-0 text-2xl font-semibold text-foreground">
        Sign in
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {collegeName
          ? `Sign in to ${collegeName}`
          : "Use the phone number or email registered with your college."}
      </p>

      {error ? (
        <div
          role="alert"
          className="mt-4 rounded-lg border border-error bg-[var(--lms-error-subtle)] p-3 text-sm text-error"
        >
          {error}
        </div>
      ) : null}
      {collegeName && (errorCode === "NO_ACCOUNT_FOR_DOMAIN" || errorCode === "WRONG_TENANT") ? (
        <p className="mt-2 text-sm text-body">
          This account may belong to another college.{" "}
          <a href="https://42lms.com/" className="font-semibold text-primary-text underline">
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
          <div
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
                  const other = value === "PHONE" ? "EMAIL" : "PHONE";
                  const next = allowedChannels.includes(other)?other:value;
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
          </div>

          <div id="login-method-panel" role="tabpanel"
            aria-labelledby={`login-tab-${channel.toLowerCase()}`}>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {channel === "PHONE" ? "Mobile number" : "Email address"}
            </span>
            <Input
              name="contact"
              aria-invalid={Boolean(contactError)}
              aria-describedby={contactError ? "login-contact-error" : undefined}
              value={contact}
              onChange={(event) => { setContact(event.target.value); setContactError(null); }}
              type={channel === "PHONE" ? "tel" : "email"}
              inputMode={channel === "PHONE" ? "tel" : "email"}
              autoComplete={channel === "PHONE" ? "tel" : "email"}
              placeholder={
                channel === "PHONE" ? "98765 43210" : "you@college.edu"
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
            {busy ? "Sending code…" : "Send code"}
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
                : "Verification code"}
            </span>
            <Input
              name="code"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
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
              code.length < 6 ||
              (attempt.requiresSecondFactor === true && secondCode.length < 6)
            }
          >
            {busy ? "Verifying…" : "Verify and continue"}
          </Button>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              onClick={() => void start()}
              disabled={busy || cooldown > 0}
              className="font-medium text-primary-text underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
            >
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
            </button>
            {attempt.emailFallbackAvailable && !attempt.requiresSecondFactor ? (
              <button
                type="button"
                onClick={() => void sendEmailCode()}
                disabled={busy || emailCooldown > 0}
                className="font-medium text-primary-text underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                {emailCooldown>0?`Email another code in ${emailCooldown}s`:"Email me the code instead"}
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={reset}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Use a different {channel === "PHONE" ? "number" : "email"}
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
