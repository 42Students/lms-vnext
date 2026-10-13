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
};

const RESEND_SECONDS = 30;

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
}: {
  collegeName?: string | null;
}) {
  const [channel, setChannel] = useState<Channel>("PHONE");
  const [contact, setContact] = useState("");
  const [code, setCode] = useState("");
  const [attempt, setAttempt] = useState<StartResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  function fail(errorCode: string | undefined) {
    const known = errorCode ? ERROR_MESSAGES[errorCode] : undefined;
    setError(known ?? "Something went wrong. Please try again.");
    if (errorCode && RESTART_ERRORS.has(errorCode)) {
      setAttempt(null);
      setCode("");
    }
  }

  async function start(event?: React.FormEvent) {
    event?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const result = await post<StartResult>("/api/auth/login/start", {
        channel,
        contact: contact.trim(),
      });
      if (!result.ok) return fail(result.data.error);
      setAttempt(result.data);
      setCode("");
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
        { attemptId: attempt.attemptId, code: code.trim() },
      );
      if (!result.ok) return fail((result.data as { error?: string }).error);
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
      setNotice(`We emailed a code to ${result.data.maskedEmail ?? "you"}.`);
      setCooldown(RESEND_SECONDS);
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setAttempt(null);
    setCode("");
    setError(null);
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
            {(["PHONE", "EMAIL"] as const).map((value) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={channel === value}
                onClick={() => {
                  setChannel(value);
                  setContact("");
                  setError(null);
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

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              {channel === "PHONE" ? "Mobile number" : "Email address"}
            </span>
            <Input
              name="contact"
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              type={channel === "PHONE" ? "tel" : "email"}
              inputMode={channel === "PHONE" ? "tel" : "email"}
              autoComplete={channel === "PHONE" ? "tel" : "email"}
              placeholder={
                channel === "PHONE" ? "98765 43210" : "you@college.edu"
              }
              required
              autoFocus
            />
          </label>

          <Button
            type="submit"
            className="w-full"
            disabled={busy || contact.trim().length < 3}
          >
            {busy ? "Sending code…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="mt-5 space-y-4" noValidate>
          <p className="m-0 text-sm text-body">
            We sent a 6-digit code to{" "}
            <strong className="text-foreground">
              {attempt.maskedContact}
            </strong>
            . It expires in {Math.round(attempt.expiresInSeconds / 60)}{" "}
            minutes.
          </p>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-foreground">
              Verification code
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

          <Button
            type="submit"
            className="w-full"
            disabled={busy || code.length < 6}
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
            {attempt.emailFallbackAvailable ? (
              <button
                type="button"
                onClick={() => void sendEmailCode()}
                disabled={busy || cooldown > 0}
                className="font-medium text-primary-text underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
              >
                Email me the code instead
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
        </form>
      )}
    </div>
  );
}
