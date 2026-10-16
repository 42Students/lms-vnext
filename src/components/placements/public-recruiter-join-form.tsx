"use client";

import Link from "next/link";
import { useState } from "react";
import type { PublicJoinPreview } from "@/modules/placements/public-join/preview-model";
import { publicJoinFormSchema } from "@/modules/placements/public-join/form-model";

export function PublicRecruiterJoinForm({
  token, scope, preview,
}: { token: string; scope: "COLLEGE" | "COMPANY"; preview: PublicJoinPreview }) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [designation, setDesignation] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [code, setCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [joined, setJoined] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const college = preview.kind === "READY" ? preview.collegeName : "";
  const company = preview.kind === "READY" ? preview.companyDomain : "";

  async function sendCode() {
    const parsed = publicJoinFormSchema.safeParse({ email, name, designation, phone, companyName });
    if (!parsed.success) {
      setError("Enter your work email and name before requesting a code.");
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
      if (!response.ok) throw new Error("SEND_FAILED");
      setSentTo(parsed.data.email);
      setCode("");
    } catch {
      setError("We couldn't send the code. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function join() {
    const parsed = publicJoinFormSchema.safeParse({ email, name, designation, phone, companyName });
    if (!parsed.success || !/^[0-9]{6}$/.test(code)) {
      setError("Enter the 6-digit code");
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
      if (!response.ok) throw new Error("JOIN_FAILED");
      setJoined(true);
    } catch {
      setError("Something went wrong. Please try again.");
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
        ) : joined ? (
          <>
            <h1 className="text-2xl font-semibold text-foreground">You now have access to {college}</h1>
            <p className="mt-3 text-sm text-body">
              Sign in with your work email, {sentTo}, on the college&apos;s placement address. We&apos;ll email you a code each time.
            </p>
            <Link href="/login" className="mt-4 inline-flex min-h-11 items-center text-primary-text underline">Sign in</Link>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-semibold text-foreground">
              {scope === "COLLEGE" ? "Hire from " + college : college + " would like your company to hire from their students"}
            </h1>
            <p className="mt-3 text-sm text-body">
              {scope === "COLLEGE"
                ? "Join with your company email. You can then request placement drives and review the students who apply."
                : "Join with your company email. You can then request placement drives and review the students who apply."}
            </p>
            <div className="mt-5 space-y-4">
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Work email
                <input type="email" required autoComplete="email" value={email} disabled={Boolean(sentTo)}
                  onChange={event => setEmail(event.target.value)} maxLength={254}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                <span className="text-xs font-normal text-muted-foreground">
                  {scope === "COMPANY"
                    ? "Your " + (company ?? "company") + " email. You'll sign in with it."
                    : "Your company email. Personal emails such as Gmail can't be used. You'll sign in with it."}
                </span>
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Your name
                <input type="text" required value={name} maxLength={150} disabled={Boolean(sentTo)}
                  onChange={event => setName(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Designation (optional)
                <input type="text" value={designation} maxLength={100} disabled={Boolean(sentTo)}
                  onChange={event => setDesignation(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
              </label>
              <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                Mobile (optional)
                <input type="tel" value={phone} maxLength={20} disabled={Boolean(sentTo)}
                  onChange={event => setPhone(event.target.value)}
                  className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                <span className="text-xs font-normal text-muted-foreground">
                  Only for the placement cell to call you. You never sign in with it.
                </span>
              </label>
              {scope === "COLLEGE" ? (
                <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                  Company name
                  <input type="text" value={companyName} maxLength={200} disabled={Boolean(sentTo)}
                    onChange={event => setCompanyName(event.target.value)}
                    className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                </label>
              ) : null}
              {!sentTo ? (
                <button type="button" disabled={pending} onClick={sendCode}
                  className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
                  Send me a code
                </button>
              ) : (
                <>
                  <label className="flex flex-col gap-1 text-sm font-semibold text-body">
                    Code sent to {sentTo}
                    <input value={code} required inputMode="numeric" pattern="[0-9]{6}" maxLength={6}
                      onChange={event => setCode(event.target.value)}
                      className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
                    <span className="text-xs font-normal text-muted-foreground">This proves the email is yours.</span>
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button type="button" disabled={pending} onClick={join}
                      className="min-h-11 rounded-md bg-primary px-4 font-semibold text-on-primary disabled:opacity-50">
                      Join {college} placements
                    </button>
                    <button type="button" disabled={pending} onClick={() => {
                      setSentTo("");
                      setCode("");
                    }} className="min-h-11 rounded-md border border-border px-4 font-semibold text-foreground">
                      Send a new code
                    </button>
                  </div>
                </>
              )}
              {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
