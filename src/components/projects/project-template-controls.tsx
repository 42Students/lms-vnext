"use client";

import {type FormEvent,useEffect,useState} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { templateAssignmentRevocationNotice } from "@/modules/projects/template-college-availability-model";
import {projectTemplateGlobalActions} from "@/modules/projects/template-global-actions-model";
import { projectMutation } from "./project-api";

export function CreateProjectTemplateControl() {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [summary, setSummary] =
    useState("");
  const [goal, setGoal] = useState("");
  const [releaseTitle, setReleaseTitle] =
    useState("Release 1");
  const [sprintTitle, setSprintTitle] =
    useState("Sprint 1");
  const [taskTitle, setTaskTitle] =
    useState("");

  function reset() {
    setSlug("");
    setTitle("");
    setSummary("");
    setGoal("");
    setReleaseTitle("Release 1");
    setSprintTitle("Sprint 1");
    setTaskTitle("");
    setError(null);
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const result = (await projectMutation(
        "/api/projects/templates",
        "POST",
        {
          slug: slug.trim(),
          title: title.trim(),
          summary:
            summary.trim() || undefined,
          blueprint: {
            overview: {
              goal:
                goal.trim() || undefined,
              deliverables: [],
            },
            releases: [
              {
                key: "release-1",
                title:
                  releaseTitle.trim(),
                sequence: 0,
              },
            ],
            sprints: [
              {
                key: "sprint-1",
                releaseKey: "release-1",
                title:
                  sprintTitle.trim(),
                sequence: 0,
              },
            ],
            tasks: [
              {
                key: "task-1",
                sprintKey: "sprint-1",
                title:
                  taskTitle.trim(),
                priority: "MEDIUM",
                sequence: 0,
              },
            ],
            resources: [],
          },
        },
      )) as {
        template: { id: string };
      };
      showToast({
        tone: "success",
        title: "Template created",
        description:
          "Draft version 1 is ready for review and publishing.",
      });
      setOpen(false);
      reset();
      router.push(
        "/admin/projects/templates/" +
          result.template.id,
      );
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not create the template.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        onClick={() => {
          reset();
          setOpen(true);
        }}
      >
        New template
      </Button>
      <Dialog
        open={open}
        onOpenChange={value => { if (!pending) setOpen(value); }}
        title="Create project template"
        description="Start with a valid release → sprint → task baseline. The draft can be published after review."
      >
        <form
          onSubmit={submit}
          className="grid gap-4"
        >
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-body">
              Template title
            </span>
            <Input
              required
              maxLength={200}
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-body">
              Slug
            </span>
            <Input
              required
              maxLength={80}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={slug}
              onChange={(event) =>
                setSlug(
                  event.target.value.toLowerCase(),
                )
              }
              placeholder="campus-project"
            />
          </label>
          <details className="border-t border-[var(--lms-canvas-border)] pt-3">
            <summary className="cursor-pointer py-2 text-[13px] font-semibold text-body">Additional template details</summary>
          <label className="mt-3 block min-w-0 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-body">
              Summary
            </span>
            <Textarea
              maxLength={2000}
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-body">
              Goal
            </span>
            <Textarea
              maxLength={2000}
              value={goal}
              onChange={(event) =>
                setGoal(event.target.value)
              }
            />
          </label>
          </details>
          <div className="grid min-w-0 gap-3 border-t border-[var(--lms-canvas-border)] pt-4 md:grid-cols-2 min-[992px]:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-body">
                Release
              </span>
              <Input
                required
                maxLength={200}
                value={releaseTitle}
                onChange={(event) =>
                  setReleaseTitle(
                    event.target.value,
                  )
                }
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-body">
                Sprint
              </span>
              <Input
                required
                maxLength={200}
                value={sprintTitle}
                onChange={(event) =>
                  setSprintTitle(
                    event.target.value,
                  )
                }
              />
            </label>
            <label>
              <span className="mb-1.5 block text-[13px] font-semibold leading-4 text-body">
                First task
              </span>
              <Input
                required
                maxLength={200}
                value={taskTitle}
                onChange={(event) =>
                  setTaskTitle(
                    event.target.value,
                  )
                }
              />
            </label>
          </div>
          {error ? (
            <p
              role="alert"
              className="m-0 text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
          <div className="flex flex-col-reverse gap-2 border-t border-[var(--lms-canvas-border)] pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              className="w-full sm:w-auto"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              type="submit"
              loading={pending}
              disabled={
                pending ||
                !slug.trim() ||
                !title.trim() ||
                !releaseTitle.trim() ||
                !sprintTitle.trim() ||
                !taskTitle.trim()
              }
            >
              {pending
                ? "Creating…"
                : "Create template"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function ProjectTemplateActions({
  templateId,
  title,
  status,
  selectedCollegeId,
  assignedToSelectedCollege,
  allowGlobalActions = true,
  blueprint,
}: {
  templateId: string;
  title: string;
  status: string;
  selectedCollegeId: string | null;
  assignedToSelectedCollege: boolean;
  allowGlobalActions?: boolean;
  blueprint?:{overview:{deliverables:readonly string[]};sprints:readonly unknown[];tasks:readonly unknown[]};
}) {
  const lifecycle=projectTemplateGlobalActions(status);
  const [overviewDirty,setOverviewDirty]=useState(false);
  useEffect(()=>{
   const listener=(event:Event)=>{
    const data=(event as CustomEvent<{templateId:string;dirty:boolean}>).detail;
    if(data?.templateId===templateId)setOverviewDirty(data.dirty===true);
   };
   window.addEventListener("project-template-editor-dirty",listener);
   return()=>window.removeEventListener("project-template-editor-dirty",listener);
  },[templateId]);
  const missing=[
   ...(blueprint&&!blueprint.overview.deliverables.length?["deliverables"]:[]),
   ...(blueprint&&!blueprint.sprints.length?["sprints"]:[]),
   ...(blueprint&&!blueprint.tasks.length?["tasks"]:[]),
  ];
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] =
    useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] =
    useState(false);

  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [duplicateOpen,setDuplicateOpen]=useState(false);
  const [copyTitle,setCopyTitle]=useState(title+" Copy");
  const [copySlug,setCopySlug]=useState(""),[copySummary,setCopySummary]=useState("");

  async function mutate(
    label: string,
    path: string,
    method: "POST" | "DELETE",
    body?: unknown,
  ) {
    if(label==="Publish template"&&(overviewDirty||missing.length)){
      showToast({tone:"error",title:overviewDirty?
       "Save your overview changes before publishing":"Complete the template before publishing",
       description:missing.length?"Missing "+missing.join(", "):"Save or discard your overview changes first."});
      return;
    }
    setPending(label);
    try {
      await projectMutation(
        path,
        method,
        body,
      );
      showToast({
        tone: "success",
        title: label,
        description:
          title + " was updated successfully.",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title:
          "Could not " +
          label.toLowerCase(),
        description:
          caught instanceof Error
            ? caught.message
            : "The request could not be completed.",
      });
    } finally {
      setPending(null);
    }
  }

  async function duplicate() {
    setPending("Duplicate template");
    try {
      const result = (await projectMutation(
        "/api/projects/templates/" +
          templateId +
          "/duplicate",
        "POST",
        {title:copyTitle.trim()||undefined,slug:copySlug.trim()||undefined,
         summary:copySummary.trim()||undefined},
      )) as {
        template: { id: string; title: string };
      };
      showToast({
        tone: "success",
        title: "Template duplicated",
        description:
          "A new Draft copy is ready to edit.",
      });
      router.push(
        "/admin/projects/templates/" +
          result.template.id,
      );
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Could not duplicate template",
        description:
          caught instanceof Error
            ? caught.message
            : "The request could not be completed.",
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {allowGlobalActions && lifecycle.canPublish ? (
          <Button
            size="sm"
            loading={pending === "Publish template"}
            disabled={pending !== null || overviewDirty || missing.length>0}
            title={overviewDirty?"Save your overview changes before publishing":
              missing.length?"Complete "+missing.join(", ")+" before publishing":undefined}
            onClick={() =>
              void mutate(
                "Publish template",
                "/api/projects/templates/" + templateId + "/publish",
                "POST",
              )
            }
          >
            {pending === "Publish template" ? "Publishing…" : "Publish"}
          </Button>
        ) : null}

        {allowGlobalActions&&lifecycle.canPublish&&(overviewDirty||missing.length>0)?
          <p role="status" className="text-xs text-warning-text">
            {overviewDirty?"Save your overview changes before publishing.": "Publishing requires "+
            missing.join(", ")+". "}
            {missing.includes("deliverables")?<a className="ml-1 underline"
              href={"/admin/projects/templates/"+encodeURIComponent(templateId)+"/overview"}>Edit overview</a>:null}
            {missing.includes("sprints")?<a className="ml-1 underline"
              href={"/admin/projects/templates/"+encodeURIComponent(templateId)+"/sprints"}>Add sprints</a>:null}
            {missing.includes("tasks")?<a className="ml-1 underline"
              href={"/admin/projects/templates/"+encodeURIComponent(templateId)+"/tasks"}>Add tasks</a>:null}
          </p>:null}
        {allowGlobalActions && lifecycle.canUnpublish ? (
          <Button
            size="sm"
            variant="secondary"
            loading={pending === "Unpublish template"}
            disabled={pending !== null}
            onClick={() =>
              void mutate(
                "Unpublish template",
                "/api/projects/templates/" + templateId + "/unpublish",
                "POST",
              )
            }
          >
            {pending === "Unpublish template" ? "Unpublishing…" : "Unpublish"}
          </Button>
        ) : null}

        {allowGlobalActions && status === "ARCHIVED" ? (
          <span role="status" className="text-xs text-muted-foreground">
            Archived templates are read-only. Duplicate to start a new draft.
          </span>
        ) : null}

        {allowGlobalActions && lifecycle.canDuplicate ? <Button
          size="sm"
          variant="secondary"
          disabled={pending !== null}
          onClick={() => setDuplicateOpen(true)}
        >
          {pending === "Duplicate template"
            ? "Duplicating…"
            : "Duplicate"}
        </Button> : null}

        {selectedCollegeId &&
        (status === "PUBLISHED" || assignedToSelectedCollege) ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending !== null}
            loading={pending === "Assign to college"}
            onClick={() => {
              if (assignedToSelectedCollege) setConfirmRevoke(true);
              else void mutate("Assign to college", "/api/projects/templates/" + templateId + "/assignments",
                "POST", { collegeId: selectedCollegeId });
            }}
          >
            {assignedToSelectedCollege
              ? "Revoke selected college"
              : "Assign selected college"}
          </Button>
        ) : null}

        {allowGlobalActions && lifecycle.canArchive ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending !== null}
            onClick={() =>
              setConfirmArchive(true)
            }
          >
            Archive
          </Button>
        ) : null}
      </div>

      <Dialog open={duplicateOpen} onOpenChange={value => { if (pending === null) setDuplicateOpen(value); }}
        title="Duplicate project template"
        description="Create a new draft copy. The source template and its assigned workspaces remain unchanged."
        footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" variant="secondary" disabled={pending!==null} onClick={()=>setDuplicateOpen(false)}>Cancel</Button>
          <Button className="w-full sm:w-auto" loading={pending==="Duplicate template"} disabled={pending!==null||!copyTitle.trim()||!copySlug.trim()}
            onClick={()=>void duplicate()}>{pending==="Duplicate template"?"Duplicating…":"Duplicate template"}</Button>
        </div>}>
        <div className="grid gap-3">
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New title
            <Input required maxLength={200} value={copyTitle} onChange={e=>setCopyTitle(e.target.value)}/>
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New slug
            <Input required maxLength={64} pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              value={copySlug} onChange={e=>setCopySlug(e.target.value.toLowerCase())}/>
          </label>
          <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">New summary
            <Textarea maxLength={2000} value={copySummary} onChange={e=>setCopySummary(e.target.value)}/>
          </label>
        </div>
      </Dialog>
      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}
        title="Revoke college assignment?" description={templateAssignmentRevocationNotice()}
        footer={<div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button className="w-full sm:w-auto" variant="secondary" disabled={pending !== null} onClick={() => setConfirmRevoke(false)}>Cancel</Button>
          <Button disabled={pending !== null || !selectedCollegeId} onClick={() => {
            if (!selectedCollegeId) return;
            setConfirmRevoke(false);
            void mutate("Revoke college assignment", "/api/projects/templates/" + templateId + "/assignments",
              "DELETE", { collegeId: selectedCollegeId });
          }} className="w-full sm:w-auto" loading={pending==="Revoke college assignment"}>Confirm revocation</Button>
        </div>}>
        <p className="text-sm text-body">Only this college&apos;s availability changes.</p>
      </Dialog>

      {allowGlobalActions ? <Dialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive project template?"
        description="Archiving hides this template from normal creation flows. Active college assignments must be revoked first; existing workspaces are unaffected."
        footer={
          <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button className="w-full sm:w-auto"
              variant="secondary"
              disabled={pending !== null}
              onClick={() =>
                setConfirmArchive(false)
              }
            >
              Cancel
            </Button>
            <Button
              className="w-full sm:w-auto"
              loading={pending === "Archive template"}
              disabled={pending !== null}
              onClick={() => {
                setConfirmArchive(false);
                void mutate(
                  "Archive template",
                  "/api/projects/templates/" +
                    templateId,
                  "DELETE",
                );
              }}
            >
              {pending === "Archive template"
                ? "Archiving…"
                : "Archive template"}
            </Button>
          </div>
        }
      >
        <p className="m-0 text-sm leading-6 text-body">
          Existing project workspaces remain pinned to their materialized template version.
        </p>
      </Dialog> : null}
    </>
  );
}
