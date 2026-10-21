"use client";
import {LEARNER_EDUCATION_TYPES,learnerQualifyingExamSuggestions,LEARNER_QUALIFYING_EXAM_DETAILS,learnerEducationValidationProblem} from "@/modules/people/learner-education-picker-model";
import {LearnerSkillCatalogInput} from "@/components/profile/learner-skill-catalog-input";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {useRouter} from "next/navigation";
import { learnerProfileCollectionMayEdit } from "@/modules/people/learner-profile-collection-busy-model";
import { learnerProfileDeletePrompt } from "@/modules/people/learner-profile-delete-confirm-model";
import {learnerProfileCanRefresh,learnerProfileReconcile} from "@/modules/people/learner-profile-refresh-model";
import Link from "next/link";
import { learnerProfileChecklist, type LearnerProfileSection } from "@/modules/people/learner-profile-checklist";
import {learnerProfileCareerCoverage,learnerCareerCompletionMessage} from "@/modules/people/learner-profile-career-coverage-model";
import {learnerProfilePublicationsAwards,newLearnerShowcaseEntry,isLearnerShowcaseKey,type LearnerShowcaseKind,type LearnerShowcaseDetails} from "@/modules/people/learner-profile-publications-awards-model";
import {learnerProfileMobileQuickLinks} from "@/modules/people/learner-profile-mobile-model";
import {learnerProfileSocialFocusField} from "@/modules/people/learner-profile-social-connect-model";
import { learnerContactEditSchema } from "@/modules/people/learner-contact-model";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ThirdPartyLink } from "@/components/ui/third-party-link";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { learnerProfileDocumentSchema, type LearnerProfileDocument } from "@/modules/people/profile-validation";

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
  education: "Education/Qualification",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Academic Achievements",
  languages: "Languages",
  extracurriculars: "Extra-curricular Activities",
  metadata: "Additional Information",
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


