"use client";

import { useState, type FormEvent } from "react";

/** The contact stays in the POST body, never in a link or page search params. */
export function AdminOtpLockoutResetForm() {
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/auth/admin/otp-lockout-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, reason }),
      });
      if (!response.ok) throw new Error("RESET_FAILED");
      setPhone("");
      setReason("");
      setMessage("Recovery reviewed. The account can request a fresh login code if eligible. Requester limits still apply.");
    } catch {
      setMessage("Could not complete this recovery. Check your admin access and try again.");
    } finally {
      setBusy(false);
    }
  }
  return <form onSubmit={submit} className="max-w-xl space-y-4" autoComplete="off">
    <p className="text-sm text-muted-foreground">
      Only clear a person's sign-in attempts after verifying the support request.
      This does not change their membership or bypass anti-abuse limits.
    </p>
    <div>
      <label htmlFor="otp-reset-phone" className="block text-sm font-semibold">Mobile number</label>
      <input id="otp-reset-phone" type="tel" inputMode="tel" required minLength={8} maxLength={32}
        value={phone} onChange={event => setPhone(event.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm" />
    </div>
    <div>
      <label htmlFor="otp-reset-reason" className="block text-sm font-semibold">Reason for reset</label>
      <textarea id="otp-reset-reason" required minLength={10} maxLength={500} rows={3}
        value={reason} onChange={event => setReason(event.target.value)}
        className="mt-1 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface p-2 text-sm" />
    </div>
    <button disabled={busy} type="submit"
      className="min-h-9 rounded-[var(--lms-control-radius)] bg-[var(--lms-primary)] px-4 text-sm font-semibold text-white disabled:opacity-50">
      {busy ? "Reviewing…" : "Clear OTP lockout"}
    </button>
    {message ? <p role="status" className="text-sm text-primary-text">{message}</p> : null}
  </form>;
}
