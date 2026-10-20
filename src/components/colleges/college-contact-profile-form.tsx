"use client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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

const inputClass = "min-h-11 md:min-h-9 w-full";

export function CollegeContactProfileForm({ initial }: {
  initial: CollegeContactProfileView;
}) {
  const router = useRouter();
  const [pending, transition] = useTransition();
  const [saved, setSaved] = useState(initial);
  const [name, setName] = useState(initial.collegeName);
  const [email, setEmail] = useState(initial.supportEmail ?? "");
  const [phone, setPhone] = useState(initial.supportPhone ?? "");
  const [terms, setTerms] = useState(initial.termsUrl ?? "");
  const [privacy, setPrivacy] = useState(initial.privacyUrl ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dirty = name.trim() !== saved.collegeName ||
    email.trim() !== (saved.supportEmail ?? "") ||
    phone.trim() !== (saved.supportPhone ?? "") ||
    terms.trim() !== (saved.termsUrl ?? "") ||
    privacy.trim() !== (saved.privacyUrl ?? "");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pending && dirty) setConfirmOpen(true);
  }

  function confirmSave() {
    setConfirmOpen(false);
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
            expectedVersion: saved.version,
            confirm: true,
          }),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) throw new Error(data?.error || "Unable to update college contacts");
        if (data?.profile && Number.isInteger(data.profile.version)) {
          const profile = data.profile as CollegeContactProfileView;
          setSaved(profile);
          setName(profile.collegeName);
          setEmail(profile.supportEmail ?? "");
          setPhone(profile.supportPhone ?? "");
          setTerms(profile.termsUrl ?? "");
          setPrivacy(profile.privacyUrl ?? "");
        }
        setSuccess("College contact profile updated.");
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Unable to save college contacts");
      }
    });
  }

  return <><form onSubmit={submit} onChangeCapture={() => { setError(null); setSuccess(null); }}
    className="grid min-w-0 max-w-[920px] gap-[var(--lms-space-4)] md:grid-cols-2">
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold text-body md:col-span-2">
      Public college display name
      <Input required disabled={pending} maxLength={160} className={inputClass} value={name}
        onChange={event => setName(event.target.value)} />
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold text-body">
      Support email
      <Input type="email" disabled={pending} maxLength={320} className={inputClass}
        value={email} onChange={event => setEmail(event.target.value)}
        placeholder="help@example.edu" />
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold text-body">
      Support phone
      <Input type="tel" disabled={pending} maxLength={32} className={inputClass}
        value={phone} onChange={event => setPhone(event.target.value)}
        placeholder="+91 98765 43210" />
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold text-body">
      Terms of use URL (HTTPS)
      <Input type="url" pattern="https://.*" disabled={pending} maxLength={2048} className={inputClass}
        value={terms} onChange={event => setTerms(event.target.value)}
        placeholder="https://college.example.edu/terms" />
    </label>
    <label className="grid min-w-0 gap-[var(--lms-space-2)] text-sm font-semibold text-body">
      Privacy policy URL (HTTPS)
      <Input type="url" pattern="https://.*" disabled={pending} maxLength={2048} className={inputClass}
        value={privacy} onChange={event => setPrivacy(event.target.value)}
        placeholder="https://college.example.edu/privacy" />
    </label>
    {error ? <p role="alert" className="min-w-0 break-words text-sm text-error md:col-span-2">
      {error}. If this profile changed elsewhere, refresh before retrying.
    </p> : null}
    {success ? <p role="status" className="min-w-0 break-words text-sm text-success md:col-span-2">
      {success}
    </p> : null}
    <div className="flex min-w-0 flex-col-reverse items-stretch gap-[var(--lms-space-3)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)] sm:flex-row-reverse sm:items-center sm:justify-start md:col-span-2">
      <Button disabled={pending || !dirty} loading={pending} type="submit"
        className="min-h-11 w-full sm:w-auto md:min-h-9">
        {pending ? "Saving…" : "Confirm and save changes"}
      </Button>
      <Button disabled={pending || !dirty} type="button" onClick={() => {
        setName(saved.collegeName);
        setEmail(saved.supportEmail ?? "");
        setPhone(saved.supportPhone ?? "");
        setTerms(saved.termsUrl ?? "");
        setPrivacy(saved.privacyUrl ?? "");
        setError(null);
        setSuccess(null);
      }} variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">
        Reset
      </Button>
    </div>
    <p className="max-w-[75ch] text-xs leading-5 text-muted-foreground md:col-span-2">
      Only display name and public support/policy fields are editable here.
      College code, private addresses, account contacts, sign-in images and branding colours are unchanged.
      A stale version is rejected rather than overwriting a concurrent update.
    </p>
  </form>
  <ConfirmDialog
    open={confirmOpen}
    onOpenChange={setConfirmOpen}
    title="Update college contact profile?"
    description="The display name and public support details may appear on the college sign-in page."
    confirmLabel="Save changes"
    confirmVariant="primary"
    pending={pending}
    confirmDisabled={!dirty}
    onConfirm={confirmSave}
  />
  </>;
}
