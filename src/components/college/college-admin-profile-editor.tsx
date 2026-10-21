"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { CollegeOwnProfileInput } from "@/modules/people/college-admin-profile-edit-service";
import {apiFetch} from "@/lib/api-fetch";
import {friendlyApiError} from "@/lib/friendly-error";

type VersionedCollegeProfile=CollegeOwnProfileInput&{profileDocumentVersion:number};
const fieldStyle = "min-h-11 w-full md:min-h-9";
function Field({ label, value, onChange, type = "text", hint }: {
  label: string; value: string; onChange: (value: string) => void;
  type?: string; hint?: string;
}) {
  return <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
    {label}
    <Input className={fieldStyle} type={type} value={value} maxLength={500}
      onChange={event => onChange(event.target.value)} />
    {hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}
  </label>;
}

export function CollegeAdminProfileEditor({ initial, email, phone, college }: {
  initial: VersionedCollegeProfile; email: string | null; phone: string | null; college: string | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<VersionedCollegeProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const savedSnapshot=useRef<VersionedCollegeProfile>(initial);
  const [discardOpen,setDiscardOpen]=useState(false);
  const dirty=JSON.stringify(profile)!==JSON.stringify(savedSnapshot.current);
  useEffect(()=>{
    if(!dirty)return;
    const onBeforeUnload=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue="";
    };
    window.addEventListener("beforeunload",onBeforeUnload);
    return ()=>window.removeEventListener("beforeunload",onBeforeUnload);
  },[dirty]);
  function cancel(){
    if(saving)return;
    if(dirty){setDiscardOpen(true);return;}
    setError("");setSaved(false);
  }
  function discard(){
    if(saving)return;
    setProfile(savedSnapshot.current);
    setDiscardOpen(false);setError("");setSaved(false);
  }
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
    const phoneValue=profile.contacts.alternatePhone.trim();
    if(phoneValue&&(!/^\+?[0-9() -]+$/.test(phoneValue)||
      phoneValue.replace(/\D/g,"").length<10||
      phoneValue.replace(/\D/g,"").length>15)){
      setError("Additional phone must contain 10–15 digits.");return;
    }
    setSaving(true); setError(""); setSaved(false);
    try {
      const result = await apiFetch<{profile:VersionedCollegeProfile}>("/api/college/profile", {
        method: "PATCH", headers: { "content-type": "application/json" },
        body: JSON.stringify(profile),
      });
      savedSnapshot.current=result.profile;
      setProfile(result.profile); setSaved(true);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : friendlyApiError({}));
    } finally { setSaving(false); }
  }
  return (
    <>
    <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
      title="Discard your unsaved profile changes?" confirmLabel="Discard changes"
      cancelLabel="Keep editing" onConfirm={discard}>
      <p className="text-sm text-body">Any unsaved profile edits will be lost. Saved account identity remains unchanged.</p>
    </ConfirmDialog>
    <form onSubmit={event => void submit(event)} className="min-w-0 space-y-6">
      <div className="flex min-w-0 flex-wrap items-center gap-4 border-b border-border pb-4">
        {profile.photoUrl ? (
          <img src={profile.photoUrl} alt={profile.displayName + " profile photo"} referrerPolicy="no-referrer"
            className="h-16 w-16 shrink-0 rounded-lg border border-border bg-muted object-cover" />
        ) : null}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="break-words text-lg font-semibold text-foreground">{profile.displayName}</p>
          <p className="break-words text-sm text-muted-foreground">{profile.roleTitle || "College Admin"} · {college || "Your college"}</p>
          {profile.photoUrl ? (
            <a href={profile.photoUrl} rel="noreferrer"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">View profile photo</a>
          ) : null}
        </div>
      </div>

      <nav aria-label="Profile sections"
        className="grid min-w-0 grid-cols-2 gap-2 border-b border-border pb-4 md:flex md:flex-wrap">
        {[
          ["personal", "Personal Details"], ["contacts", "Contacts"],
          ["social", "Social Profiles"], ["address", "Address"],
        ].map(([key, label]) => (
          <a key={key} href={"#" + key}
            className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-medium text-primary-text transition-colors duration-150 hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            {label}
          </a>
        ))}
      </nav>

      <div className="min-w-0 space-y-6">
        <section id="personal" className="min-w-0 scroll-mt-24 space-y-4">
          <h2 className="font-semibold text-foreground">Personal Details</h2>
          <p className="text-xs text-muted-foreground">Gender, date of birth and blood group require an authorized persisted personal-details schema; they are not editable in this vNext profile form yet.</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="Name" value={profile.displayName} onChange={v => top("displayName", v)} />
            <Field label="Role / Title" value={profile.roleTitle} onChange={v => top("roleTitle", v)} />
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">About
              <Textarea rows={3} maxLength={1000} className={fieldStyle}
                value={profile.about} onChange={e => top("about", e.target.value)} />
            </label>
            <div className="min-w-0 md:col-span-2">
              <Field label="Profile photo (HTTPS link)" value={profile.photoUrl}
                onChange={v => top("photoUrl", v)} hint="Paste a secure image link. Direct photo upload requires the storage service." />
            </div>
          </div>
        </section>

        <section id="contacts" className="min-w-0 scroll-mt-24 space-y-4 border-t border-border pt-6">
          <h2 className="font-semibold text-foreground">Contacts</h2>
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Primary login contacts remain read-only for account security.</p>
            <p className="break-words text-sm leading-6 text-body [overflow-wrap:anywhere]">Email: {email || "Not provided"} · Mobile: {phone || "Not provided"}</p>
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="Additional email" type="email" value={profile.contacts.alternateEmail}
              onChange={v => detail("contacts", "alternateEmail", v)} />
            <Field label="Additional phone" type="tel" value={profile.contacts.alternatePhone}
              onChange={v => detail("contacts", "alternatePhone", v)} />
            <Field label="Contact person" value={profile.contacts.contactPerson}
              onChange={v => detail("contacts", "contactPerson", v)} />
          </div>
        </section>

        <section id="social" className="min-w-0 scroll-mt-24 space-y-4 border-t border-border pt-6">
          <h2 className="font-semibold text-foreground">Social Profiles</h2>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="LinkedIn" type="url" value={profile.social.linkedIn}
              onChange={v => detail("social", "linkedIn", v)} />
            <Field label="GitHub" type="url" value={profile.social.github}
              onChange={v => detail("social", "github", v)} />
            <Field label="Portfolio / Website" type="url" value={profile.social.website}
              onChange={v => detail("social", "website", v)} />
            <Field label="Instagram" type="url" value={profile.social.instagram}
              onChange={v => detail("social", "instagram", v)} />
          </div>
          <p className="text-xs text-muted-foreground">Twitter/X is not stored by the current profile schema; no unpersisted value is collected.</p>
        </section>

        <section id="address" className="min-w-0 scroll-mt-24 space-y-4 border-t border-border pt-6">
          <h2 className="font-semibold text-foreground">Address</h2>
          <p className="text-xs text-muted-foreground">The registered profile currently stores address lines only; separate current and permanent addresses need a schema revision.</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {([
              ["line1", "Address line 1"], ["line2", "Address line 2"],
              ["city", "City"], ["state", "State"], ["postalCode", "Postal code"], ["country", "Country"],
            ] as const).map(([key, label]) => (
              <Field key={key} label={label} value={profile.address[key]}
                onChange={v => detail("address", key, v)} />
            ))}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-10 flex min-w-0 flex-col justify-end gap-3 border-t border-border bg-surface py-3 md:flex-row md:items-center">
        {error || saved ? (
          <div className="min-w-0 flex-1 space-y-2">
            {error && <Alert tone="error">{error}</Alert>}
            {saved && <Alert tone="success">Profile updated successfully.</Alert>}
          </div>
        ) : null}
        <Button variant="secondary" type="button" disabled={saving||!dirty}
          onClick={cancel} className="min-h-11 w-full md:w-auto md:min-h-9">
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={saving||!dirty} loading={saving}
          className="min-h-11 w-full md:min-h-9 md:w-auto md:shrink-0">
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
    </>
  );
}
