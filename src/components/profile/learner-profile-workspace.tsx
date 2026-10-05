"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { LearnerProfileDocument } from "@/modules/people/profile-validation";

type CollectionKey =
  | "experiences"
  | "education"
  | "skills"
  | "projects"
  | "certifications"
  | "achievements"
  | "languages"
  | "extracurriculars"
  | "metadata";

type Field = {
  key: string;
  label: string;
  type?: "text" | "textarea" | "date" | "url" | "select";
  options?: string[];
};

const collectionLabels: Record<CollectionKey, string> = {
  experiences: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
  extracurriculars: "Extracurricular activities",
  metadata: "Additional information",
};

const fields: Record<CollectionKey, Field[]> = {
  experiences: [
    { key: "organization", label: "Organization" },
    { key: "designation", label: "Designation" },
    { key: "experienceType", label: "Experience type", type: "select", options: ["Full-time", "Part-time", "Internship", "Contract", "Freelance", "Other"] },
    { key: "location", label: "Location" },
    { key: "startDate", label: "Start date", type: "date" },
    { key: "endDate", label: "End date", type: "date" },
    { key: "compensation", label: "Compensation" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  education: [
    { key: "educationType", label: "Education type" },
    { key: "program", label: "Program" },
    { key: "specialization", label: "Specialization" },
    { key: "institution", label: "Institution" },
    { key: "startYear", label: "Start year" },
    { key: "endYear", label: "End year" },
    { key: "gradingType", label: "Grading type", type: "select", options: ["", "CGPA", "Percentage", "Grade"] },
    { key: "gradeObtained", label: "Grade obtained" },
    { key: "maxGrade", label: "Maximum grade" },
    { key: "qualifyingExam", label: "Qualifying exam" },
  ],
  skills: [
    { key: "name", label: "Skill" },
    { key: "proficiency", label: "Proficiency", type: "select", options: ["", "Beginner", "Intermediate", "Advanced", "Expert"] },
  ],
  projects: [
    { key: "name", label: "Project name" },
    { key: "githubUrl", label: "GitHub URL", type: "url" },
    { key: "projectUrl", label: "Project URL", type: "url" },
    { key: "description", label: "Description", type: "textarea" },
    { key: "skills", label: "Skills (comma-separated)" },
  ],
  certifications: [
    { key: "name", label: "Certification name" },
    { key: "issuingAuthority", label: "Issuing authority" },
    { key: "issueDate", label: "Issue date", type: "date" },
    { key: "expiryDate", label: "Expiry date", type: "date" },
    { key: "credentialUrl", label: "Credential URL", type: "url" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  achievements: [
    { key: "title", label: "Achievement title" },
    { key: "year", label: "Year" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  languages: [
    { key: "language", label: "Language" },
    { key: "proficiency", label: "Proficiency", type: "select", options: ["Beginner", "Intermediate", "Advanced", "Native"] },
  ],
  extracurriculars: [
    { key: "activity", label: "Activity" },
    { key: "year", label: "Year" },
    { key: "description", label: "Description", type: "textarea" },
  ],
  metadata: [
    { key: "key", label: "Field name" },
    { key: "type", label: "Type", type: "select", options: ["text", "long_text", "url", "boolean", "date"] },
    { key: "value", label: "Value", type: "textarea" },
  ],
};

function initials(name: string | null) {
  return (name || "Learner").split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
}

function hasText(value: unknown) {
  return typeof value === "string" && value.trim().length > 0;
}

function completion(document: LearnerProfileDocument) {
  const checks = [
    hasText(document.headline) || hasText(document.bio),
    Object.values(document.contacts).some(hasText),
    Object.values(document.socialProfiles).some(hasText),
    Object.values(document.address).some(hasText),
    Object.values(document.personalDetails).some(hasText),
    hasText(document.identity.aadhaarNumber) || hasText(document.identity.panNumber),
    document.experiences.length > 0,
    document.education.length > 0,
    document.skills.length > 0,
    document.projects.length > 0,
    document.certifications.length > 0,
    document.achievements.length > 0,
    document.languages.length > 0,
    document.extracurriculars.length > 0,
    document.hobbies.length > 0,
    document.metadata.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

function Card({ id, title, action, children }: { id?: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 text-base font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Value({ label, value }: { label: string; value: unknown }) {
  return (
    <div>
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-sm text-foreground">{value === null || value === undefined || value === "" ? "Not provided" : String(value)}</p>
    </div>
  );
}

function newItem(section: CollectionKey) {
  const item: Record<string, unknown> = { id: crypto.randomUUID() };
  for (const field of fields[section]) item[field.key] = field.key === "skills" ? [] : "";
  if (section === "experiences") {
    item.experienceType = "Full-time";
    item.currentlyWorking = false;
  }
  if (section === "languages") item.proficiency = "Intermediate";
  if (section === "education") item.examDetails = {};
  return item;
}

function itemTitle(section: CollectionKey, item: Record<string, unknown>) {
  const primary = item.name || item.title || item.organization || item.institution || item.language || item.activity || item.key || collectionLabels[section];
  const secondary = item.designation || item.program || item.issuingAuthority || item.proficiency || item.year || "";
  return { primary: String(primary), secondary: String(secondary) };
}

export function LearnerProfileWorkspace(props: {
  displayName: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  rollNumber: string | null;
  registrationNumber: string | null;
  initialDocument: LearnerProfileDocument;
}) {
  const { showToast } = useToast();
  const [document, setDocument] = useState(props.initialDocument);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState<LearnerProfileDocument>(props.initialDocument);
  const [collection, setCollection] = useState<CollectionKey | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<Record<string, unknown>>({});
  const [pending, startTransition] = useTransition();

  const percent = useMemo(
    () => completion(document),
    [document],
  );

  function saveDocument(next: LearnerProfileDocument, onDone?: () => void) {
    startTransition(async () => {
      const response = await fetch("/api/profile/me", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        showToast({ tone: "error", title: "Profile update failed", description: payload?.error || "Please review the fields and try again." });
        return;
      }
      setDocument(payload?.profile?.profileDocument || next);
      onDone?.();
      showToast({ tone: "success", title: "Profile updated" });
    });
  }

  function openCollection(section: CollectionKey, item?: Record<string, unknown>) {
    setCollection(section);
    setEditingId(item ? String(item.id) : null);
    setItemDraft(item ? { ...item } : newItem(section));
  }

  function saveCollection() {
    if (!collection) return;
    const normalized = {
      ...itemDraft,
      ...(collection === "projects"
        ? { skills: Array.isArray(itemDraft.skills) ? itemDraft.skills : String(itemDraft.skills || "").split(",").map((value) => value.trim()).filter(Boolean) }
        : {}),
    };
    const current = document[collection] as Array<Record<string, unknown>>;
    const nextItems = editingId
      ? current.map((item) => String(item.id) === editingId ? normalized : item)
      : [...current, normalized];

    saveDocument({ ...document, [collection]: nextItems } as LearnerProfileDocument, () => {
      setCollection(null);
      setEditingId(null);
      setItemDraft({});
    });
  }

  function removeItem(section: CollectionKey, id: string) {
    const current = document[section] as Array<Record<string, unknown>>;
    saveDocument({ ...document, [section]: current.filter((item) => String(item.id) !== id) } as LearnerProfileDocument);
  }


  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-border bg-surface p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-2xl font-semibold text-primary-text">{initials(props.displayName)}</div>
          <div className="min-w-0 flex-1">
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">Learner profile</p>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">{props.displayName || "Learner"}</h1>
            <p className="mt-1 text-sm text-body">{document.headline || "Add a headline to introduce yourself."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {props.rollNumber ? <StatusBadge>Roll {props.rollNumber}</StatusBadge> : null}
              {props.registrationNumber ? <StatusBadge>Reg {props.registrationNumber}</StatusBadge> : null}
              <StatusBadge tone={percent >= 80 ? "success" : percent >= 50 ? "warning" : "neutral"}>{percent}% complete</StatusBadge>
            </div>
          </div>
          <Button variant="secondary" onClick={() => { setDetailsDraft(document); setDetailsOpen(true); }}>Edit profile</Button>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="m-0 text-sm font-semibold text-foreground">Profile image</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Upload/replace remains blocked until the shared Cloud Storage profile-asset workflow is live.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="m-0 text-sm font-semibold text-foreground">Resume</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Upload/import/remove remains explicitly blocked until Cloud Storage signing and cleanup are live.</p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card id="contacts" title="Contacts">
          <div className="grid gap-4 sm:grid-cols-2">
            <Value label="Primary mobile" value={props.primaryPhone} />
            <Value label="Alternate phone" value={document.contacts.alternatePhone} />
            <Value label="Account email" value={props.primaryEmail} />
            <Value label="Contact email" value={document.contacts.contactEmail} />
          </div>
        </Card>
        <Card id="social-profiles" title="Social profiles">
          <div className="grid gap-4 sm:grid-cols-2">
            <Value label="LinkedIn" value={document.socialProfiles.linkedinUrl} />
            <Value label="GitHub" value={document.socialProfiles.githubUrl} />
            <Value label="Portfolio" value={document.socialProfiles.portfolioUrl} />
            <Value label="Twitter" value={document.socialProfiles.twitterUrl} />
            <Value label="Google Scholar" value={document.socialProfiles.googleScholarUrl} />
            <Value label="ResearchGate" value={document.socialProfiles.researchGateUrl} />
          </div>
        </Card>
        <Card id="address" title="Address">
          <div className="grid gap-4 sm:grid-cols-2">
            <Value label="Current address" value={document.address.currentAddress} />
            <Value label="City" value={document.address.city} />
            <Value label="State" value={document.address.state} />
            <Value label="Pincode" value={document.address.pincode} />
            <Value label="Permanent address" value={document.address.permanentAddress} />
          </div>
        </Card>
        <Card id="personal-details" title="Personal details">
          <div className="grid gap-4 sm:grid-cols-3">
            <Value label="Gender" value={document.personalDetails.gender} />
            <Value label="Date of birth" value={document.personalDetails.dateOfBirth} />
            <Value label="Blood group" value={document.personalDetails.bloodGroup} />
          </div>
        </Card>
        <Card id="identity" title="Identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Value label="Aadhaar number" value={document.identity.aadhaarNumber ? "•••• •••• " + document.identity.aadhaarNumber.slice(-4) : ""} />
            <Value label="PAN number" value={document.identity.panNumber ? document.identity.panNumber.slice(0, 2) + "••••••" + document.identity.panNumber.slice(-2) : ""} />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Aadhaar/PAN files remain blocked on secure Cloud Storage; saved numbers are masked in the UI.</p>
        </Card>
        <Card id="hobbies" title="Hobbies">
          {document.hobbies.length ? <div className="flex flex-wrap gap-2">{document.hobbies.map((hobby) => <StatusBadge key={hobby}>{hobby}</StatusBadge>)}</div> : <p className="m-0 text-sm text-muted-foreground">No hobbies added yet.</p>}
        </Card>
      </div>

      {(Object.keys(collectionLabels) as CollectionKey[]).map((section) => {
        const items = document[section] as Array<Record<string, unknown>>;
        return (
          <Card key={section} id={section} title={collectionLabels[section]} action={<Button size="sm" onClick={() => openCollection(section)}>Add</Button>}>
            {items.length ? (
              <div className="space-y-2">
                {items.map((item) => {
                  const summary = itemTitle(section, item);
                  return (
                    <div key={String(item.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface-subtle p-4">
                      <div>
                        <p className="m-0 text-sm font-semibold text-foreground">{summary.primary}</p>
                        {summary.secondary ? <p className="mt-1 text-xs text-muted-foreground">{summary.secondary}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => openCollection(section, item)}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => removeItem(section, String(item.id))}>Delete</Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : <p className="m-0 text-sm text-muted-foreground">No entries yet.</p>}
          </Card>
        );
      })}



      <Dialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        title="Edit learner profile"
        description="Account phone/email stay authoritative. These are your self-service profile fields."
        footer={<><Button variant="secondary" disabled={pending} onClick={() => setDetailsOpen(false)}>Cancel</Button><Button disabled={pending} onClick={() => saveDocument(detailsDraft, () => setDetailsOpen(false))}>{pending ? "Saving…" : "Save profile"}</Button></>}
      >
        <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
          <fieldset className="grid gap-4">
            <legend className="text-sm font-semibold text-foreground">About</legend>
            <label className="text-xs font-semibold text-body">Headline<Input className="mt-1.5" value={detailsDraft.headline} onChange={(event) => setDetailsDraft({ ...detailsDraft, headline: event.target.value })} /></label>
            <label className="text-xs font-semibold text-body">About<Textarea className="mt-1.5" value={detailsDraft.bio} onChange={(event) => setDetailsDraft({ ...detailsDraft, bio: event.target.value })} /></label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="text-sm font-semibold text-foreground">Contacts</legend>
            <label className="text-xs font-semibold text-body">Alternate phone<Input className="mt-1.5" value={detailsDraft.contacts.alternatePhone} onChange={(event) => setDetailsDraft({ ...detailsDraft, contacts: { ...detailsDraft.contacts, alternatePhone: event.target.value } })} /></label>
            <label className="text-xs font-semibold text-body">Contact email<Input className="mt-1.5" type="email" value={detailsDraft.contacts.contactEmail} onChange={(event) => setDetailsDraft({ ...detailsDraft, contacts: { ...detailsDraft.contacts, contactEmail: event.target.value } })} /></label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="text-sm font-semibold text-foreground">Social profiles</legend>
            {([
              ["linkedinUrl", "LinkedIn"],
              ["githubUrl", "GitHub"],
              ["portfolioUrl", "Portfolio"],
              ["twitterUrl", "Twitter"],
              ["googleScholarUrl", "Google Scholar"],
              ["researchGateUrl", "ResearchGate"],
            ] as const).map(([key, label]) => <label key={key} className="text-xs font-semibold text-body">{label}<Input className="mt-1.5" type="url" value={detailsDraft.socialProfiles[key]} onChange={(event) => setDetailsDraft({ ...detailsDraft, socialProfiles: { ...detailsDraft.socialProfiles, [key]: event.target.value } })} /></label>)}
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="text-sm font-semibold text-foreground">Address</legend>
            <label className="text-xs font-semibold text-body">Current address<Textarea className="mt-1.5" value={detailsDraft.address.currentAddress} onChange={(event) => setDetailsDraft({ ...detailsDraft, address: { ...detailsDraft.address, currentAddress: event.target.value } })} /></label>
            <div className="grid gap-4 sm:grid-cols-3">
              {(["city", "state", "pincode"] as const).map((key) => <label key={key} className="text-xs font-semibold capitalize text-body">{key}<Input className="mt-1.5" value={detailsDraft.address[key]} onChange={(event) => setDetailsDraft({ ...detailsDraft, address: { ...detailsDraft.address, [key]: event.target.value } })} /></label>)}
            </div>
            <label className="text-xs font-semibold text-body">Permanent address<Textarea className="mt-1.5" value={detailsDraft.address.permanentAddress} onChange={(event) => setDetailsDraft({ ...detailsDraft, address: { ...detailsDraft.address, permanentAddress: event.target.value } })} /></label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-3">
            <legend className="text-sm font-semibold text-foreground">Personal details</legend>
            <label className="text-xs font-semibold text-body">Gender<Select className="mt-1.5" value={detailsDraft.personalDetails.gender} onChange={(event) => setDetailsDraft({ ...detailsDraft, personalDetails: { ...detailsDraft.personalDetails, gender: event.target.value as LearnerProfileDocument["personalDetails"]["gender"] } })}>{["", "Male", "Female", "Other", "Prefer not to say"].map((value) => <option key={value || "none"} value={value}>{value || "Not specified"}</option>)}</Select></label>
            <label className="text-xs font-semibold text-body">Date of birth<Input className="mt-1.5" type="date" value={detailsDraft.personalDetails.dateOfBirth} onChange={(event) => setDetailsDraft({ ...detailsDraft, personalDetails: { ...detailsDraft.personalDetails, dateOfBirth: event.target.value } })} /></label>
            <label className="text-xs font-semibold text-body">Blood group<Select className="mt-1.5" value={detailsDraft.personalDetails.bloodGroup} onChange={(event) => setDetailsDraft({ ...detailsDraft, personalDetails: { ...detailsDraft.personalDetails, bloodGroup: event.target.value as LearnerProfileDocument["personalDetails"]["bloodGroup"] } })}>{["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => <option key={value || "none"} value={value}>{value || "Not specified"}</option>)}</Select></label>
          </fieldset>

          <fieldset className="grid gap-4 sm:grid-cols-2">
            <legend className="text-sm font-semibold text-foreground">Identity</legend>
            <label className="text-xs font-semibold text-body">Aadhaar number<Input className="mt-1.5" value={detailsDraft.identity.aadhaarNumber} onChange={(event) => setDetailsDraft({ ...detailsDraft, identity: { ...detailsDraft.identity, aadhaarNumber: event.target.value } })} /></label>
            <label className="text-xs font-semibold text-body">PAN number<Input className="mt-1.5" value={detailsDraft.identity.panNumber} onChange={(event) => setDetailsDraft({ ...detailsDraft, identity: { ...detailsDraft.identity, panNumber: event.target.value } })} /></label>
          </fieldset>

          <label className="block text-xs font-semibold text-body">Hobbies · comma-separated<Textarea className="mt-1.5" value={detailsDraft.hobbies.join(", ")} onChange={(event) => setDetailsDraft({ ...detailsDraft, hobbies: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} /></label>
        </div>
      </Dialog>

      <Dialog
        open={collection !== null}
        onOpenChange={(open) => { if (!open) { setCollection(null); setEditingId(null); setItemDraft({}); } }}
        title={collection ? (editingId ? "Edit " : "Add ") + collectionLabels[collection] : "Edit profile entry"}
        footer={<><Button variant="secondary" disabled={pending} onClick={() => { setCollection(null); setEditingId(null); setItemDraft({}); }}>Cancel</Button><Button disabled={pending} onClick={saveCollection}>{pending ? "Saving…" : "Save"}</Button></>}
      >
        {collection ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {fields[collection].map((field) => {
              const raw = itemDraft[field.key];
              const value = field.key === "skills" && Array.isArray(raw) ? raw.join(", ") : String(raw || "");
              if (field.type === "textarea") return <label key={field.key} className="text-xs font-semibold text-body sm:col-span-2">{field.label}<Textarea className="mt-1.5" value={value} onChange={(event) => setItemDraft({ ...itemDraft, [field.key]: event.target.value })} /></label>;
              if (field.type === "select") return <label key={field.key} className="text-xs font-semibold text-body">{field.label}<Select className="mt-1.5" value={value} onChange={(event) => setItemDraft({ ...itemDraft, [field.key]: event.target.value })}>{field.options?.map((option) => <option key={option || "none"} value={option}>{option || "Not specified"}</option>)}</Select></label>;
              return <label key={field.key} className="text-xs font-semibold text-body">{field.label}<Input className="mt-1.5" type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"} value={value} onChange={(event) => setItemDraft({ ...itemDraft, [field.key]: event.target.value })} /></label>;
            })}
            {collection === "experiences" ? <label className="flex items-center gap-2 text-sm text-body sm:col-span-2"><input type="checkbox" checked={Boolean(itemDraft.currentlyWorking)} onChange={(event) => setItemDraft({ ...itemDraft, currentlyWorking: event.target.checked, ...(event.target.checked ? { endDate: "" } : {}) })} />I currently work here</label> : null}
          </div>
        ) : null}
      </Dialog>


    </div>
  );
}
