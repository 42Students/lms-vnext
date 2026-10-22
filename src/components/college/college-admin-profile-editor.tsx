"use client";

import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
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

export function CollegeAdminProfileEditor({ initial, email, phone, college, readOnly = false }: {
  initial: VersionedCollegeProfile; email: string | null; phone: string | null; college: string | null; readOnly?: boolean;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<VersionedCollegeProfile>(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const savedSnapshot=useRef<VersionedCollegeProfile>(initial);
  const [discardOpen,setDiscardOpen]=useState(false);
  const [discardSection,setDiscardSection]=useState<ProfileSection|null>(null);
  const formRef=useRef<HTMLFormElement>(null);
  const sectionSaveIntent=useRef<ProfileSection|null>(null);
  const [pendingNavigation,setPendingNavigation]=useState<string|null>(null);
  const [editableSection,setEditableSection]=useState<ProfileSection|null>(null);
  const dirty=JSON.stringify(profile)!==JSON.stringify(savedSnapshot.current);
  // A successful background refresh updates the baseline only while this
  // editor is clean. Never overwrite unsaved edits or trust a failed read.
  useEffect(()=>{
    if(readOnly||dirty)return;
    if(JSON.stringify(initial)===JSON.stringify(savedSnapshot.current))return;
    savedSnapshot.current=initial;
    setProfile(initial);
    setEditableSection(null);
    setError("");
    setSaved(false);
  },[initial,readOnly,dirty]);
  useEffect(()=>{
    if(!dirty||readOnly)return;
    const onBeforeUnload=(event:BeforeUnloadEvent)=>{
      event.preventDefault();
      event.returnValue="";
    };
    window.addEventListener("beforeunload",onBeforeUnload);
    return ()=>window.removeEventListener("beforeunload",onBeforeUnload);
  },[dirty]);
  useEffect(()=>{
    if(!dirty)return;
    // The App Router does not emit Pages Router routeChangeStart events.
    // Intercept same-origin links while drafts are dirty, without breaking
    // external links, modifier shortcuts, downloads or in-page anchors.
    const onClick=(event:MouseEvent)=>{
      if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||
        event.shiftKey||event.altKey||!(event.target instanceof Element))return;
      const link=event.target.closest("a[href]");
      if(!link||link.hasAttribute("download")||
        (link.getAttribute("target")&&link.getAttribute("target")!=="_self"))return;
      const destination=new URL(link.getAttribute("href")??"",window.location.href);
      if(destination.origin!==window.location.origin)return;
      const current=window.location.pathname+window.location.search;
      if(destination.pathname+destination.search===current)return;
      event.preventDefault();
      event.stopPropagation();
      setPendingNavigation(destination.pathname+destination.search+destination.hash);
    };
    document.addEventListener("click",onClick,true);
    return ()=>document.removeEventListener("click",onClick,true);
  },[dirty]);
  function sectionChanged(section:ProfileSection){
    const baseline=savedSnapshot.current;
    if(section==="personal")return JSON.stringify([
      profile.displayName,profile.roleTitle,profile.about,profile.photoUrl,profile.personalDetails,
    ])!==JSON.stringify([
      baseline.displayName,baseline.roleTitle,baseline.about,baseline.photoUrl,baseline.personalDetails,
    ]);
    return JSON.stringify(profile[section])!==JSON.stringify(baseline[section]);
  }
  function cancel(){
    if(saving)return;
    if(dirty){setDiscardSection(null);setDiscardOpen(true);return;}
    setError("");setSaved(false);setEditableSection(null);
  }
  function cancelSection(section:ProfileSection){
    if(saving)return;
    if(sectionChanged(section)){setDiscardSection(section);setDiscardOpen(true);return;}
    setEditableSection(null);
  }
  function discard(){
    if(saving)return;
    const baseline=savedSnapshot.current;
    setProfile(current=>{
      if(!discardSection)return baseline;
      if(discardSection==="personal")return {...current,
        displayName:baseline.displayName,roleTitle:baseline.roleTitle,
        about:baseline.about,photoUrl:baseline.photoUrl,
        personalDetails:baseline.personalDetails};
      return {...current,[discardSection]:baseline[discardSection]};
    });
    setDiscardOpen(false);setDiscardSection(null);
    setError("");setSaved(false);setEditableSection(null);
  }
  function editSection(section:ProfileSection){
    if(saving)return;
    if(editableSection===section){cancelSection(section);return;}
    // Changing the edited card never discards unsaved changes in another card.
    setEditableSection(section);
  }
  function cardHeader(section:ProfileSection,title:string){
    return <header className="-mx-4 -mt-4 mb-4 flex flex-wrap items-center justify-between gap-2 rounded-t-[var(--lms-canvas-radius)] border-b border-[#b8dce9] bg-[#e8f5fd] px-4 py-3">
      <h2 className="font-semibold text-[var(--lms-heading)]">{title}</h2>
      <Button variant="secondary" type="button" disabled={saving||readOnly}
        onClick={()=>editSection(section)}
        aria-label={(editableSection===section?"Finish editing ":"Edit ")+title}
        className="min-h-11 gap-2 md:min-h-9">
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4L16.5 3.5Z"/>
        </svg>
        {editableSection===section?"Close":"Edit"}
      </Button>
      {editableSection===section?<div className="flex flex-wrap gap-2">
        <Button type="button" variant="secondary" disabled={saving}
          onClick={()=>cancelSection(section)} className="min-h-11 md:min-h-9">Cancel</Button>
        <Button type="button" variant="primary" disabled={saving||!sectionChanged(section)} loading={saving}
          onClick={()=>{sectionSaveIntent.current=section;formRef.current?.requestSubmit();}} className="min-h-11 md:min-h-9">Save</Button>
      </div>:null}
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
  function personal(key:"gender"|"dateOfBirth"|"bloodGroup",value:string){
    setProfile(current=>({...current,personalDetails:{
      gender:current.personalDetails?.gender??"",
      dateOfBirth:current.personalDetails?.dateOfBirth??"",
      bloodGroup:current.personalDetails?.bloodGroup??"",
      [key]:value,
    }}));setSaved(false);
  }
  function additionalPhone(value:string){
    // The legacy Contacts editor accepts digits only and caps alternate
    // phone numbers at 15 digits; preserve that interaction on input.
    const digits=value.replace(/\D/g,"").slice(0,15);
    setProfile(current=>({...current,contacts:{...current.contacts,
      alternatePhone:digits,contactPhone:digits}}));setSaved(false);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(saving||readOnly)return;
    const requestedSection=sectionSaveIntent.current;
    sectionSaveIntent.current=null;
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
    const savingSections=requestedSection
      ? changedSections.filter(section=>section===requestedSection) : changedSections;
    if(!savingSections.length)return;
    if(savingSections.includes("contacts")){
      const primaryMobile=profile.contacts.contactMobile?.trim()??"";
      if(primaryMobile&&!/^\d{10}$/.test(primaryMobile)){
        setError("Primary contact mobile must contain exactly 10 digits.");return;
      }
      const phoneValue=(profile.contacts.contactPhone||profile.contacts.alternatePhone).trim();
      if(phoneValue&&(!/^\+?[0-9() -]+$/.test(phoneValue)||
        phoneValue.replace(/\D/g,"").length<10||
        phoneValue.replace(/\D/g,"").length>15)){
        setError("Additional phone must contain 10–15 digits.");return;
      }
      if(primaryMobile&&phoneValue.replace(/\D/g,"")===primaryMobile){
        setError("Additional phone must differ from the primary contact mobile.");return;
      }
    }
    // The schema validates the entire document. Feed it the latest saved
    // fields for cards we are not writing, so an unrelated unfinished draft
    // cannot block or accidentally persist this card's Save action.
    const submittingProfile:VersionedCollegeProfile={
      ...baseline,profileDocumentVersion:profile.profileDocumentVersion,
      ...(savingSections.includes("personal")?{
        displayName:profile.displayName,roleTitle:profile.roleTitle,
        about:profile.about,photoUrl:profile.photoUrl,
        personalDetails:profile.personalDetails,
      }:{}),
      ...(savingSections.includes("social")?{social:profile.social}:{}),
      ...(savingSections.includes("address")?{address:profile.address}:{}),
      ...(savingSections.includes("contacts")?{contacts:profile.contacts}:{}),
    };
    setSaving(true); setError(""); setSaved(false);
    try {
      const result = await apiFetch<{profile:VersionedCollegeProfile}>("/api/college/profile", {
        method: "PATCH", headers: { "content-type": "application/json" },
        // Only dirty profile cards replace stored cards. The server checks the
        // baseline under a row lock so concurrent updates to other cards survive.
        body: JSON.stringify({...submittingProfile,baseline,changedSections:savingSections}),
      });
      savedSnapshot.current=result.profile;
      // A card-level Save must never silently publish or discard edits made
      // earlier in another card. Only the selected section was written.
      // Overlay still-dirty drafts onto the fresh persisted version/CAS token.
      setProfile(current=>({
        ...result.profile,
        ...(!savingSections.includes("personal")&&changedSections.includes("personal")
          ? {displayName:current.displayName,roleTitle:current.roleTitle,
            about:current.about,photoUrl:current.photoUrl,
            personalDetails:current.personalDetails} : {}),
        ...(!savingSections.includes("social")&&changedSections.includes("social")
          ? {social:current.social} : {}),
        ...(!savingSections.includes("address")&&changedSections.includes("address")
          ? {address:current.address} : {}),
        ...(!savingSections.includes("contacts")&&changedSections.includes("contacts")
          ? {contacts:current.contacts} : {}),
      }));
      setSaved(true);setEditableSection(null);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : friendlyApiError({}));
    } finally { setSaving(false); }
  }
  return (
    <>
    <ConfirmDialog open={pendingNavigation!==null}
      onOpenChange={open=>{if(!open)setPendingNavigation(null);}}
      title="Discard your unsaved profile changes?"
      confirmLabel="Discard changes" cancelLabel="Keep editing"
      onConfirm={()=>{
        if(!pendingNavigation)return;
        const href=pendingNavigation;
        setPendingNavigation(null);
        router.push(href);
      }}>
      <p className="text-sm text-body">Navigating away will discard the unsaved profile edits.</p>
    </ConfirmDialog>
    <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
      title={discardSection?"Discard "+discardSection+" changes?":"Discard your unsaved profile changes?"}
      confirmLabel="Discard changes"
      cancelLabel="Keep editing" onConfirm={discard}>
      <p className="text-sm text-body">Any unsaved profile edits will be lost. Saved account identity remains unchanged.</p>
    </ConfirmDialog>
    <form ref={formRef} onSubmit={event => void submit(event)} aria-busy={saving}
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
          <p className="text-xs text-muted-foreground">Personal details are stored with your college profile, independently of login identity.</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="Name" value={profile.displayName} onChange={v => top("displayName", v)} disabled={editableSection!=="personal"} />
            <Field label="Role / Title" value={profile.roleTitle} onChange={v => top("roleTitle", v)} disabled={editableSection!=="personal"} />
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Gender
              <Select aria-label="Gender" className={fieldStyle} value={profile.personalDetails?.gender??""}
                disabled={editableSection!=="personal"} onChange={e=>personal("gender",e.target.value)}>
                <option value="">Select Gender</option>
                {["Male","Female","Other","Prefer not to say"].map(value=>
                  <option key={value} value={value}>{value}</option>)}
                {profile.personalDetails?.gender&&!["Male","Female","Other","Prefer not to say"].includes(profile.personalDetails.gender)?
                  <option value={profile.personalDetails.gender}>{profile.personalDetails.gender}</option>:null}
              </Select>
            </label>
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Date of Birth
              <Input type="date" aria-label="Date of Birth" className={fieldStyle}
                value={profile.personalDetails?.dateOfBirth??""}
                disabled={editableSection!=="personal"}
                onChange={e=>personal("dateOfBirth",e.target.value)} />
              <span className="text-xs font-normal text-muted-foreground">DD-MM-YYYY: {profile.personalDetails?.dateOfBirth?
                profile.personalDetails.dateOfBirth.split("-").reverse().join("-"):"Not specified"}</span>
            </label>
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Blood Group
              <Select aria-label="Blood Group" className={fieldStyle} value={profile.personalDetails?.bloodGroup??""}
                disabled={editableSection!=="personal"} onChange={e=>personal("bloodGroup",e.target.value)}>
                <option value="">Select Blood Group</option>
                {["A+","A-","B+","B-","AB+","AB-","O+","O-"].map(value=>
                  <option key={value} value={value}>{value}</option>)}
                {profile.personalDetails?.bloodGroup&&!["A+","A-","B+","B-","AB+","AB-","O+","O-"].includes(profile.personalDetails.bloodGroup)?
                  <option value={profile.personalDetails.bloodGroup}>{profile.personalDetails.bloodGroup}</option>:null}
              </Select>
            </label>
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">About
              <Textarea rows={3} maxLength={1000} className={fieldStyle}
                value={profile.about} disabled={readOnly||editableSection!=="personal"} onChange={e => top("about", e.target.value)} />
            </label>
            <div className="min-w-0 md:col-span-2">
              <Field label="Profile photo (HTTPS link)" value={profile.photoUrl}
                onChange={v => top("photoUrl", v)} disabled={readOnly||editableSection!=="personal"} maxLength={500} hint="Paste a secure image link. Direct photo upload requires the storage service." />
            </div>
          </div>
        </section>

        <section id="social" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 border-t border-border pt-6">
          {cardHeader("social","Social Profiles")}
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="LinkedIn" type="url" maxLength={500} value={profile.social.linkedIn}
              disabled={readOnly||editableSection!=="social"} onChange={v => detail("social", "linkedIn", v)} />
            <Field label="GitHub" type="url" maxLength={500} value={profile.social.github}
              disabled={readOnly||editableSection!=="social"} onChange={v => detail("social", "github", v)} />
            <Field label="Portfolio / Website" type="url" maxLength={500} value={profile.social.website}
              disabled={readOnly||editableSection!=="social"} onChange={v => detail("social", "website", v)} />
            <Field label="Instagram" type="url" maxLength={500} value={profile.social.instagram}
              disabled={readOnly||editableSection!=="social"} onChange={v => detail("social", "instagram", v)} />
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="Twitter / X" type="url" maxLength={500} value={profile.social.twitter??""}
              disabled={editableSection!=="social"} onChange={v=>detail("social","twitter",v)}/>
          </div>
        </section>

        <section id="address" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 border-t border-border pt-6">
          {cardHeader("address","Address")}
          <p className="text-xs text-muted-foreground">Current and Permanent addresses are saved independently. City, State and Pincode below are shared profile defaults.</p>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Current Address
              <Textarea rows={2} maxLength={2000} className={fieldStyle}
                disabled={editableSection!=="address"} value={profile.address.currentAddress??profile.address.line1}
                onChange={e=>detail("address","currentAddress",e.target.value)}/>
            </label>
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Permanent Address
              <Textarea rows={2} maxLength={2000} className={fieldStyle}
                disabled={editableSection!=="address"} value={profile.address.permanentAddress??profile.address.line2}
                onChange={e=>detail("address","permanentAddress",e.target.value)}/>
            </label>
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            {([
              ["line1", "Address line 1"], ["line2", "Address line 2"],
              ["city", "City"], ["state", "State"], ["postalCode", "Pincode"], ["country", "Country"],
            ] as const).map(([key, label]) => (
              <Field key={key} label={label} value={profile.address[key]} maxLength={key==="postalCode"?20:150}
                onChange={v => detail("address", key, v)} disabled={readOnly||editableSection!=="address"} />
            ))}
          </div>
        </section>
        <section id="contacts" className="min-w-0 scroll-mt-24 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-white p-4 border-t border-border pt-6">
          {cardHeader("contacts","Contacts")}
          <div className="min-w-0 space-y-1">
            <p className="text-xs text-muted-foreground">Login mobile and email require a separate verified account change. The profile contact number below does not change login credentials.</p>
            <p className="break-words text-sm leading-6 text-body [overflow-wrap:anywhere]">Email: {email || "Not provided"} · Mobile: {phone || "Not provided"}</p>
          </div>
          <div className="grid min-w-0 gap-4 md:grid-cols-2">
            <Field label="Primary contact mobile (10 digits)" type="tel" maxLength={10}
              placeholder="Primary Mobile Number (10 digits)"
              value={profile.contacts.contactMobile??""} disabled={editableSection!=="contacts"}
              onChange={v=>detail("contacts","contactMobile",v.replace(/\D/g,""))}/>
            <Field label="Additional email" type="email" maxLength={254} value={profile.contacts.alternateEmail} disabled={editableSection!=="contacts"}
              onChange={v => detail("contacts", "alternateEmail", v)} />
            <Field label="Additional phone" type="tel" maxLength={15}
              placeholder="Alternate Phone (Optional, 10-15 digits)"
              value={profile.contacts.contactPhone||profile.contacts.alternatePhone} disabled={editableSection!=="contacts"}
              onChange={additionalPhone} />
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
        <Button variant="secondary" type="button" disabled={readOnly||saving||!dirty}
          onClick={cancel} className="min-h-11 w-full md:w-auto md:min-h-9">
          Cancel
        </Button>
        <Button variant="primary" type="submit" disabled={readOnly||saving||!dirty} loading={saving}
          className="min-h-11 w-full md:min-h-9 md:w-auto md:shrink-0">
          {saving ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
    </>
  );
}
