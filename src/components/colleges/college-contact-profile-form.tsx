"use client";
import { Input } from "@/components/ui/input";


import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

export type CollegeContactProfileView = {
  collegeName: string;
  supportEmail: string | null;
  supportPhone: string | null;
  termsUrl: string | null;
  privacyUrl: string | null;
  version: number;
};

const inputClass = "min-h-11 w-full rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-sm text-foreground";

export function CollegeContactProfileForm({ initial }: {
  initial: CollegeContactProfileView;
}) {
  const router = useRouter();
  const [pending, transition] = useTransition();
  const [name, setName] = useState(initial.collegeName);
  const [email, setEmail] = useState(initial.supportEmail ?? "");
  const [phone, setPhone] = useState(initial.supportPhone ?? "");
  const [terms, setTerms] = useState(initial.termsUrl ?? "");
  const [privacy, setPrivacy] = useState(initial.privacyUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!window.confirm("Confirm updating your college display name and public support contacts? These details may appear on the public college sign-in page.")) {
      return;
    }
    setError(null);
    setSuccess(null);
    transition(async () => {
      try {
        const response = await fetch("/api/colleges/contact-profile", {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            collegeName: name,
            supportEmail: email || null,
            supportPhone: phone || null,
            termsUrl: terms || null,
            privacyUrl: privacy || null,
            expectedVersion: initial.version,
            confirm: true,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Unable to update college contacts");
        setSuccess("College contact profile updated.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save college contacts");
      }
    });
  }

  return <form onSubmit={submit}
    className="grid max-w-3xl gap-4 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-5 sm:grid-cols-2">
    <label className="grid gap-2 text-sm font-semibold text-body sm:col-span-2">
      Public college display name
      <Input required maxLength={160} className={inputClass} value={name}
        onChange={event => setName(event.target.value)} />
    </label>
    <label className="grid gap-2 text-sm font-semibold text-body">
      Support email
      <Input type="email" maxLength={320} className={inputClass}
        value={email} onChange={event => setEmail(event.target.value)}
        placeholder="help@example.edu" />
    </label>
    <label className="grid gap-2 text-sm font-semibold text-body">
      Support phone
      <Input type="tel" maxLength={32} className={inputClass}
        value={phone} onChange={event => setPhone(event.target.value)}
        placeholder="+91 98765 43210" />
    </label>
    <label className="grid gap-2 text-sm font-semibold text-body">
      Terms of use URL (HTTPS)
      <Input type="url" maxLength={2048} className={inputClass}
        value={terms} onChange={event => setTerms(event.target.value)}
        placeholder="https://college.example.edu/terms" />
    </label>
    <label className="grid gap-2 text-sm font-semibold text-body">
      Privacy policy URL (HTTPS)
      <Input type="url" maxLength={2048} className={inputClass}
        value={privacy} onChange={event => setPrivacy(event.target.value)}
        placeholder="https://college.example.edu/privacy" />
    </label>
    {error ? <p role="alert" className="text-sm text-red-700 sm:col-span-2">
      {error}. If this profile changed elsewhere, refresh before retrying.
    </p> : null}
    {success ? <p role="status" className="text-sm text-green-700 sm:col-span-2">
      {success}
    </p> : null}
    <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
      <button disabled={pending} type="submit"
        className="min-h-11 rounded-[var(--lms-control-radius,9px)] bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60">
        {pending ? "Saving…" : "Confirm and save changes"}
      </button>
      <button disabled={pending} type="button" onClick={() => {
        setName(initial.collegeName);
        setEmail(initial.supportEmail ?? "");
        setPhone(initial.supportPhone ?? "");
        setTerms(initial.termsUrl ?? "");
        setPrivacy(initial.privacyUrl ?? "");
        setError(null);
      }} className="min-h-11 rounded-[var(--lms-control-radius,9px)] border border-border px-5 text-sm font-semibold">
        Reset
      </button>
    </div>
    <p className="text-xs leading-5 text-muted-foreground sm:col-span-2">
      Only display name and public support/policy fields are editable here.
      College code, private addresses, account contacts, sign-in images and branding colours are unchanged.
      A stale version is rejected rather than overwriting a concurrent update.
    </p>
  </form>;
}
