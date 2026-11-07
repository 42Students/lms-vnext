"use client";

import { useState, type FormEvent } from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";

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
    if (!rollNumber.trim()) {
      setMessage("Enter the roll number provided by your college.");
      return;
    }
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
  return <section aria-label="Student roll-number sign-in" className="mx-auto w-full max-w-md space-y-5 rounded-xl border border-border bg-surface p-5 shadow-sm sm:p-6">
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
        {attempt ? "Step 2 of 2 · Verify your code" : "Step 1 of 2 · Enter your roll number"}
      </p>
      <p className="text-sm leading-6 text-muted-foreground">
        {attempt
          ? "Enter the code sent to your registered contact. You can return to the first step if you need a new code."
          : "This option is available on participating college domains. Your roll number is not a password."}
      </p>
    </div>
    {!attempt ? <form className="space-y-3" onSubmit={start}>
      <Label htmlFor="roll-login-roll" className="block">Roll number</Label>
      <p id="roll-login-hint" className="text-xs leading-5 text-muted-foreground">
        Use the roll number shown in your college records.
      </p>
      <Input id="roll-login-roll" required maxLength={128} value={rollNumber}
        autoComplete="username" autoCapitalize="none" spellCheck={false}
        aria-describedby={"roll-login-hint" + (message ? " roll-login-error" : "")}
        aria-invalid={Boolean(message)}
        disabled={busy} onChange={event => setRollNumber(event.target.value)}
        className="w-full" />
      <Button type="submit" disabled={busy} loading={busy}
        className="w-full">
        {busy ? "Requesting code…" : "Send verification code"}
      </Button>
    </form> : <form className="space-y-3" onSubmit={verify}>
      <p className="text-sm leading-6" role="status">Code sent to <strong>{attempt.maskedContact}</strong></p>
      <Label htmlFor="roll-login-code" className="block">Verification code</Label>
      <p id="roll-login-code-hint" className="text-xs leading-5 text-muted-foreground">
        Enter the 4–8 digit code from your registered contact.
      </p>
      <Input id="roll-login-code" inputMode="numeric" autoComplete="one-time-code" enterKeyHint="done"
        required minLength={4} maxLength={8} pattern="[0-9]{4,8}" value={code}
        disabled={busy} aria-describedby={"roll-login-code-hint" + (message ? " roll-login-error" : "")}
        aria-invalid={Boolean(message)}
        onChange={event => setCode(event.target.value)}
        className="w-full" />
      <Button type="submit" disabled={busy} loading={busy} className="w-full">
        {busy ? "Verifying…" : "Verify and sign in"}
      </Button>
      <Button variant="link" size="inline" type="button" disabled={busy}
        className="block"
        onClick={() => { setAttempt(null); setCode(""); setMessage(""); }}>
        Start again or request another code
      </Button>
    </form>}
    {message ? <p id="roll-login-error" role="alert" className="text-sm leading-6 text-error">{message}</p> : null}
    <div className="border-t border-border pt-4">
      <p className="mb-2 text-xs leading-5 text-muted-foreground">
        Don't have a college roll number, or prefer another sign-in method?
      </p>
      <TextLink href="/login" className="inline-flex min-h-11 items-center text-sm">
        Sign in with phone or email
      </TextLink>
    </div>
  </section>;
}
