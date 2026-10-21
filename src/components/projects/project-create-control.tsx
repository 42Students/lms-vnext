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
  const [mentorsError, setMentorsError] = useState<string | null>(null);
  const [classes,setClasses]=useState<{id:string;name:string;code:string}[]>([]);
  const [classesError,setClassesError]=useState(false);
  const [classesRetry,setClassesRetry]=useState(0);
  const [sectionId,setSectionId]=useState("");
  const [roster,setRoster]=useState<{membershipId:string;displayName:string;rollNumber:string}[]>([]);
  const [loadedRosterSectionId,setLoadedRosterSectionId]=useState<string|null>(null);
  const [rosterError,setRosterError]=useState(false);
  const [rosterRetry,setRosterRetry]=useState(0);
  const [learnerMembershipIds,setLearnerMembershipIds]=useState<string[]>([]);
  const [rosterSearch,setRosterSearch]=useState("");
  const [initialStatus,setInitialStatus]=useState<"PLANNED"|"ACTIVE">("PLANNED");
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
    setSlug("");
    setSummary("");
    setPhase("Planning");setProgressPercent(0);
    setDueLabel("");setBlocker("");setNextAction("");
    setMentorMembershipId("");
    setMentorQuery("");setRosterSearch("");
    setSectionId("");setRoster([]);setLearnerMembershipIds([]);setInitialStatus("PLANNED");
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
          "&limit=100",
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
  }, [open, collegeId, mentorQuery, mentorMembershipId]);

  useEffect(()=>{
    if(!open)return;
    const ctl=new AbortController();
    void fetch("/api/projects/class-team-classes?collegeId="+encodeURIComponent(collegeId),{signal:ctl.signal})
     .then(r=>r.ok?r.json():Promise.reject(Error("Classes unavailable")))
     .then((v:{classes:typeof classes})=>{if(!ctl.signal.aborted){setClasses(v.classes);setClassesError(false);}})
     .catch(()=>{if(!ctl.signal.aborted){setClasses([]);setClassesError(true);}});
    return ()=>ctl.abort();
  },[open,collegeId,classesRetry]);
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
    if (!templateId || !templates.some(item => item.templateId === templateId)) {
      setError("Select a template to start from its sprint and task plan.");
      return;
    }
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (title.trim().length > 160) {
      setError("Title must be 160 characters or fewer");
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
          tone: "warning",
          title: "Workspace created",
          description: "The workspace was created but could not be opened. Return to the workspaces list.",
        });
        setOpen(false);
        router.push(basePath);
        router.refresh();
        return;
      }
      showToast({
        tone: "success",
        title: standalone ? "Workspace created" : "Project created successfully",
      });
      setOpen(false);
      router.push(`${basePath}/${encodeURIComponent(createdId)}`);
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
    sectionId || learnerMembershipIds.length || initialStatus !== "PLANNED" ||
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
        <Button size="sm" variant="secondary" disabled>No assigned templates</Button>
      )
    );
  }


  const form = (
        <form onSubmit={submit} className="grid min-w-0 grid-cols-1 items-start gap-4 md:grid-cols-2">
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Assigned template
            </span>
            <Select
              required
              value={templateId}
              onChange={(event) =>
                setTemplateId(event.target.value)
              }
            >
              <option value="">Select a template</option>
              {templates.map((template) => (
                <option
                  key={template.templateId}
                  value={template.templateId}
                >
                  {template.title} · v{template.version}
                </option>
              ))}
            </Select>
          </label>
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Project title
            </span>
            <Input
              required
              maxLength={160}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Campus Event Coordination"
            />
            <span className="mt-1 block text-xs text-muted-foreground">{title.length}/160</span>
          </label>
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Slug
            </span>
            <Input
              required
              maxLength={64}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={(event) =>
                setSlug(event.target.value.toLowerCase())
              }
              placeholder="campus-placement-portal"
            />
            <span className="mt-1 block text-xs text-muted-foreground">
              Lowercase letters, numbers and hyphens only.
            </span>
          </label>
          <label className="min-w-0 md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Summary
            </span>
            <Textarea
              maxLength={2000}
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder="Optional context specific to this Project instance."
            />
          </label>
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
          <label className="min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Primary mentor
            </span>
            <Input className="mb-2" type="search" value={mentorQuery}
              placeholder="Search mentors by name or email" aria-label="Search mentors"
              disabled={pending} maxLength={120}
              onChange={event => setMentorQuery(event.target.value)} />
            <Select
              value={mentorMembershipId}
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
                  {mentor.displayName} · {mentor.email}
                </option>
              ))}
            </Select>
            <span className="mt-1 block text-xs text-muted-foreground">
              If selected, the Mentor assignment is validated and committed atomically with workspace creation.
            </span>
          </label>
          <label className="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]">Class
            <Select value={sectionId} onChange={e=>{setSectionId(e.target.value);setRoster([]);setLearnerMembershipIds([]);setLoadedRosterSectionId(null);setRosterError(false);}}
              className="w-full">
              <option value="">No class</option>
              {classes.map(item=><option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
            </Select>
          </label>
          {classesError?<p role="alert" className="text-sm text-error md:col-span-2">Classes could not load. <Button variant="ghost" type="button" className="underline" onClick={()=>{setClassesError(false);setClassesRetry(value=>value+1);}}>Try Again</Button></p>:null}
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
            <Select value={initialStatus} onChange={e=>setInitialStatus(e.target.value as "PLANNED"|"ACTIVE")}
              className="w-full">
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
            </Select>
          </label>
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
                onClick={()=>setLearnerMembershipIds(roster.map(x=>x.membershipId))}>Whole class</Button>
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
                <span className="min-w-0 break-words">{student.displayName} · {student.rollNumber}</span>
              </label>)}
              {loadedRosterSectionId===sectionId&&!roster.length?<p className="text-xs text-muted-foreground">No learners available.</p>:null}
            </div>
          </section>:null}

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
                !templateId ||
                !title.trim() ||
                !slug.trim() ||
                (Boolean(sectionId) && loadedRosterSectionId!==sectionId)
              }
            >
              {pending ? "Creating…" : "Create Project"}
            </Button>
          </div>
        </form>
  );
  return (
    <>
      {!standalone ? (
        <Button size="sm" onClick={openDialog}>Create workspace</Button>
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
          title="Create workspace"
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
