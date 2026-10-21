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
type ProfileSection="personal"|"social"|"address"|"contacts";
function Field({ label, value, onChange, type = "text", hint, disabled=false, maxLength=150, placeholder }: {
  label: string; value: string; onChange: (value: string) => void;
  type?: string; hint?: string; disabled?:boolean; maxLength?:number; placeholder?:string;
}) {
  return <label className="grid min-w-0 gap-2 text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">
    {label}
    <Input className={fieldStyle} type={type} value={value} maxLength={maxLength}
      disabled={disabled} placeholder={placeholder}
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
  const [editableSection,setEditableSection]=useState<ProfileSection|null>(null);
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
    setDiscardOpen(false);setError("");setSaved(false);setEditableSection(null);
  }
  function editSection(section:ProfileSection){
    if(saving)return;
    // Changing the edited card never discards unsaved changes in another card.
    setEditableSection(current=>current===section?null:section);
  }
  function cardHeader(section:ProfileSection,title:string){
    return <header className="-mx-4 -mt-4 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-t-[var(--lms-canvas-radius)] border-b border-[#b8dce9] bg-[#e8f5fd] px-4 py-3">
      <h2 className="font-semibold text-[var(--lms-heading)]">{title}</h2>
      <Button variant="secondary" type="button" disabled={saving}
        onClick={()=>editSection(section)}
        aria-label={(editableSection===section?"Finish editing ":"Edit ")+title}
        className="min-h-11 gap-2 md:min-h-9">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4L16.5 3.5Z"/>
        </svg>
        {editableSection===section?"Done":"Edit"}
      </Button>
    </header>;
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
    const baseline = savedSnapshot.current;
    const changedSections:ProfileSection[]=[];
    if (profile.displayName!==baseline.displayName ||
        profile.roleTitle!==baseline.roleTitle ||
        profile.about!==baseline.about ||
        profile.photoUrl!==baseline.photoUrl ||
        JSON.stringify(profile.personalDetails)!==JSON.stringify(baseline.personalDetails))
      changedSections.push("personal");
    if(JSON.stringify(profile.social)!==JSON.stringify(baseline.social))
      changedSections.push("social");
    if(JSON.stringify(profile.address)!==JSON.stringify(baseline.address))
      changedSections.push("address");
    if(JSON.stringify(profile.contacts)!==JSON.stringify(baseline.contacts))
      changedSections.push("contacts");
    if(!changedSections.length)return;
    setSaving(true); setError(""); setSaved(false);
    try {
      const result = await apiFetch<{profile:VersionedCollegeProfile}>("/api/college/profile", {
        method: "PATCH", headers: { "content-type": "application/json" },
        // Only dirty profile cards replace stored cards. The server checks the
        // baseline under a row lock so concurrent updates to other cards survive.
        body: JSON.stringify({...profile,baseline,changedSections}),
      });
      savedSnapshot.current=result.profile;
      setProfile(result.profile); setSaved(true);setEditableSection(null);
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
    <form onSubmit={event => void submit(event)} aria-busy={saving}
      className="min-w-0 space-y-6">
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
          ["personal", "Personal Details"], ["social", "Social Profiles"],
          ["address", "Address"], ["contacts", "Contacts"],
        ].map(([key, label]) => (
          <a key={key} href={"#" + key}
            className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-center text-sm font-medium text-primary-text transition-colors duration-150 hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
            {label}
          </a>
        ))}
      </nav>

      <div className="grid min-w-0 items-start gap-5 xl:grid-cols-2">
        <section id="personal" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4">
          {cardHeader("personal","Personal Details")}
          <p className="text-xs text-muted-foreground">Gender, date of birth and blood group require an authorized persisted personal-details schema; they are not editable in this vNext profile form yet.</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="Name" value={profile.displayName} onChange={v => top("displayName", v)} disabled={editableSection!=="personal"} />
            <Field label="Role / Title" value={profile.roleTitle} onChange={v => top("roleTitle", v)} disabled={editableSection!=="personal"} />
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">About
              <Textarea rows={3} maxLength={1000} className={fieldStyle}
                value={profile.about} disabled={editableSection!=="personal"} onChange={e => top("about", e.target.value)} />
            </label>
            <div className="min-w-0 md:col-span-2">
              <Field label="Profile photo (HTTPS link)" value={profile.photoUrl}
                onChange={v => top("photoUrl", v)} disabled={editableSection!=="personal"} maxLength={500} hint="Paste a secure image link. Direct photo upload requires the storage service." />
            </div>
          </div>
        </section>

        <section id="social" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 border-t border-border pt-6">
          {cardHeader("social","Social Profiles")}
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="LinkedIn" type="url" maxLength={500} value={profile.social.linkedIn}
              disabled={editableSection!=="social"} onChange={v => detail("social", "linkedIn", v)} />
            <Field label="GitHub" type="url" maxLength={500} value={profile.social.github}
              disabled={editableSection!=="social"} onChange={v => detail("social", "github", v)} />
            <Field label="Portfolio / Website" type="url" maxLength={500} value={profile.social.website}
              disabled={editableSection!=="social"} onChange={v => detail("social", "website", v)} />
            <Field label="Instagram" type="url" maxLength={500} value={profile.social.instagram}
              disabled={editableSection!=="social"} onChange={v => detail("social", "instagram", v)} />
          </div>
          <p className="text-xs text-muted-foreground">Twitter/X is not stored by the current profile schema; no unpersisted value is collected.</p>
        </section>

        <section id="address" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 border-t border-border pt-6">
          {cardHeader("address","Address")}
          <p className="text-xs text-muted-foreground">Current Address and Permanent Address map to the two stored address lines. City, State and Pincode are shared until separate address records are supported.</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {([
              ["line1", "Current Address"], ["line2", "Permanent Address"],
              ["city", "City"], ["state", "State"], ["postalCode", "Pincode"], ["country", "Country"],
            ] as const).map(([key, label]) => (
              <Field key={key} label={label} value={profile.address[key]} maxLength={key==="postalCode"?20:150}
                onChange={v => detail("address", key, v)} disabled={editableSection!=="address"} />
            ))}
          </div>
        </section>
        <section id="contacts" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 border-t border-border pt-6">
          {cardHeader("contacts","Contacts")}
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Primary login contacts remain read-only for account security.</p>
            <p className="break-words text-sm leading-6 text-body [overflow-wrap:anywhere]">Email: {email || "Not provided"} · Mobile: {phone || "Not provided"}</p>
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="Additional email" type="email" maxLength={254} value={profile.contacts.alternateEmail} disabled={editableSection!=="contacts"}
              onChange={v => detail("contacts", "alternateEmail", v)} />
            <Field label="Additional phone" type="tel" maxLength={40} value={profile.contacts.alternatePhone} disabled={editableSection!=="contacts"}
              onChange={v => detail("contacts", "alternatePhone", v)} />
            <Field label="Contact person" value={profile.contacts.contactPerson} disabled={editableSection!=="contacts"}
              onChange={v => detail("contacts", "contactPerson", v)} />
          </div>
        </section>

      </div>

      <div role="status" aria-live="polite" className="sticky bottom-0 z-10 flex min-w-0 flex-col justify-end gap-3 border-t border-border bg-surface py-3 md:flex-row md:items-center">
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
