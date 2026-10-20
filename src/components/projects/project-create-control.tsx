"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

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
  const [templateId, setTemplateId] = useState(
    templates[0]?.templateId ?? "",
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [summary, setSummary] = useState("");
  const [mentors, setMentors] = useState<
    { membershipId: string; displayName: string; email: string }[]
  >([]);
  const [mentorMembershipId, setMentorMembershipId] = useState("");
  const [mentorsLoading, setMentorsLoading] = useState(false);
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
  const [initialStatus,setInitialStatus]=useState<"PLANNED"|"ACTIVE">("PLANNED");
  const submitLock = useRef(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setTemplateId(templates[0]?.templateId ?? "");
    setTitle("");
    setSlug("");
    setSummary("");
    setMentorMembershipId("");
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

    void fetch(
      "/api/projects/mentor-candidates?collegeId=" +
        encodeURIComponent(collegeId) +
        "&limit=100",
      { signal: controller.signal },
    )
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(
            "Mentor candidates could not be loaded.",
          );
        }
        const body = (await response.json()) as {
          mentors?: {
            membershipId: string;
            displayName: string;
            email: string;
          }[];
        };
        if (!controller.signal.aborted) setMentors(body.mentors ?? []);
      })
      .catch((caught: unknown) => {
        if (
          controller.signal.aborted ||
          (caught instanceof DOMException && caught.name === "AbortError")
        ) {
          return;
        }
        setMentors([]);
        setMentorsError(
          caught instanceof Error
            ? caught.message
            : "Mentor candidates could not be loaded.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setMentorsLoading(false);
        }
      });

    return () => controller.abort();
  }, [open, collegeId]);

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
    if (initialStatus === "ACTIVE" && !mentorMembershipId) {
      setError("Assign a Mentor before making this Project active.");
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
          primaryMentorMembershipId:mentorMembershipId||undefined,
          sectionId:sectionId||undefined,
          learnerMembershipIds,
          initialStatus,
        },
      )) as { project: { id: string } };

      showToast({
        tone: "success",
        title: "Project created",
        description:
          "The assigned template was materialized into an independent workspace.",
      });
      setOpen(false);
      router.push(`${basePath}/${result.project.id}`);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create the Project.",
      );
    } finally {
      submitLock.current = false;
      setPending(false);
    }
  }

  if (templates.length === 0) {
    return (
      <Button size="sm" variant="secondary" disabled>
        No assigned templates
      </Button>
    );
  }


  const form = (
        <form onSubmit={submit} className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold text-body">
              Assigned template
            </span>
            <Select
              required
              value={templateId}
              onChange={(event) =>
                setTemplateId(event.target.value)
              }
            >
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
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold text-body">
              Project title
            </span>
            <Input
              required
              maxLength={200}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Campus placement portal"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold text-body">
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
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold text-body">
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
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold text-body">
              Primary mentor
            </span>
            <Select
              value={mentorMembershipId}
              disabled={mentorsLoading}
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
          <label className="grid gap-1 text-[13px] font-semibold text-body">Class
            <Select value={sectionId} onChange={e=>{setSectionId(e.target.value);setRoster([]);setLearnerMembershipIds([]);setLoadedRosterSectionId(null);setRosterError(false);}}
              className="w-full">
              <option value="">No class</option>
              {classes.map(item=><option key={item.id} value={item.id}>{item.name} · {item.code}</option>)}
            </Select>
          </label>
          {classesError?<p role="alert" className="text-sm text-error">Classes could not load. <Button variant="ghost" type="button" className="underline" onClick={()=>{setClassesError(false);setClassesRetry(value=>value+1);}}>Try again</Button></p>:null}
          <label className="grid gap-1 text-[13px] font-semibold text-body">Status
            <Select value={initialStatus} onChange={e=>setInitialStatus(e.target.value as "PLANNED"|"ACTIVE")}
              className="w-full">
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE" disabled={!mentorMembershipId}>Active</option>
            </Select>
          </label>
          {!mentorMembershipId?<p className="text-xs text-warning">This workspace has no mentor.</p>:null}
          {sectionId?<section className="min-w-0 border-b border-border pb-4">
            <p className="mb-2 text-sm font-semibold text-foreground">Students · {learnerMembershipIds.length} selected</p>
            {rosterError?<p role="alert" className="text-sm text-error">Class roster could not load. <Button variant="ghost" type="button" className="underline" onClick={()=>{setRosterError(false);setRosterRetry(value=>value+1);}}>Try again</Button></p>:null}
            {!rosterError&&loadedRosterSectionId!==sectionId?<p role="status" className="text-sm text-body">Loading class roster…</p>:null}
            <div className="flex gap-3 text-xs">
              <Button variant="ghost" type="button" disabled={loadedRosterSectionId!==sectionId} className="text-primary-text underline"
                onClick={()=>setLearnerMembershipIds(roster.map(x=>x.membershipId))}>Whole class</Button>
              <Button variant="ghost" type="button" className="text-primary-text underline"
                onClick={()=>setLearnerMembershipIds([])}>Clear</Button>
            </div>
            <div className="mt-3 max-h-40 min-w-0 space-y-2 overflow-y-auto overscroll-contain">
              {roster.map(student=><label key={student.membershipId} className="flex min-h-11 min-w-0 items-center gap-2 break-words text-sm text-body focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary">
                <Checkbox checked={learnerMembershipIds.includes(student.membershipId)}
                  onChange={e=>setLearnerMembershipIds(old=>e.target.checked?
                    [...old,student.membershipId]:old.filter(id=>id!==student.membershipId))}/>
                {student.displayName} · {student.rollNumber}
              </label>)}
              {loadedRosterSectionId===sectionId&&!roster.length?<p className="text-xs text-muted-foreground">No learners available.</p>:null}
            </div>
          </section>:null}

          {mentorsError ? (
            <p role="alert" className="m-0 text-xs font-semibold text-warning">
              {mentorsError} You can create the planned workspace and assign a Mentor from Team later.
            </p>
          ) : null}
          {error ? (
            <p role="alert" className="m-0 text-sm font-semibold text-error">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => standalone ? router.push(basePath) : setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
        <section aria-label="Create workspace" className="space-y-5">
          <p className="text-sm text-body">Create an independent Project workspace from a published template assigned to this college.</p>
          {form}
        </section>
      ) : (
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Create workspace"
          description="Create an independent Project workspace from the exact published template version assigned to this college."
        >
          {form}
        </Dialog>
      )}
    </>
  );
}