function Card({ id, title, action, children }: { id?: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="min-w-0 scroll-mt-24 border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="m-0 min-w-0 break-words text-base font-semibold text-foreground">{title}</h2>
        {action}
      </div>
      <div className="mt-4 min-w-0">{children}</div>
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
  if (section === "education") {item.examDetails = {};item.isCurrentlyPursuing = false;item.isRecentEducation = false;}
  if (section === "metadata") item.type = "text";
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
  initialSection?: LearnerProfileSection | null;
}) {
  const router=useRouter();
  // Draft stays mounted until the native-accessible confirmation resolves.
  const [pendingPrompt,setPendingPrompt]=useState<{message:string;resolve:(accepted:boolean)=>void}|null>(null);
  function askConfirm(message:string):Promise<boolean>{
    return new Promise(resolve=>setPendingPrompt({message,resolve}));
  }
  function completePrompt(accepted:boolean){
    const current=pendingPrompt;
    setPendingPrompt(null);
    current?.resolve(accepted);
  }

  const lastRefreshAt=useRef(0);
  const serverSnapshot=useRef(props.initialDocument);
  const { showToast } = useToast();
  const [document, setDocument] = useState(props.initialDocument);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsDraft, setDetailsDraft] = useState<LearnerProfileDocument>(props.initialDocument);
  const [detailsBaseline,setDetailsBaseline]=useState<LearnerProfileDocument>(props.initialDocument);
  const [contactOpen, setContactOpen] = useState(false);
  const [contactDraft, setContactDraft] = useState(props.initialDocument.contacts);
  const [contactPending, setContactPending] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [collection, setCollection] = useState<CollectionKey | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemDraft, setItemDraft] = useState<Record<string, unknown>>({});
  const [itemBaseline,setItemBaseline]=useState<Record<string,unknown>>({});
  const [educationError,setEducationError] = useState<string|null>(null);
  const [refreshError,setRefreshError] = useState(false);
  const [showcaseDraft,setShowcaseDraft]=useState<(LearnerShowcaseDetails & {id: string | null;kind:LearnerShowcaseKind})|null>(null);
  const [showcaseError,setShowcaseError]=useState<string|null>(null);
  const [showcaseBaseline,setShowcaseBaseline]=useState<string|null>(null);
  const [jobPrefsEditing,setJobPrefsEditing]=useState(false);
  const [jobPrefsDraft,setJobPrefsDraft]=useState(props.initialDocument.jobPreferences);
  const [rolePrefsInput,setRolePrefsInput]=useState(props.initialDocument.jobPreferences.rolePreferences.join("\n"));
  const {pending,run:guardedRun}=useGuardedAction();

  const checklist = useMemo(
    () => learnerProfileChecklist(document),
    [document],
  );
  const coverage=learnerProfileCareerCoverage(checklist);
  const percent=coverage.percentage??0;
  const authoredPublicationsAwards=learnerProfilePublicationsAwards(document);
  const mobileQuickLinks=learnerProfileMobileQuickLinks(checklist.items);

  // Preserve unsaved local edits; adopt a new server snapshot only when
  // the on-screen document was still equal to the previous saved snapshot.
  useEffect(()=>{
    const previous=serverSnapshot.current;
    const next=props.initialDocument;
    if(JSON.stringify(previous)===JSON.stringify(next))return;
    // Defer React state synchronization to the next paint rather than
    // synchronously setting state in an effect (React 19 hooks lint).
    const frame=window.requestAnimationFrame(()=>{
      setDocument(local=>learnerProfileReconcile(local,previous,next));
    });
    serverSnapshot.current=next;
    return ()=>window.cancelAnimationFrame(frame);
  },[props.initialDocument]);

  useEffect(()=>{
    const onVisible=()=>{
      if(!learnerProfileCanRefresh({
        visible:window.document.visibilityState==="visible",
        editing:detailsOpen||contactOpen||collection!==null||jobPrefsEditing||showcaseDraft!==null,
        saving:pending||contactPending,
        nowMs:Date.now(),lastRefreshMs:lastRefreshAt.current,
      }))return;
      lastRefreshAt.current=Date.now();
      router.refresh();
    };
    window.document.addEventListener("visibilitychange",onVisible);
    return ()=>window.document.removeEventListener("visibilitychange",onVisible);
  },[router,detailsOpen,contactOpen,collection,pending,contactPending,jobPrefsEditing,showcaseDraft]);

  // Guard the whole page as well as dialog Cancel. A browser reload cannot
  // safely preserve edits that exist only in local component state.
  useEffect(()=>{
    const dirty=(detailsOpen&&JSON.stringify(detailsDraft)!==JSON.stringify(detailsBaseline))||
      (contactOpen&&JSON.stringify(contactDraft)!==JSON.stringify(document.contacts))||
      (collection!==null&&JSON.stringify(itemDraft)!==JSON.stringify(itemBaseline))||
      (jobPrefsEditing&&(JSON.stringify(jobPrefsDraft)!==JSON.stringify(document.jobPreferences)||
        rolePrefsInput!==document.jobPreferences.rolePreferences.join("\n")))||
      (showcaseDraft!==null&&JSON.stringify(showcaseDraft)!==showcaseBaseline);
    if(!dirty)return;
    const warn=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue="";};
    window.addEventListener("beforeunload",warn);
    return ()=>window.removeEventListener("beforeunload",warn);
  },[detailsOpen,detailsDraft,detailsBaseline,contactOpen,contactDraft,
    collection,itemDraft,itemBaseline,jobPrefsEditing,jobPrefsDraft,rolePrefsInput,document.contacts,document.jobPreferences,showcaseDraft,showcaseBaseline]);

  useEffect(() => {
    if (!props.initialSection) return;
    const target = window.document.getElementById(props.initialSection);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [props.initialSection]);

  useEffect(()=>{
    if(!detailsOpen)return;
    const field=learnerProfileSocialFocusField(props.initialSection);
    if(!field)return;
    const frame=window.requestAnimationFrame(()=>{
      window.document.querySelector<HTMLInputElement>(
        '[data-learner-social-link="'+field+'"]',
      )?.focus();
    });
    return ()=>window.cancelAnimationFrame(frame);
  },[detailsOpen,props.initialSection]);

  function saveDocument(next: LearnerProfileDocument, onDone?: () => void, expectedDocument=document,
    successTitle: "Added successfully" | "Updated successfully" | "Deleted successfully" = "Updated successfully") {
    void guardedRun(async () => {
      try {
        const payload=await apiFetch<{profile:{profileDocument:LearnerProfileDocument}}>("/api/profile/me",{
          method:"PUT",headers:{"content-type":"application/json"},
          body:JSON.stringify({document:next,expectedDocument}),
        });
        if(!payload?.profile?.profileDocument)
          throw new Error("Could not confirm the saved profile. Reload before trying again.");
        setDocument(payload.profile.profileDocument);
        onDone?.();
        showToast({ tone: "success", title: successTitle });
      } catch(error) {
        if(error instanceof FriendlyFetchError && error.status===409)router.refresh();
        const message=error instanceof FriendlyFetchError && error.status===409
          ?"Your saved profile changed in another tab. Your draft was kept. Close this editor and reopen it to review the latest version before saving."
          :error instanceof Error?error.message:"Please try again.";
        showToast({tone:"error",title:"Profile update failed",description:message});
      }
    });
  }

  function openDetails(){
    setDetailsDraft(document);
    setDetailsBaseline(document);
    setDetailsOpen(true);
  }

  async function closeDetails() {
    if(pending)return;
    if(JSON.stringify(detailsDraft)!==JSON.stringify(detailsBaseline)&&
      !(await askConfirm("Discard profile changes?")))return;
    setDetailsOpen(false);
  }

  async function closeCollection() {
    if(pending)return;
    if(JSON.stringify(itemDraft)!==JSON.stringify(itemBaseline)&&
      !(await askConfirm("Discard your changes?")))return;
    setCollection(null);
    setEditingId(null);
    setItemDraft({});
    setItemBaseline({});
  }

  async function closeContacts(){
    if(contactPending)return;
    if(JSON.stringify(contactDraft)!==JSON.stringify(document.contacts)&&
       !(await askConfirm("Discard contact changes?")))return;
    setContactOpen(false);
    setContactError(null);
  }

  async function closeJobPreferences(){
    if(pending)return;
    if((JSON.stringify(jobPrefsDraft)!==JSON.stringify(document.jobPreferences)||
      rolePrefsInput!==document.jobPreferences.rolePreferences.join("\n"))&&
       !(await askConfirm("Discard job preference changes?")))return;
    setJobPrefsEditing(false);
  }

  function openContacts() {
    setContactDraft({ ...document.contacts });
    setContactError(null);
    setContactOpen(true);
  }

  async function saveContacts() {
    if (contactPending) return;
    const alternate=contactDraft.alternatePhone.replace(/\D/g,"");
    const primary=(props.primaryPhone??"").replace(/\D/g,"").slice(-10);
    if(alternate&&(alternate.length<10||alternate.length>15)){
      setContactError("Alternate phone number must be 10 to 15 digits");
      return;
    }
    if(primary&&alternate.slice(-10)===primary){
      setContactError("Alternate phone number cannot be the same as primary mobile number");
      return;
    }
    const parsed = learnerContactEditSchema.safeParse({
      confirmed: true, contacts: contactDraft, expectedContacts: document.contacts,
    });
    if (!parsed.success) {
      setContactError(parsed.error.issues[0]?.message ?? "Check your contact details.");
      return;
    }
    setContactPending(true);
    setContactError(null);
    try {
      const payload=await apiFetch<{contacts:LearnerProfileDocument["contacts"]}>("/api/profile/me/contacts",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify(parsed.data),
      });
      if(!payload?.contacts)throw new Error("Contact details could not be saved. Your existing details are unchanged.");
      const savedContacts = learnerProfileDocumentSchema.parse({ contacts: payload.contacts }).contacts;
      setDocument(current => ({ ...current, contacts: savedContacts }));
      setDetailsDraft(current => ({ ...current, contacts: savedContacts }));
      setContactOpen(false);
      showToast({ tone: "success", title: "Saved" });
    } catch (error) {
      if(error instanceof FriendlyFetchError && error.status===409)router.refresh();
      const message=error instanceof FriendlyFetchError
        ?error.code==="ALTERNATE_PHONE_SAME_AS_PRIMARY"?"Alternate phone number cannot be the same as primary mobile number"
        :error.code==="ALTERNATE_PHONE_INVALID"?"Alternate phone number must be 10 to 15 digits"
        :error.status===409?"These contact details were updated in another tab. Review the latest saved values before retrying."
        :error.message
        :error instanceof Error?error.message:"Could not save contact details.";
      setContactError(message);
    } finally {
      setContactPending(false);
    }
  }

  function openCollection(section: CollectionKey, item?: Record<string, unknown>) {
    if(!learnerProfileCollectionMayEdit(pending,contactPending))return;
    const initial = item ? {...item} : newItem(section);
    setCollection(section);
    setEditingId(item ? String(item.id) : null);
    if (section === "education" && !item && document.education.length === 0) {
      initial.isRecentEducation = true;
    }
    setEducationError(null);
    setItemDraft(initial);
    setItemBaseline(initial);
  }

  function openShowcase(kind: LearnerShowcaseKind, entry?: LearnerShowcaseDetails & {id:string}) {
    if(!learnerProfileCollectionMayEdit(pending,contactPending))return;
    setShowcaseError(null);
    const initial={
      kind, id:entry?.id??null, title:entry?.title??"",
      organization:entry?.organization??"", date:entry?.date??"",
      url:entry?.url??"", description:entry?.description??"",
    };
    setShowcaseDraft(initial);
    setShowcaseBaseline(JSON.stringify(initial));
  }

  async function closeShowcase(){
    if(pending)return;
    if(showcaseDraft&&JSON.stringify(showcaseDraft)!==showcaseBaseline&&
       !(await askConfirm("Discard your award or publication edits?")))return;
    setShowcaseDraft(null);setShowcaseError(null);setShowcaseBaseline(null);
  }

  function saveShowcase() {
    if(!showcaseDraft||pending)return;
    const {kind,id,...fields}=showcaseDraft;
    if(!fields.title.trim()){setShowcaseError(kind==="award"?"Award title is required":"Publication title is required");return;}
    if(fields.url.trim()) {
      try {
        const parsed = new URL(fields.url.trim());
        if(parsed.protocol!=="https:"&&parsed.protocol!=="http:")throw new Error();
      }catch{setShowcaseError("Enter a valid http or https URL");return;}
    }
    const record=newLearnerShowcaseEntry(id??crypto.randomUUID(),kind,{
      title:fields.title.trim(),organization:fields.organization.trim(),
      date:fields.date,url:fields.url.trim(),description:fields.description.trim(),
    });
    if(record.value.length>5000){setShowcaseError("Please shorten this entry.");return;}
    const next=id
      ?document.metadata.map(item=>item.id===id?record:item)
      :[...document.metadata,record];
    saveDocument({...document,metadata:next},()=>{setShowcaseDraft(null);setShowcaseError(null);},
      document,id?"Updated successfully":"Added successfully");
  }

  async function deleteShowcase(kind:LearnerShowcaseKind,id:string) {
    if(pending||!(await askConfirm(kind==="award"?"Delete this award?":"Delete this publication?")))return;
    const next=document.metadata.filter(item=>item.id!==id);
    saveDocument({...document,metadata:next},undefined,document,"Deleted successfully");
  }

  function saveOwnedSection(
    section: "education" | "skills" | "projects",
    items: LearnerProfileDocument[typeof section],
    onDone?: () => void,
    successTitle: "Added" | "Saved" | "Removed" = "Saved",
  ) {
    void guardedRun(async () => {
      try {
        const payload=await apiFetch<{items:unknown[]}>("/api/profile/me/sections",{
          method:"PATCH",headers:{"content-type":"application/json"},
          body:JSON.stringify({confirmed:true,section,items,expectedItems:document[section]}),
        });
        if(!Array.isArray(payload?.items))
          throw new Error("Could not save this section; other profile details were not changed.");
        setDocument(current => ({ ...current, [section]: payload.items }));
        onDone?.();
        showToast({ tone:"success",title:successTitle });
      } catch (error) {
        if(error instanceof FriendlyFetchError && error.status===409)router.refresh();
        const message=error instanceof FriendlyFetchError && error.status===409
          ?"This section changed in another tab. Review the latest saved version before retrying."
          :error instanceof Error?error.message:"Try again.";
        showToast({ tone:"error",title:"Section update failed",description:message });
      }
    });
  }

  function saveCollection() {
    if (!collection) return;
    if(collection==="education"){
      if (Boolean(itemDraft.isRecentEducation) && document.education.some(entry =>
        entry.id !== editingId && entry.isRecentEducation)) {
        setEducationError("Select only one recent education");
        return;
      }
      const issue=learnerEducationValidationProblem({
        educationType:String(itemDraft.educationType??""),
        institution:String(itemDraft.institution??""),
        gradingType:String(itemDraft.gradingType??""),
        gradeObtained:String(itemDraft.gradeObtained??""),
        maxGrade:String(itemDraft.maxGrade??""),
        startYear:String(itemDraft.startYear??""),
        endYear:String(itemDraft.endYear??""),
        isCurrentlyPursuing:Boolean(itemDraft.isCurrentlyPursuing),
        examDetails:(itemDraft.examDetails && typeof itemDraft.examDetails==="object" && !Array.isArray(itemDraft.examDetails))
          ?itemDraft.examDetails as Record<string,string|number|boolean>:undefined,
      });
      if(issue){setEducationError(issue.message);return;}
      setEducationError(null);
    }
    const normalized = {
      ...itemDraft,
      ...(collection === "education" && Boolean(itemDraft.isCurrentlyPursuing) ? {endYear:""} : {}),
      ...(collection === "projects"
        ? { skills: Array.isArray(itemDraft.skills) ? itemDraft.skills : String(itemDraft.skills || "").split(",").map((value) => value.trim()).filter(Boolean) }
        : {}),
    };
    const current = document[collection] as Array<Record<string, unknown>>;
    const nextItems = editingId
      ? current.map((item) => String(item.id) === editingId ? normalized : item)
      : [...current, normalized];

    const finished = () => { setCollection(null); setEditingId(null); setItemDraft({}); };
    if (collection === "education" || collection === "skills" || collection === "projects") {
      saveOwnedSection(collection, nextItems as LearnerProfileDocument[typeof collection], finished,
        editingId ? "Saved" : "Added");
    } else {
      saveDocument({ ...document, [collection]: nextItems } as LearnerProfileDocument,
        finished, document, editingId ? "Updated successfully" : "Added successfully");
    }
  }

  async function removeItem(section: CollectionKey, id: string) {
    if(!learnerProfileCollectionMayEdit(pending,contactPending))return;
    const current = document[section] as Array<Record<string, unknown>>;
    const confirmation=learnerProfileDeletePrompt(section,
      current.some(item=>String(item.id)===id));
    if(!confirmation || !(await askConfirm(confirmation)))return;
    const items = current.filter((item) => String(item.id) !== id);
    if (section === "education" || section === "skills" || section === "projects") {
      saveOwnedSection(section, items as LearnerProfileDocument[typeof section], undefined, "Removed");
    } else {
      saveDocument({ ...document, [section]: items } as LearnerProfileDocument,
        undefined, document, "Deleted successfully");
    }
  }


  return (
    <div className="min-w-0 space-y-5">
      <nav aria-label="Quick access to unfinished profile sections" className="min-w-0 border-b border-border pb-3 md:hidden">
        <h2 className="text-sm font-semibold text-foreground">Quick profile steps</h2>
        <p className="mt-1 text-xs text-body">Jump to an unfinished saved-profile section. These are suggestions, not verification requirements.</p>
        {mobileQuickLinks.length ? <div className="mt-3 grid grid-cols-2 gap-2">
          {mobileQuickLinks.map(item=><Link key={item.section}
            href={"/learn/profile?section="+encodeURIComponent(item.section)}
            className="flex min-h-11 md:min-h-9 min-w-0 items-center justify-center rounded-[var(--lms-control-radius,9px)] border border-border px-2 py-2 text-center text-xs font-[650] text-primary-text break-words">
            {item.label}
          </Link>)}
        </div> : <p className="mt-2 text-sm text-body">All suggested career sections have saved entries.</p>}
      </nav>
      <div className="flex flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-xs text-muted-foreground">Saved profile data refreshes when you return to this tab.</p>
        <Button className="w-full sm:w-auto" size="sm" variant="secondary" disabled={detailsOpen||contactOpen||collection!==null||pending||contactPending}
          onClick={async ()=>{
            lastRefreshAt.current=Date.now();
            try {
              await apiFetch<unknown>("/api/profile/me");
              setRefreshError(false);
              router.refresh();
            } catch {setRefreshError(true);}
          }}>
          Refresh saved profile
        </Button>
      </div>
      {refreshError ? <div role="alert" className="rounded-[var(--lms-control-radius)] border border-border p-3 text-sm text-body">
        <p className="font-semibold">Couldn't refresh profile</p>
        <p>Showing the last profile we loaded.</p>
      </div> : null}
      <section id="profile-introduction" className="scroll-mt-24 border-b border-border pb-5">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[50%] bg-primary-subtle text-2xl font-semibold text-primary-text">{initials(props.displayName)}</div>
          <div className="min-w-0 flex-1">
            <h2 className="m-0 min-w-0 break-words text-[var(--lms-font-lg)] font-semibold leading-[1.35] text-[var(--lms-heading)]">{props.displayName || "Learner"}</h2>
            <p className="mt-[var(--lms-space-1)] min-w-0 break-words text-[13px] leading-5 text-[var(--lms-body-text)]">{document.headline || "Add a headline to introduce yourself."}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {props.rollNumber ? <StatusBadge>Roll {props.rollNumber}</StatusBadge> : null}
              {props.registrationNumber ? <StatusBadge>Reg {props.registrationNumber}</StatusBadge> : null}
              <StatusBadge tone={percent >= 80 ? "success" : percent >= 50 ? "warning" : "neutral"}>{percent}% complete</StatusBadge>
            </div>
          </div>
          <Button className="w-full md:w-auto" variant="primary" onClick={openDetails}>Edit profile</Button>
        </div>
        <details className="mt-4 border-t border-border pt-2">
          <summary className="flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Profile image and resume availability</summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="min-w-0 border-t border-border pt-3">
            <p className="m-0 text-sm font-semibold text-foreground">Profile image</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Upload/replace remains blocked until the shared Cloud Storage profile-asset workflow is live.</p>
          </div>
          <div className="min-w-0 border-t border-border pt-3">
            <p className="m-0 text-sm font-semibold text-foreground">Resume</p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Upload/import/remove remains explicitly blocked until Cloud Storage signing and cleanup are live.</p>
          </div>
        </div>
        </details>
      </section>

      <section className="min-w-0 border-b border-border pb-4" aria-labelledby="learner-profile-checklist-title">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="learner-profile-checklist-title" className="text-base font-semibold text-foreground">
            Profile completion checklist
          </h2>
          <Link href="/learn/profile/completeness" className="inline-flex min-h-11 md:min-h-9 items-center text-sm font-semibold text-primary-text underline focus-visible:underline">
            Review full checklist
          </Link>
          <div className="flex items-center gap-3" aria-label={percent+" percent complete"}>
            <svg viewBox="0 0 64 64" width="64" height="64" role="img" aria-label={percent+"% complete"}>
              <circle cx="32" cy="32" r="26" fill="none" strokeWidth="7"
                className="stroke-border"/>
              <circle cx="32" cy="32" r="26" fill="none" strokeWidth="7" strokeLinecap="round"
                className="stroke-primary" pathLength="100"
                strokeDasharray={String(percent)+" 100"} transform="rotate(-90 32 32)"/>
              <text x="32" y="36" textAnchor="middle" className="fill-foreground"
                fontSize="15" fontWeight="700">{percent}%</text>
            </svg>
            <div className="flex flex-wrap gap-2">
              <StatusBadge tone="success">{coverage.completed} Completed</StatusBadge>
              <StatusBadge tone="neutral">{coverage.total-coverage.completed} Remaining</StatusBadge>
            </div>
          </div>
        </div>
        <p className="mt-2 text-sm font-semibold text-foreground">{learnerCareerCompletionMessage(percent)}</p>
        <p className="mt-2 text-sm text-body">
          This reflects fields saved in your profile, not verification or placement eligibility.
          Sensitive identity information is optional and excluded from this career-profile score. Select a section to review or edit it.
        </p>
        {coverage.next ? (
          <p role="status" className="mt-3 text-sm text-body">
            Suggested next section:{" "}
            <Link href={"/learn/profile?section="+encodeURIComponent(coverage.next.section)}
              className="font-semibold text-primary-text underline max-[767px]:inline-flex max-[767px]:min-h-11 max-[767px]:items-center focus-visible:underline">
              {coverage.next.label}
            </Link>. This does not establish identity verification or placement eligibility.
          </p>
        ) : (
          <p role="status" className="mt-3 text-sm text-body">
            All non-sensitive career sections contain saved information.
            This is not a verification or placement eligibility decision.
          </p>
        )}
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {checklist.items.map(item => (
            <li key={item.section}>
              <Link
                href={"/learn/profile?section=" + encodeURIComponent(item.section)}
                className="flex min-h-11 md:min-h-9 items-center gap-2 rounded-[var(--lms-control-radius,9px)] border border-border px-3 py-2 text-sm text-foreground hover:border-primary hover:bg-primary-subtle focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--lms-focus-ring)]"
                onClick={() => {
                  if (props.initialSection === item.section) {
                    window.document.getElementById(item.section)?.scrollIntoView({
                      behavior: "smooth", block: "start",
                    });
                  }
                }}
              >
                <span aria-hidden="true" className={item.completed ? "text-success" : "text-muted-foreground"}>
                  {item.completed ? "✓" : "○"}
                </span>
                <span className="min-w-0 break-words">{item.label}</span>
                {(["personal-details","contacts","education","skills"].includes(item.section))?
                  <Badge tone="warning" className="ml-auto shrink-0">Required</Badge>:null}
                <span className="sr-only">{item.completed ? "Completed" : "Not filled"}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card id="contacts" title="Contacts"
          action={<Button className="min-h-11 md:min-h-9" variant="secondary" onClick={openContacts}>Edit contact details</Button>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <Value label="Primary mobile" value={props.primaryPhone} />
            <Value label="Alternate phone" value={document.contacts.alternatePhone} />
            <Value label="Account email" value={props.primaryEmail} />
            <Value label="Contact email" value={document.contacts.contactEmail} />
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Primary mobile is your verified sign-in number. To change it, contact your college administrator; you can update your alternate mobile here.</p>
        </Card>
        <Card id="job-preferences" title="Job Preferences"
          action={<Button className="min-h-11 md:min-h-9" variant="secondary" disabled={pending}
            onClick={()=>{setJobPrefsDraft(document.jobPreferences);setRolePrefsInput(document.jobPreferences.rolePreferences.join("\n"));setJobPrefsEditing(true);}}>
            Edit preferences
          </Button>}>
          <div className="grid gap-3 md:grid-cols-2">
            <Value label="Role Preference" value={document.jobPreferences.rolePreferences.join(", ")}/>
            <Value label="Specific Role Preference" value={document.jobPreferences.specificRolePreference}/>
            <Value label="Work Shift Preference" value={document.jobPreferences.workShiftPreference}/>
            <Value label="Preferred Employment City" value={document.jobPreferences.preferredEmploymentCity}/>
          </div>
        </Card>
        <Card id="social-profiles" title="Social profiles"
          action={<Button className="min-h-11 md:min-h-9" variant="secondary" onClick={openDetails}>Connect or edit accounts</Button>}>
          <div className="grid gap-4 md:grid-cols-2">
            <Value label="LinkedIn" value={document.socialProfiles.linkedinUrl} />
            <Value label="GitHub" value={document.socialProfiles.githubUrl} />
            <Value label="Portfolio" value={document.socialProfiles.portfolioUrl} />
            <Value label="Twitter" value={document.socialProfiles.twitterUrl} />
            <Value label="Google Scholar" value={document.socialProfiles.googleScholarUrl} />
            <Value label="ResearchGate" value={document.socialProfiles.researchGateUrl} />
          </div>
        </Card>
        <Card id="address" title="Address">
          <div className="grid gap-4 md:grid-cols-2">
            <Value label="Current address" value={document.address.currentAddress} />
            <Value label="City" value={document.address.city} />
            <Value label="State" value={document.address.state} />
            <Value label="Pincode" value={document.address.pincode} />
            <Value label="Permanent address" value={document.address.permanentAddress} />
          </div>
        </Card>
        <Card id="personal-details" title="Personal Details">
          <div className="grid gap-4 md:grid-cols-3">
            <Value label="Gender" value={document.personalDetails.gender} />
            <Value label="Date of birth" value={document.personalDetails.dateOfBirth} />
            <Value label="Blood group" value={document.personalDetails.bloodGroup} />
          </div>
        </Card>
        <Card id="identity" title="Identity Documents">
          <div className="grid gap-4 md:grid-cols-2">
            <Value label="Aadhaar number" value={document.identity.aadhaarNumber ? "•••• •••• " + document.identity.aadhaarNumber.slice(-4) : ""} />
            <Value label="PAN number" value={document.identity.panNumber ? document.identity.panNumber.slice(0, 2) + "••••••" + document.identity.panNumber.slice(-2) : ""} />
          </div>
          <p className="mt-4 text-xs leading-5 text-muted-foreground">Aadhaar/PAN files remain blocked on secure Cloud Storage; saved numbers are masked in the UI.</p>
        </Card>
        <Card id="hobbies" title="Hobbies & Interests">
          {document.hobbies.length ? <div className="flex flex-wrap gap-2">{document.hobbies.map((hobby) => <StatusBadge key={hobby}>{hobby}</StatusBadge>)}</div> : <p className="m-0 text-sm text-muted-foreground">No hobbies added yet.</p>}
        </Card>
        {(["award","publication"] as const).map(kind=>{
          const entries=kind==="award"?authoredPublicationsAwards.awards:authoredPublicationsAwards.publications;
          return <Card key={kind} id={kind==="award"?"awards":"publications"}
            title={kind==="award"?"Awards & Recognitions":"Publications & Research"}
            action={<Button className="min-h-11 md:min-h-9" size="sm" disabled={pending||contactPending}
              onClick={()=>openShowcase(kind)}>Add {kind}</Button>}>
            <p className="mb-3 text-xs leading-5 text-muted-foreground">
              Learner-entered information, not independently verified by the college.
            </p>
            {entries.length?<ul className="space-y-2">
              {entries.map(entry=><li key={entry.id}
                className="min-w-0 border-t border-border pt-3">
                <p className="break-words text-sm font-semibold text-foreground">{entry.title}</p>
                {entry.organization?<p className="mt-1 text-xs text-body">{entry.organization}</p>:null}
                {entry.date?<p className="mt-1 text-xs text-body">{entry.date}</p>:null}
                {entry.description?<p className="mt-2 whitespace-pre-wrap break-words text-sm text-body">{entry.description}</p>:null}
                {entry.url?<div className="mt-2"><ThirdPartyLink href={entry.url} label="View link" /></div>:null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button className="min-h-11 md:min-h-9" size="sm" variant="secondary" disabled={pending||contactPending}
                    onClick={()=>openShowcase(kind,entry)}>Edit</Button>
                  <Button className="min-h-11 md:min-h-9" size="sm" variant="danger" disabled={pending||contactPending}
                    onClick={()=>deleteShowcase(kind,entry.id)}>Delete</Button>
                </div>
              </li>)}
            </ul>:<p className="text-sm text-muted-foreground">
              {kind==="award"?"No awards recorded yet.":"No publications recorded yet."}
            </p>}
          </Card>;
        })}
      </div>

      {(Object.keys(collectionLabels) as CollectionKey[]).map((section) => {
        const items = (section === "metadata"
          ? document.metadata.filter(item=>!isLearnerShowcaseKey(item.key))
          : document[section]) as Array<Record<string, unknown>>;
        return (
          <Card key={section} id={section} title={collectionLabels[section]} action={<Button className="min-h-11 md:min-h-9" size="sm" disabled={!learnerProfileCollectionMayEdit(pending,contactPending)}
            onClick={() => openCollection(section)}>Add</Button>}>
            {items.length ? (
              <div className="space-y-2">
                {items.map((item) => {
                  const summary = itemTitle(section, item);
                  return (
                    <div key={String(item.id)} className="flex min-w-0 flex-col items-start gap-2 border-t border-border py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="m-0 break-words text-sm font-semibold text-foreground">{summary.primary}</p>
                        {summary.secondary ? <p className="mt-1 text-xs text-muted-foreground">{summary.secondary}</p> : null}
                      </div>
                      <div className="flex w-full flex-wrap gap-2 md:w-auto">
                        <Button size="sm" variant="secondary" disabled={!learnerProfileCollectionMayEdit(pending,contactPending)}
                          className="min-h-11 flex-1 md:flex-none" onClick={() => openCollection(section, item)}>Edit</Button>
                        <Button size="sm" variant="danger" disabled={!learnerProfileCollectionMayEdit(pending,contactPending)}
                          className="min-h-11 flex-1 md:flex-none" onClick={() => removeItem(section, String(item.id))}>Delete</Button>
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
        open={contactOpen}
        onOpenChange={(open) => {if(!open)closeContacts();}}
        title="Confirm contact details"
        description="Only the alternate phone and contact email in your profile will change. Your login phone and account email will not change."
        footer={
          <>
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={contactPending}
              onClick={closeContacts}>
              Keep current details
            </Button>
            <Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={contactPending || !learnerContactEditSchema.safeParse({
              confirmed: true, contacts: contactDraft,
            }).success}
              onClick={() => { void saveContacts(); }}>
              {contactPending ? "Saving…" : "Confirm changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 md:grid-cols-2">
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Alternate phone
            <Input className="mt-[6px] min-h-11 md:min-h-9" inputMode="tel" autoComplete="tel-national"
              value={contactDraft.alternatePhone} maxLength={32}
              disabled={contactPending}
              onChange={(event) => setContactDraft(current => ({
                ...current, alternatePhone: event.target.value,
              }))} />
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            Contact email
            <Input className="mt-[6px] min-h-11 md:min-h-9" type="email" autoComplete="email"
              value={contactDraft.contactEmail} maxLength={320}
              disabled={contactPending}
              onChange={(event) => setContactDraft(current => ({
                ...current, contactEmail: event.target.value,
              }))} />
          </label>
          <p className="text-xs text-body md:col-span-2">
            Both fields are optional and may be cleared. These are contact
            preferences, not verified credentials and not a login recovery method.
          </p>
          {contactError ? (
            <p role="alert" className="text-sm font-semibold text-error md:col-span-2">
              {contactError}
            </p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={detailsOpen}
        onOpenChange={open=>{if(!open)closeDetails();}}
        title="Edit learner profile"
        description="Account phone/email stay authoritative. These are your self-service profile fields."
        footer={<><Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pending} onClick={closeDetails}>Cancel</Button><Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={() => saveDocument(detailsDraft, () => setDetailsOpen(false),detailsBaseline)}>{pending ? "Saving…" : "Save profile"}</Button></>}
      >
        <div className="space-y-[var(--lms-space-5)]">
          <fieldset className="grid gap-4">
            <legend className="text-sm font-semibold text-foreground">About</legend>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Headline<Input className="mt-[6px] min-h-11 md:min-h-9" value={detailsDraft.headline} onChange={(event) => setDetailsDraft({ ...detailsDraft, headline: event.target.value })} /></label>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">About<Textarea className="mt-[6px]" value={detailsDraft.bio} onChange={(event) => setDetailsDraft({ ...detailsDraft, bio: event.target.value })} /></label>
          </fieldset>

          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="text-sm font-semibold text-foreground">Contacts</legend>
            <p className="text-sm text-body md:col-span-2">
              Alternate phone and contact email are edited separately from the Contacts card,
              with their own confirmation and audit. Primary login contacts remain unchanged.
            </p>
          </fieldset>

          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="text-sm font-semibold text-foreground">Social profiles</legend>
            {([
              ["linkedinUrl", "LinkedIn"],
              ["githubUrl", "GitHub"],
              ["portfolioUrl", "Portfolio"],
              ["twitterUrl", "Twitter"],
              ["googleScholarUrl", "Google Scholar"],
              ["researchGateUrl", "ResearchGate"],
            ] as const).map(([key, label]) => <label key={key} className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">{label}<Input className="mt-[6px] min-h-11 md:min-h-9" data-learner-social-link={key} type="url" value={detailsDraft.socialProfiles[key]} onChange={(event) => setDetailsDraft({ ...detailsDraft, socialProfiles: { ...detailsDraft.socialProfiles, [key]: event.target.value } })} /></label>)}
          </fieldset>

          <fieldset className="grid gap-4">
            <legend className="text-sm font-semibold text-foreground">Address</legend>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Current address<Textarea className="mt-[6px]" value={detailsDraft.address.currentAddress} onChange={(event) => setDetailsDraft({ ...detailsDraft, address: { ...detailsDraft.address, currentAddress: event.target.value } })} /></label>
            <div className="grid gap-4 md:grid-cols-3">
              {(["city", "state", "pincode"] as const).map((key) => <label key={key} className="font-semibold capitalize text-[13px] leading-4 text-[var(--lms-neutral-400)]">{key}<Input className="mt-[6px] min-h-11 md:min-h-9" value={detailsDraft.address[key]} onChange={(event) => setDetailsDraft({ ...detailsDraft, address: { ...detailsDraft.address, [key]: event.target.value } })} /></label>)}
            </div>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Permanent address<Textarea className="mt-[6px]" value={detailsDraft.address.permanentAddress} onChange={(event) => setDetailsDraft({ ...detailsDraft, address: { ...detailsDraft.address, permanentAddress: event.target.value } })} /></label>
          </fieldset>

          <fieldset className="grid gap-4 md:grid-cols-3">
            <legend className="text-sm font-semibold text-foreground">Personal details</legend>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Gender<Select className="mt-[6px] min-h-11 md:min-h-9" value={detailsDraft.personalDetails.gender} onChange={(event) => setDetailsDraft({ ...detailsDraft, personalDetails: { ...detailsDraft.personalDetails, gender: event.target.value as LearnerProfileDocument["personalDetails"]["gender"] } })}>{["", "Male", "Female", "Other", "Prefer not to say"].map((value) => <option key={value || "none"} value={value}>{value || "Not specified"}</option>)}</Select></label>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Date of birth<Input className="mt-[6px] min-h-11 md:min-h-9" type="date" value={detailsDraft.personalDetails.dateOfBirth} onChange={(event) => setDetailsDraft({ ...detailsDraft, personalDetails: { ...detailsDraft.personalDetails, dateOfBirth: event.target.value } })} /></label>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Blood group<Select className="mt-[6px] min-h-11 md:min-h-9" value={detailsDraft.personalDetails.bloodGroup} onChange={(event) => setDetailsDraft({ ...detailsDraft, personalDetails: { ...detailsDraft.personalDetails, bloodGroup: event.target.value as LearnerProfileDocument["personalDetails"]["bloodGroup"] } })}>{["", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((value) => <option key={value || "none"} value={value}>{value || "Not specified"}</option>)}</Select></label>
          </fieldset>

          <fieldset className="grid gap-4 md:grid-cols-2">
            <legend className="text-sm font-semibold text-foreground">Identity</legend>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Aadhaar number<Input className="mt-[6px] min-h-11 md:min-h-9" value={detailsDraft.identity.aadhaarNumber} onChange={(event) => setDetailsDraft({ ...detailsDraft, identity: { ...detailsDraft.identity, aadhaarNumber: event.target.value } })} /></label>
            <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">PAN number<Input className="mt-[6px] min-h-11 md:min-h-9" value={detailsDraft.identity.panNumber} onChange={(event) => setDetailsDraft({ ...detailsDraft, identity: { ...detailsDraft.identity, panNumber: event.target.value } })} /></label>
          </fieldset>

          <label className="block text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Hobbies · comma-separated<Textarea className="mt-[6px]" value={detailsDraft.hobbies.join(", ")} onChange={(event) => setDetailsDraft({ ...detailsDraft, hobbies: event.target.value.split(",").map((value) => value.trim()).filter(Boolean) })} /></label>
        </div>
      </Dialog>

      <Dialog open={showcaseDraft!==null}
        onOpenChange={open=>{if(!open)closeShowcase();}}
        title={showcaseDraft?.kind==="award"?"Awards & Recognitions":"Publications & Research"}
        description="Save a learner-entered record. This does not verify the award or publication."
        footer={<>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pending}
            onClick={closeShowcase}>Cancel</Button>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={saveShowcase}>{pending?"Saving…":"Save"}</Button>
        </>}>
        {showcaseDraft?<div className="grid gap-4">
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Title
            <Input className="mt-[6px] min-h-11 md:min-h-9" maxLength={240} value={showcaseDraft.title}
              onChange={event=>setShowcaseDraft({...showcaseDraft,title:event.target.value})}/>
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
            {showcaseDraft.kind==="award"?"Issuing organization":"Journal or publisher"}
            <Input className="mt-[6px] min-h-11 md:min-h-9" maxLength={240} value={showcaseDraft.organization}
              onChange={event=>setShowcaseDraft({...showcaseDraft,organization:event.target.value})}/>
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Date
            <Input className="mt-[6px] min-h-11 md:min-h-9" type="date" value={showcaseDraft.date}
              onChange={event=>setShowcaseDraft({...showcaseDraft,date:event.target.value})}/>
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Reference link
            <Input className="mt-[6px] min-h-11 md:min-h-9" type="url" maxLength={1500} value={showcaseDraft.url}
              onChange={event=>setShowcaseDraft({...showcaseDraft,url:event.target.value})}/>
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Description
            <Textarea className="mt-[6px]" maxLength={1800} value={showcaseDraft.description}
              onChange={event=>setShowcaseDraft({...showcaseDraft,description:event.target.value})}/>
          </label>
          {showcaseError?<p role="alert" className="text-sm text-error">{showcaseError}</p>:null}
        </div>:null}
      </Dialog>

      <Dialog open={jobPrefsEditing}
        onOpenChange={open=>{if(!open)closeJobPreferences();}}
        title="Edit Job Preferences"
        footer={<>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pending} onClick={closeJobPreferences}>Cancel</Button>
          <Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={()=>saveDocument({...document,jobPreferences:{...jobPrefsDraft,
              rolePreferences:rolePrefsInput.split(/\r?\n/).map(role=>role.trim()).filter(Boolean)}},
              ()=>setJobPrefsEditing(false))}>
            {pending?"Saving…":"Save"}
          </Button>
        </>}>
        <div className="grid gap-4">
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Role Preference (multiple)
            <Textarea value={rolePrefsInput} maxLength={800}
              placeholder={"Software Engineer\nData Analyst"}
              onChange={event=>setRolePrefsInput(event.target.value)}
              className="mt-1 min-h-11 md:min-h-9 w-full"/>
            <span className="mt-1 block text-xs font-normal text-muted-foreground">One role per line; commas inside role titles are preserved.</span>
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Specific Role Preference
            <Input className="mt-[6px] min-h-11 md:min-h-9" value={jobPrefsDraft.specificRolePreference} maxLength={200}
              onChange={event=>setJobPrefsDraft(current=>({...current,specificRolePreference:event.target.value}))}/>
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Work Shift Preference
            <Select className="mt-[6px] min-h-11 md:min-h-9" value={jobPrefsDraft.workShiftPreference}
              onChange={event=>setJobPrefsDraft(current=>({...current,
                workShiftPreference:event.target.value as LearnerProfileDocument["jobPreferences"]["workShiftPreference"]}))}>
              <option value="">No preference</option>
              <option value="DAY">Day</option>
              <option value="NIGHT">Night</option>
              <option value="ROTATIONAL">Rotational</option>
              <option value="FLEXIBLE">Flexible</option>
            </Select>
          </label>
          <label className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">Preferred Employment City
            <Input className="mt-[6px] min-h-11 md:min-h-9" value={jobPrefsDraft.preferredEmploymentCity} maxLength={120}
              onChange={event=>setJobPrefsDraft(current=>({...current,preferredEmploymentCity:event.target.value}))}/>
          </label>
          <p className="text-xs text-muted-foreground">These preferences are learner-authored and do not change placement eligibility.</p>
        </div>
      </Dialog>

      <Dialog
        open={collection !== null}
        onOpenChange={(open) => {if(!open)closeCollection();}}
        title={collection ? (editingId ? "Edit " : "Add ") + collectionLabels[collection] : "Edit profile entry"}
        footer={<><Button className="min-h-11 w-full sm:w-auto md:min-h-9" variant="secondary" disabled={pending} onClick={closeCollection}>Cancel</Button><Button className="min-h-11 w-full sm:w-auto md:min-h-9" disabled={pending} onClick={saveCollection}>{pending ? "Saving…" : "Save"}</Button></>}
      >
        {collection ? (
          <div className="grid gap-4 md:grid-cols-2">
            {fields[collection].map((field) => {
              if(collection==="education"&&field.key==="endYear"&&itemDraft.isCurrentlyPursuing)return null;
              const raw = itemDraft[field.key];
              const value = field.key === "skills" && Array.isArray(raw) ? raw.join(", ") : String(raw || "");
              if(collection==="skills"&&field.key==="name")
                return <LearnerSkillCatalogInput key={field.key} value={value}
                  onChange={name=>setItemDraft(current=>({...current,name}))}/>;
              if(collection==="education"&&field.key==="educationType")
                return <label key={field.key} className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">{field.label}
                  <Select className="mt-[6px] min-h-11 md:min-h-9" value={value}
                    onChange={event=>{setEducationError(null);setItemDraft({...itemDraft,[field.key]:event.target.value});}}>
                    <option value="">Choose education type</option>
                    {LEARNER_EDUCATION_TYPES.map(option=><option key={option} value={option}>{option}</option>)}
                  </Select>
                </label>;
              if(collection==="education"&&field.key==="qualifyingExam")
                return <label key={field.key} className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">{field.label}
                  <Input className="mt-[6px] min-h-11 md:min-h-9 w-full"
                    list="learner-qualifying-exams" value={value} maxLength={120}
                    onChange={event=>setItemDraft({...itemDraft,[field.key]:event.target.value})}/>
                  <datalist id="learner-qualifying-exams">
                    {learnerQualifyingExamSuggestions(String(itemDraft.educationType??"")).map(option=><option key={option} value={option}/>)}
                  </datalist>
                </label>;
              if (field.type === "textarea") return <label key={field.key} className="font-semibold md:col-span-2 text-[13px] leading-4 text-[var(--lms-neutral-400)]">{field.label}<Textarea className="mt-[6px]" value={value} onChange={(event) => setItemDraft({ ...itemDraft, [field.key]: event.target.value })} /></label>;
              if (field.type === "select") return <label key={field.key} className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">{field.label}<Select className="mt-[6px] min-h-11 md:min-h-9" value={value} onChange={(event) => setItemDraft({ ...itemDraft, [field.key]: event.target.value })}>{field.options?.map((option) => <option key={option || "none"} value={option}>{option || "Not specified"}</option>)}</Select></label>;
              return <label key={field.key} className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">{field.label}<Input className="mt-[6px] min-h-11 md:min-h-9" type={field.type === "date" ? "date" : field.type === "url" ? "url" : "text"} value={value} onChange={(event) => setItemDraft({ ...itemDraft, [field.key]: event.target.value })} /></label>;
            })}
            {collection==="education"?<label className="flex items-center gap-2 text-sm text-body md:col-span-2">
              <Checkbox checked={Boolean(itemDraft.isCurrentlyPursuing)}
                onChange={event=>setItemDraft(current=>({
                  ...current,isCurrentlyPursuing:event.target.checked,
                  ...(event.target.checked?{endYear:""}:{}),
                }))}/>
              Currently Pursuing
            </label>:null}
            {collection==="education"?<label className="flex items-center gap-2 text-sm text-body md:col-span-2">
              <Checkbox checked={Boolean(itemDraft.isRecentEducation)}
                onChange={event=>{setEducationError(null);setItemDraft(current=>({...current,isRecentEducation:event.target.checked}));}}/>
              Recent / primary education
            </label>:null}
            {collection==="education"&&String(itemDraft.qualifyingExam??"").trim()?
              <fieldset className="grid gap-3 rounded-[var(--lms-control-radius,9px)] border border-border p-3 md:col-span-2 md:grid-cols-2">
                <legend className="text-sm font-semibold text-foreground">Qualifying exam details (optional)</legend>
                <p className="text-xs text-body md:col-span-2">
                  Record details from your exam result. These fields are learner-entered and are not an official verification.
                </p>
                {LEARNER_QUALIFYING_EXAM_DETAILS.map(field=>{
                  const details=(itemDraft.examDetails && typeof itemDraft.examDetails==="object" &&
                    !Array.isArray(itemDraft.examDetails))?
                    itemDraft.examDetails as Record<string,string|number|boolean>:{};
                  const value=String(details[field.key]??"");
                  return <label key={field.key} className="font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
                    {field.label}
                    <Input type="text" className="mt-[6px] min-h-11 md:min-h-9" maxLength={field.maxLength}
                      inputMode={field.key==="passingYear"?"numeric":undefined}
                      placeholder={field.key==="passingYear"?"YYYY":undefined}
                      value={value}
                      onChange={event=>setItemDraft(current=>({
                        ...current,examDetails:{
                          ...((current.examDetails && typeof current.examDetails==="object" &&
                            !Array.isArray(current.examDetails))?current.examDetails as Record<string,unknown>:{}),
                          [field.key]:event.target.value,
                        },
                      }))}/>
                  </label>;
                })}
              </fieldset>:null}
            {collection==="education"&&educationError?<p role="alert" className="md:col-span-2 text-sm text-error">{educationError}</p>:null}
            {collection === "experiences" ? <label className="flex items-center gap-2 text-sm text-body md:col-span-2"><Checkbox checked={Boolean(itemDraft.currentlyWorking)} onChange={(event) => setItemDraft({ ...itemDraft, currentlyWorking: event.target.checked, ...(event.target.checked ? { endDate: "" } : {}) })} />I currently work here</label> : null}
          </div>
        ) : null}
      </Dialog>
      <ConfirmDialog open={pendingPrompt!==null}
        onOpenChange={open=>{if(!open)completePrompt(false);}}
        title={pendingPrompt?.message??"Confirm"}
        description="Unsaved changes will be discarded, or the selected item will be deleted."
        confirmLabel="Confirm"
        onConfirm={()=>completePrompt(true)}/>
    </div>
  );
}
