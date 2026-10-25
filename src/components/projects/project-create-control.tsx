"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";
import { useProjectEditorDiscardGuard } from "./project-editor-discard-guard";
import { ProjectCollegeLearnerPicker } from "./project-college-learner-picker";

export type AssignedProjectTemplateChoice = {
  templateId: string;
  title: string;
  version: number;
  summary: string | null;
};

export function CreateProjectControl({
  collegeId,
  basePath,
  templates,
  standalone = false,
}: {
  collegeId: string;
  basePath: string;
  templates: readonly AssignedProjectTemplateChoice[];
  standalone?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(standalone);
  const [templateId, setTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [templateQuery, setTemplateQuery] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [summary, setSummary] = useState("");
  const [phase, setPhase] = useState("Planning");
  const [progressPercent, setProgressPercent] = useState(0);
  const [dueLabel, setDueLabel] = useState("");
  const [blocker, setBlocker] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [mentors, setMentors] = useState<
    { membershipId: string; displayName: string; email: string }[]
  >([]);
  const [mentorMembershipId, setMentorMembershipId] = useState("");
  const [mentorsLoading, setMentorsLoading] = useState(false);
  const [mentorQuery, setMentorQuery] = useState("");
  const [mentorPage,setMentorPage]=useState(0);
  const [mentorsError, setMentorsError] = useState<string | null>(null);
  const [classes,setClasses]=useState<{id:string;name:string;code:string}[]>([]);
  const [showClassSelector,setShowClassSelector]=useState(false);
  const [classQuery,setClassQuery]=useState("");
  const [classPage,setClassPage]=useState(0);
  const [classesError,setClassesError]=useState(false);
  const [classesRetry,setClassesRetry]=useState(0);
  const [sectionId,setSectionId]=useState("");
  const [roster,setRoster]=useState<{membershipId:string;displayName:string;rollNumber:string}[]>([]);
  const [loadedRosterSectionId,setLoadedRosterSectionId]=useState<string|null>(null);
  const [rosterError,setRosterError]=useState(false);
  const [rosterRetry,setRosterRetry]=useState(0);
  const [learnerMembershipIds,setLearnerMembershipIds]=useState<string[]>([]);
  const [rosterSearch,setRosterSearch]=useState("");
  const [initialStatus,setInitialStatus]=useState<"PLANNED"|"ACTIVE">(standalone?"ACTIVE":"PLANNED");
  const [displayStatus,setDisplayStatus]=useState<"PLANNED"|"ACTIVE"|"IN_PROGRESS"|"READY"|"BLOCKED">(standalone?"ACTIVE":"PLANNED");
  const titleRef = useRef<HTMLInputElement|null>(null);
  const templateRef = useRef<HTMLSelectElement|null>(null);
  const submitLock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A template is chosen explicitly, except when a valid creation link supplies it.
  useEffect(() => {
    if (!standalone) return;
    const requested = new URLSearchParams(window.location.search).get("templateId");
    if (requested && templates.some(template => template.templateId === requested)) {
      setTemplateId(requested);
    }
  }, [standalone, templates]);

  function openDialog() {
    setTemplateId("");
    setTitle("");
    setSlug("");setSlugEdited(false);setTemplateQuery("");setAttempted(false);
    setSummary("");
    setPhase("Planning");setProgressPercent(0);
    setDueLabel("");setBlocker("");setNextAction("");
    setMentorMembershipId("");
    setMentorQuery("");setRosterSearch("");setClassQuery("");setShowClassSelector(false);
    setSectionId("");setRoster([]);setLearnerMembershipIds([]);
    setInitialStatus(standalone?"ACTIVE":"PLANNED");setDisplayStatus(standalone?"ACTIVE":"PLANNED");
    setLoadedRosterSectionId(null);setRosterError(false);setClassesError(false);
    setMentorsError(null);
    setMentorsLoading(true);
    setMentors([]);
    setError(null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setMentorsLoading(true);
    setMentorsError(null);
    // Search the college's whole mentor directory rather than requiring a
    // candidate to appear in the first hundred alphabetically.
    const timer = setTimeout(() => {
      void fetch(
        "/api/projects/mentor-candidates?collegeId=" +
          encodeURIComponent(collegeId) + "&q=" + encodeURIComponent(mentorQuery.trim()) +
          "&limit=100&offset="+(mentorPage*100),
        { signal: controller.signal, cache: "no-store" },
      )
        .then(async response => {
          if (!response.ok) throw new Error("Mentor candidates could not be loaded.");
          const body = await response.json() as {
            mentors?: { membershipId: string; displayName: string; email: string }[];
          };
          if (controller.signal.aborted) return;
          const found = body.mentors ?? [];
          setMentors(previous => {
            const selected = previous.find(mentor => mentor.membershipId === mentorMembershipId);
            return selected && !found.some(row => row.membershipId === selected.membershipId)
              ? [selected, ...found] : found;
          });
        })
        .catch((caught: unknown) => {
          if (controller.signal.aborted) return;
          setMentorsError(caught instanceof Error ? caught.message : "Mentor candidates could not be loaded.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setMentorsLoading(false);
        });
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, collegeId, mentorQuery, mentorMembershipId,mentorPage]);

  useEffect(()=>{
    if(!open||!showClassSelector)return;
    const ctl=new AbortController();
    const timer=window.setTimeout(()=>{
      void fetch("/api/projects/class-team-classes?collegeId="+encodeURIComponent(collegeId)+
        "&q="+encodeURIComponent(classQuery.trim())+"&limit=100&offset="+(classPage*100),
        {signal:ctl.signal,cache:"no-store"})
        .then(r=>r.ok?r.json():Promise.reject(Error("Classes unavailable")))
        .then((v:{classes:typeof classes})=>{if(!ctl.signal.aborted){
          setClasses(old=>{
            const chosen=old.find(row=>row.id===sectionId);
            return chosen&&!v.classes.some(row=>row.id===chosen.id)?[chosen,...v.classes]:v.classes;
          });
          setClassesError(false);
        }})
        .catch(()=>{if(!ctl.signal.aborted)setClassesError(true);});
    },400);
    return ()=>{window.clearTimeout(timer);ctl.abort();};
  },[open,showClassSelector,collegeId,classQuery,classesRetry,sectionId,classPage]);
  const rosterActive=Boolean(open&&sectionId);
  const [prevRosterActive,setPrevRosterActive]=useState(rosterActive);
  if(prevRosterActive!==rosterActive){
    setPrevRosterActive(rosterActive);
    if(!rosterActive){setRoster([]);setLearnerMembershipIds([]);}
  }
  useEffect(()=>{
    if(!open||!sectionId)return;
    const ctl=new AbortController();
    void fetch("/api/projects/class-team-roster?collegeId="+encodeURIComponent(collegeId)+
      "&classId="+encodeURIComponent(sectionId),{signal:ctl.signal})
      .then(r=>r.ok?r.json():Promise.reject(Error("Roster unavailable")))
      .then((v:{roster:{members:typeof roster}})=>{if(!ctl.signal.aborted){setRoster(v.roster.members);setLoadedRosterSectionId(sectionId);setRosterError(false);}})
      .catch(()=>{if(!ctl.signal.aborted){setRoster([]);setLoadedRosterSectionId(null);setRosterError(true);}});
    return ()=>ctl.abort();
  },[open,collegeId,sectionId,rosterRetry]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitLock.current) return;
    setAttempted(true);
    if (!templateId || !templates.some(item => item.templateId === templateId)) {
      templateRef.current?.focus();
      setError("Select a template to start from its sprint and task plan.");
      return;
    }
    if (!title.trim()) {
      titleRef.current?.focus();
      setError("Title is required");
      return;
    }
    if (title.trim().length > 160) {
      setError("Title must be 160 characters or fewer");
      return;
    }
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      setError("Slug must contain lowercase letters, numbers and single hyphens.");
      return;
    }
    if (learnerMembershipIds.length > 500) {
      setError("Select no more than 500 learners.");
      return;
    }
    if (initialStatus === "ACTIVE" && !mentorMembershipId) {
      setError("A mentor is required before a workspace can be Active");
      return;
    }
    // A disabled Submit button is not an authorization or freshness gate:
    // pressing Enter can submit the form before a new class roster renders.
    // Never reuse the previous class's learner selection during a slow fetch.
    if (sectionId && (
      classesError ||
      !classes.some(item => item.id === sectionId) ||
      rosterError ||
      loadedRosterSectionId !== sectionId ||
      learnerMembershipIds.some(id => !roster.some(row => row.membershipId === id))
    )) {
      setError("The selected class roster is not ready. Retry loading it before creating the Project.");
      return;
    }
    submitLock.current = true;
    setPending(true);
    setError(null);

    try {
      const result = (await projectMutation(
        "/api/projects",
        "POST",
        {
          collegeId,
          templateId,
          title: title.trim(),
          slug: slug.trim(),
          summary: summary.trim() || undefined,
          phase: phase.trim() || undefined,
          progressPercent,
          dueLabel: dueLabel.trim() || undefined,
          blocker: blocker.trim() || undefined,
          nextAction: nextAction.trim() || undefined,
          primaryMentorMembershipId:mentorMembershipId||undefined,
          sectionId:sectionId||undefined,
          learnerMembershipIds,
          initialStatus,
        },
      )) as { project?: { id?: string } | null };

      const createdId = result.project?.id;
      if (!createdId) {
        showToast({
          tone: "info",
          title: "Workspace created",
          description: "The workspace was created but could not be opened. Return to the workspaces list.",
        });
        setOpen(false);
        router.push(basePath);
        router.refresh();
        return;
      }
      showToast({tone:"success",title:"Workspace created"});
      setOpen(false);
      router.push(`${basePath}/${encodeURIComponent(createdId)}/summary`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Failed to create workspace",
      );
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }

  const dirty = Boolean(templateId || title || slug || summary || mentorMembershipId ||
    templateQuery || slugEdited || displayStatus !== (standalone?"ACTIVE":"PLANNED") ||
    sectionId || learnerMembershipIds.length || showClassSelector || initialStatus !== (standalone?"ACTIVE":"PLANNED") ||
    phase !== "Planning" || progressPercent !== 0 || dueLabel || blocker || nextAction);
  const discard = useProjectEditorDiscardGuard(open, dirty, pending, () => {
    setOpen(false);
    if (standalone) router.push(basePath);
  });

  if (templates.length === 0) {
    return (
      standalone ? (
        <EmptyState title="No assigned templates"
          description="Create an independent Project workspace from a published template assigned to this college."
          action={<Link href={basePath + "/templates"}
            className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:underline">Templates</Link>}
        />
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" disabled>Create Project</Button>
          <span className="text-xs text-body">Assign a published template to this college before creating a project.</span>
          <Link href={basePath+"/templates"} className="text-xs font-semibold text-link underline">View templates</Link>
        </div>
      )
    );
  }


  const form = (
        <form noValidate onSubmit={submit} className="grid min-w-0 grid-cols-1 items-start gap-4">
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Workspace title
            </span>
            <Input
              ref={titleRef}
              required
              maxLength={160}
              aria-invalid={attempted&&!title.trim()}
              value={title}
              onChange={(event) => {
                const next=event.target.value;
                setTitle(next);
                if(!slugEdited)setSlug(next.toLowerCase().normalize("NFKD")
                  .replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-")
                  .replace(/^-|-$/g,"").slice(0,64).replace(/-$/g,""));
              }}
              placeholder="Campus Event Coordination"
            />
            <span className="mt-1 block text-xs text-muted-foreground">{title.length}/160</span>
            {attempted&&!title.trim()?<span role="alert" className="mt-1 block text-xs text-error">
              Title is required
            </span>:null}
          </label>
          <label className="min-w-0 md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Summary
            </span>
            <Textarea
              rows={3}
              maxLength={2000}
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder="Short live workspace summary"
            />
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
            <Select value={displayStatus} onChange={event=>{
              const next=event.target.value as typeof displayStatus;
              const previous=displayStatus;
              setDisplayStatus(next);
              setInitialStatus(next==="BLOCKED"||next==="PLANNED"?"PLANNED":"ACTIVE");
              if(phase==="Planning"||phase===previous.replace("_"," ")){
                setPhase(next==="IN_PROGRESS"?"In progress":next==="READY"?"Ready":
                  next==="BLOCKED"?"Blocked":"Planning");
              }
            }} className="w-full">
              <option value="PLANNED">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="IN_PROGRESS">In progress</option>
              <option value="READY">Ready</option>
              <option value="BLOCKED">Blocked</option>
              <option value="ARCHIVED" disabled>Archived (use Archive after creating)</option>
            </Select>
            <span className="text-xs text-body">
              {displayStatus==="READY"||displayStatus==="IN_PROGRESS"
                ?"The workspace is saved as Active, with the historical stage in Phase.":
                displayStatus==="BLOCKED"
                ?"The workspace is saved as Planned, with Blocked recorded in Phase.":
                "Archive is available after the workspace is created."}
            </span>
          </label>
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Template
            </span>
            <Input type="search" className="mb-2" maxLength={120}
              aria-label="Find assigned template" placeholder="Search by template title"
              value={templateQuery} onChange={event=>setTemplateQuery(event.target.value)}/>
            <Select
              ref={templateRef}
              aria-label="Template"
              aria-invalid={attempted&&!templateId}
              required
              value={templateId}
              onChange={(event) =>
                setTemplateId(event.target.value)
              }
            >
              <option value="">Select a template</option>
              {templates.filter(template=>template.templateId===templateId||!templateQuery.trim()||
                template.title.toLowerCase().includes(templateQuery.trim().toLowerCase())).map((template) => (
                <option
                  key={template.templateId}
                  value={template.templateId}
                >
                  {template.title} · v{template.version}
                </option>
              ))}
            </Select>
            {attempted&&!templateId?<span role="alert" className="mt-1 block text-xs text-error">
              Select a template to start from its sprint and task plan.
            </span>:null}
            <span className="mt-1 block text-xs font-normal text-body">
              Search by template title. The assigned published version is pinned to the new workspace.
            </span>
          </label>
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Slug (automatically suggested)
            </span>
            <Input
              required
              maxLength={64}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={(event) => {
                setSlugEdited(true);
                setSlug(event.target.value.toLowerCase());
              }}
              placeholder="campus-placement-portal"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Lowercase letters, numbers and hyphens only.
            </span>
          </label>
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Primary mentor
            </span>
            <Input className="mb-2" type="search" value={mentorQuery}
              placeholder={initialStatus==="ACTIVE"?"Required — search by faculty name":"Search by faculty name"} aria-label="Search mentors"
              disabled={pending} maxLength={120}
              onChange={event => {setMentorPage(0);setMentorQuery(event.target.value);}} />
            <Select
              value={mentorMembershipId}
              aria-invalid={attempted&&initialStatus==="ACTIVE"&&!mentorMembershipId}
              disabled={pending || mentorsLoading}
              onChange={(event) =>
                setMentorMembershipId(event.target.value)
              }
            >
              <option value="">
                {mentorsLoading
                  ? "Loading mentors…"
                  : "Assign later"}
              </option>
              {mentors.map((mentor) => (
                <option
                  key={mentor.membershipId}
                  value={mentor.membershipId}
                >
                  {mentor.displayName} · {mentor.membershipId.slice(0,8)}
                </option>
              ))}
            </Select>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-body">
              <Button type="button" size="sm" variant="secondary"
                disabled={pending||mentorsLoading||mentorPage===0}
                onClick={()=>setMentorPage(page=>Math.max(0,page-1))}>Previous mentors</Button>
              <span>Page {mentorPage+1}</span>
              <Button type="button" size="sm" variant="secondary"
                disabled={pending||mentorsLoading||mentors.length<100||mentorPage>=999}
                onClick={()=>setMentorPage(page=>Math.min(999,page+1))}>Next mentors</Button>
            </div>
            <span className="mt-1 block text-xs text-muted-foreground">
              {initialStatus==="ACTIVE"?
                "Required — search by faculty name. Active workspaces must have a primary Mentor.":
                "Optional while Planned; you can assign a primary Mentor later."}
            </span>
          </label>
          <div className="min-w-0 space-y-2 md:col-span-2">
            <Button type="button" variant="secondary" size="sm" disabled={pending}
              onClick={()=>{setShowClassSelector(v=>!v);setSectionId("");
                setRoster([]);setLearnerMembershipIds([]);setLoadedRosterSectionId(null);}}>
              {showClassSelector?"Remove class link":"Or add a whole class"}
            </Button>
            <p className="text-xs text-body">
              Select eligible students directly or add a whole class.
              You can remove individual students after using the class shortcut.
            </p>
          </div>
          {showClassSelector?<label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class
            <Input type="search" value={classQuery} maxLength={120}
              placeholder="Search class name or code" aria-label="Search classes"
              onChange={event=>{setClassQuery(event.target.value);setClassPage(0);}}/>
            <Select value={sectionId} onChange={e=>{setSectionId(e.target.value);
              setRoster([]);setLearnerMembershipIds([]);setLoadedRosterSectionId(null);setRosterError(false);}}
              className="w-full">
              <option value="">Choose class</option>
              {classes.map(item=><option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
            </Select>
            <span className="flex flex-wrap items-center gap-2 text-xs font-normal">
              <Button size="sm" variant="secondary" type="button"
                disabled={pending||classPage===0} onClick={()=>setClassPage(page=>Math.max(0,page-1))}>
                Previous classes</Button>
              <span>Page {classPage+1}</span>
              <Button size="sm" variant="secondary" type="button"
                disabled={pending||classes.length<100||classPage>=999}
                onClick={()=>setClassPage(page=>Math.min(999,page+1))}>Next classes</Button>
            </span>
          </label>:null}
          {showClassSelector&&classesError?<p role="alert" className="text-sm text-error md:col-span-2">Classes could not load. <Button variant="ghost" type="button" className="underline" onClick={()=>{setClassesError(false);setClassesRetry(value=>value+1);}}>Try Again</Button></p>:null}
          <div className="grid min-w-0 gap-4 md:col-span-2 sm:grid-cols-2">
            <label className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">
              Phase
              <Input className="mt-1" maxLength={120} value={phase}
                onChange={event => setPhase(event.target.value)} placeholder="Planning" />
            </label>
            <label className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">
              Progress (%)
              <Input className="mt-1" type="number" min={0} max={100}
                value={progressPercent}
                onChange={event => setProgressPercent(Math.max(0, Math.min(100,
                  Number(event.target.value) || 0)))} />
            </label>
            <label className="text-[13px] font-semibold text-[var(--lms-neutral-400)] sm:col-span-2">
              Due Label
              <Input className="mt-1" maxLength={80} value={dueLabel}
                onChange={event => setDueLabel(event.target.value)}
                placeholder="e.g. Before the final review" />
            </label>
            <label className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">
              Blocker
              <Textarea className="mt-1" maxLength={4000} value={blocker}
                onChange={event => setBlocker(event.target.value)}
                placeholder="Optional blocker or dependency" />
            </label>
            <label className="text-[13px] font-semibold text-[var(--lms-neutral-400)]">
              Next Action
              <Textarea className="mt-1" maxLength={4000} value={nextAction}
                onChange={event => setNextAction(event.target.value)}
                placeholder="Optional next step" />
            </label>
          </div>
          {!mentorMembershipId?<p className="text-xs text-warning md:col-span-2">
            {initialStatus === "ACTIVE" ? "A mentor is required before a workspace can be Active" :
              "This workspace has no mentor. A mentor can be assigned later while the workspace is Planned."}
          </p>:null}
          {sectionId?<section className="min-w-0 border-b border-border pb-4 md:col-span-2">
            <p className="mb-2 text-sm font-semibold text-foreground">Students · {learnerMembershipIds.length} selected</p>
            {rosterError?<p role="alert" className="text-sm text-error">Class roster could not load. <Button variant="ghost" type="button" className="underline" onClick={()=>{setRosterError(false);setRosterRetry(value=>value+1);}}>Try Again</Button></p>:null}
            {!rosterError&&loadedRosterSectionId!==sectionId?<p role="status" className="text-sm text-body">Loading class roster…</p>:null}
            <div className="flex flex-wrap gap-3 text-xs">
              <Button variant="ghost" type="button" disabled={loadedRosterSectionId!==sectionId} className="text-primary-text underline"
                onClick={()=>setLearnerMembershipIds(old=>Array.from(new Set([
                  ...old,...roster.map(row=>row.membershipId),
                ])).slice(0,500))}>Add a whole class</Button>
              <Button variant="ghost" type="button" className="text-primary-text underline"
                onClick={()=>setLearnerMembershipIds([])}>Clear</Button>
            </div>
            <Input type="search" value={rosterSearch} maxLength={120}
              aria-label="Search class learners" placeholder="Search learners by name or roll number"
              onChange={event => setRosterSearch(event.target.value)} />
            <div tabIndex={0} aria-label="Class learner roster" className="mt-3 max-h-40 min-w-0 divide-y divide-[var(--lms-canvas-border)] overflow-y-auto overscroll-contain border-y border-[var(--lms-canvas-border)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
              {roster.filter(student => !rosterSearch.trim() ||
                (student.displayName + " " + student.rollNumber).toLowerCase()
                  .includes(rosterSearch.trim().toLowerCase())).map(student=><label key={student.membershipId} className="flex min-h-11 min-w-0 items-center gap-2 py-2 text-[13px] leading-5 text-body focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
                <Checkbox checked={learnerMembershipIds.includes(student.membershipId)}
                  onChange={e=>setLearnerMembershipIds(old=>e.target.checked?
                    [...old,student.membershipId]:old.filter(id=>id!==student.membershipId))}/>
                <span className="min-w-0 break-words">{student.displayName} · {student.rollNumber || student.membershipId}</span>
              </label>)}
              {loadedRosterSectionId===sectionId&&!roster.length?<p className="text-xs text-muted-foreground">No learners available.</p>:null}
            </div>
          </section>:null}

          {!sectionId?<ProjectCollegeLearnerPicker collegeId={collegeId}
            selectedIds={learnerMembershipIds} onChange={setLearnerMembershipIds}/>:null}
          {mentorsError ? (
            <p role="alert" className="m-0 text-xs font-semibold text-warning md:col-span-2">
              {mentorsError} You can create the planned workspace and assign a Mentor from Team later.
            </p>
          ) : null}
          {error ? (
            <div role="alert" className="m-0 border-l-2 border-error px-3 py-2 text-sm text-error md:col-span-2">
              <p className="font-semibold">Project was not created</p>
              <p className="mt-1">{error}</p>
            </div>
          ) : null}
          <div className="flex min-w-0 flex-col-reverse gap-2 border-t border-border pt-4 md:col-span-2 md:flex-row md:justify-end">
            <Button
              type="button"
              variant="secondary"
              className="w-full md:w-auto"
              disabled={pending}
              onClick={discard.requestClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full md:w-auto"
              loading={pending}
              disabled={
                pending ||
                (Boolean(sectionId) && loadedRosterSectionId!==sectionId)
              }
            >
              {pending ? "Creating…" : basePath.startsWith("/admin/") ? "Create Project" : "Create workspace"}
            </Button>
          </div>
        </form>
  );
  return (
    <>
      {!standalone ? (
        <Button size="sm" aria-haspopup="dialog" aria-expanded={open} onClick={openDialog}>
          {basePath.startsWith("/admin/")?"Create Project":"Create workspace"}
        </Button>
      ) : null}
      {standalone ? (
        <section aria-label="Create workspace" className="min-w-0 max-w-3xl space-y-5">
          <p className="text-sm text-body">Create an independent Project workspace from a published template assigned to this college.</p>
          {form}
        </section>
      ) : (
        <Dialog
          open={open}
          onOpenChange={next=>{if(pending||submitLock.current)return;
            if(next)setOpen(true);else discard.requestClose();
          }}
          dismissible={!pending}
          className="max-w-[760px]"
          title={basePath.startsWith("/admin/")?"Create Project":"Create workspace"}
          description="Create an independent Project workspace from the exact published template version assigned to this college."
        >
          {form}
        </Dialog>
      )}
      <ConfirmDialog open={discard.discardOpen} onOpenChange={discard.setDiscardOpen}
        title="Discard unsaved changes?"
        description="Leave this form and discard the workspace details you entered?"
        confirmLabel="Discard changes" pending={pending}
        onConfirm={discard.confirmDiscard} />
    </>
  );
}
