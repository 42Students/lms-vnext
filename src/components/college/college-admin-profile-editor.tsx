"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { CollegeOwnProfileInput } from "@/modules/people/college-admin-profile-edit-service";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

const fieldStyle = "min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground";
function Field({ label, value, onChange, type = "text", hint }: {
  label: string; value: string; onChange: (value: string) => void;
  type?: string; hint?: string;
}) {
  return <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">
    {label}
    <Input className={fieldStyle} type={type} value={value} maxLength={500}
      onChange={event => onChange(event.target.value)} />
    {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
  </label>;
}

export function CollegeAdminProfileEditor({ initial, email, phone, college }: {
  initial: CollegeOwnProfileInput; email: string | null; phone: string | null; college: string | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<CollegeOwnProfileInput>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  function top(key: "displayName" | "roleTitle" | "about" | "photoUrl", value: string) {
    setProfile(current => ({ ...current, [key]: value })); setSaved(false);
  }
  function detail(section: "social" | "address" | "contacts", key: string, value: string) {
    setProfile(current => ({
      ...current, [section]: { ...current[section], [key]: value },
    })); setSaved(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(saving)return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const result = await apiFetch<{profile:CollegeOwnProfileInput}>("/api/college/profile", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      setProfile(result.profile); setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : friendlyApiError({}));
    } finally { setSaving(false); }
  }
  return <form onSubmit={event => void submit(event)} className="space-y-5">
    <div className="border-b border-border pb-5">
      <p className="text-lg font-semibold text-foreground">{profile.displayName}</p>
      <p className="text-sm text-muted-foreground">{profile.roleTitle || "College Admin"} · {college || "Your college"}</p>
      {profile.photoUrl?<div className="mt-3 flex flex-wrap items-center gap-3">
        {/* The signed-in administrator supplied this HTTPS image URL. No private document URL is synthesized. */}
        <img src={profile.photoUrl} alt={profile.displayName+" profile photo"} referrerPolicy="no-referrer"
          className="h-16 w-16 rounded-full border border-border bg-muted object-cover"/>
        <a href={profile.photoUrl} rel="noreferrer"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline">View profile photo</a>
      </div>:null}
    </div>
    <nav aria-label="Profile sections" className="flex flex-wrap gap-2">
      {[
        ["personal", "Personal Details"], ["social", "Social Profiles"],
        ["address", "Address"], ["contacts", "Contacts"],
      ].map(([key, label]) => <a key={key} href={"#" + key}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-link">{label}</a>)}
    </nav>
    <div className="grid gap-5 md:grid-cols-2">
      <section id="personal" className="scroll-mt-24 space-y-3 border-t border-border pt-5">
        <h2 className="font-semibold text-foreground">Personal Details</h2>
        <Field label="Name" value={profile.displayName} onChange={v => top("displayName", v)} />
        <Field label="Role / Title" value={profile.roleTitle} onChange={v => top("roleTitle", v)} />
        <label className="grid gap-1 text-sm font-semibold text-body">About
          <Textarea rows={3} maxLength={1000} className={fieldStyle}
            value={profile.about} onChange={e => top("about", e.target.value)} />
        </label>
        <Field label="Profile photo (HTTPS link)" value={profile.photoUrl}
          onChange={v => top("photoUrl", v)} hint="Paste a secure image link. Direct photo upload requires the storage service." />
      </section>
      <section id="social" className="scroll-mt-24 space-y-3 border-t border-border pt-5">
        <h2 className="font-semibold text-foreground">Social Profiles</h2>
        <Field label="LinkedIn" type="url" value={profile.social.linkedIn}
          onChange={v => detail("social", "linkedIn", v)} />
        <Field label="GitHub" type="url" value={profile.social.github}
          onChange={v => detail("social", "github", v)} />
        <Field label="Website" type="url" value={profile.social.website}
          onChange={v => detail("social", "website", v)} />
        <Field label="Instagram" type="url" value={profile.social.instagram}
          onChange={v => detail("social", "instagram", v)} />
      </section>
      <section id="address" className="scroll-mt-24 space-y-3 border-t border-border pt-5">
        <h2 className="font-semibold text-foreground">Address</h2>
        {([
          ["line1", "Address line 1"], ["line2", "Address line 2"],
          ["city", "City"], ["state", "State"], ["postalCode", "Postal code"], ["country", "Country"],
        ] as const).map(([key, label]) =>
          <Field key={key} label={label} value={profile.address[key]}
            onChange={v => detail("address", key, v)} />)}
      </section>
      <section id="contacts" className="scroll-mt-24 space-y-3 border-t border-border pt-5">
        <h2 className="font-semibold text-foreground">Contacts</h2>
        <p className="text-xs text-muted-foreground">Primary login contacts remain read-only for account security.</p>
        <p className="text-sm text-body">Email: {email || "Not provided"} · Mobile: {phone || "Not provided"}</p>
        <Field label="Additional email" type="email" value={profile.contacts.alternateEmail}
          onChange={v => detail("contacts", "alternateEmail", v)} />
        <Field label="Additional phone" value={profile.contacts.alternatePhone}
          onChange={v => detail("contacts", "alternatePhone", v)} />
        <Field label="Contact person" value={profile.contacts.contactPerson}
          onChange={v => detail("contacts", "contactPerson", v)} />
      </section>
    </div>
    {error && <p role="alert" className="text-sm text-error">{error}</p>}
    {saved && <p role="status" className="text-sm font-semibold text-link">Profile updated successfully.</p>}
    <Button variant="primary" type="submit" disabled={saving} className="min-h-11 sm:min-h-9">
      {saving ? "Saving…" : "Save profile"}
    </Button>
  </form>;
}
