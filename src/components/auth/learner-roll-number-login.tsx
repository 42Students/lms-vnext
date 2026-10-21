"use client";

import { useState, type FormEvent } from "react";

type StartResult = { attemptId: string; maskedContact: string; expiresInSeconds: number };
export function LearnerRollNumberLogin() {
  const [rollNumber, setRollNumber] = useState("");
  const [attempt, setAttempt] = useState<StartResult | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function start(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/login/roll-number/start", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNumber: rollNumber.trim() }),
      });
      if (!response.ok) throw new Error("This sign-in method is unavailable. Use your registered phone or email.");
      const data: StartResult = await response.json();
      setAttempt(data); setCode("");
      setRollNumber("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not request a code.");
    } finally { setBusy(false); }
  }
  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!attempt || busy) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/auth/login/verify", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId: attempt.attemptId, code }),
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Incorrect or expired code. Request a new code if needed.");
      const data: { next: string } = await response.json();
      window.location.assign(data.next || "/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not verify your code.");
    } finally { setBusy(false); }
  }
  return <section className="mx-auto max-w-md space-y-4 rounded-xl border border-border bg-surface p-6">
    <p className="text-sm text-muted-foreground">
      On participating college domains, enter your roll number to receive a
      code at your registered contact. Your roll number is not a password.
    </p>
    {!attempt ? <form className="space-y-3" onSubmit={start}>
      <label htmlFor="roll-login-roll" className="block text-sm font-semibold">Roll number</label>
      <input id="roll-login-roll" required maxLength={128} value={rollNumber}
        autoComplete="username" onChange={event => setRollNumber(event.target.value)}
        className="w-full rounded border border-border bg-surface px-3 py-2" />
      <button type="submit" disabled={busy}
        className="min-h-9 w-full rounded bg-[var(--lms-primary)] px-4 font-semibold text-white disabled:opacity-50">
        {busy ? "Requesting…" : "Send OTP"}
      </button>
    </form> : <form className="space-y-3" onSubmit={verify}>
      <p className="text-sm" role="status">Code sent to {attempt.maskedContact}</p>
      <label htmlFor="roll-login-code" className="block text-sm font-semibold">Verification code</label>
      <input id="roll-login-code" inputMode="numeric" autoComplete="one-time-code" required
        minLength={4} maxLength={8} pattern="[0-9]{4,8}" value={code}
        onChange={event => setCode(event.target.value)}
        className="w-full rounded border border-border bg-surface px-3 py-2" />
      <button type="submit" disabled={busy} className="min-h-9 w-full rounded bg-[var(--lms-primary)] px-4 font-semibold text-white disabled:opacity-50">
        {busy ? "Verifying…" : "Verify and sign in"}
      </button>
      <button type="button" disabled={busy}
        className="block text-sm text-primary-text underline"
        onClick={() => { setAttempt(null); setCode(""); setMessage(""); }}>
        Request another code
      </button>
    </form>}
    {message ? <p role="alert" className="text-sm text-error">{message}</p> : null}
    <p className="text-xs text-muted-foreground">
      This option is enabled by your college. For other accounts use the standard login.
    </p>
    <a href="/login" className="text-sm text-primary-text underline">Sign in with phone or email</a>
  </section>;
}
