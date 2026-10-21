"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Menu, MenuItem } from "@/components/ui/menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { courseApiError } from "./learner-course-api";

async function requestJson(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers: body
      ? { "Content-Type": "application/json" }
      : undefined,
    body: body
      ? JSON.stringify(body)
      : undefined,
  });

  if (!response.ok) {
    throw new Error(
      await courseApiError(response),
    );
  }

  return response.json();
}

function useLearningMutation() {
  const router = useRouter();
  const { showToast } = useToast();
  const {pending,run:guardedRun}=useGuardedAction();

  function run(
    task: () => Promise<unknown>,
    successTitle: string,
    onSuccess?: () => void,
    onFailure?: (error: unknown) => void,
  ) {
    void guardedRun(async () => {
      try {
        await task();
        onSuccess?.();
        showToast({
          tone: "success",
          title: successTitle,
        });
        router.refresh();
      } catch (error) {
        onFailure?.(error);
        showToast({
          tone: "error",
          title: "Learning structure update failed",
          description:
            error instanceof Error
              ? error.message
              : "The request could not be completed.",
        });
      }
    });
  }

  return { pending, run };
}

export function CreateLearningPathPanel({
  offeringId,
  defaultTitle,
}: {
  offeringId: string;
  defaultTitle: string;
}) {
  const [title, setTitle] =
    useState(defaultTitle);
  const [description, setDescription] =
    useState("");
  const { pending, run } =
    useLearningMutation();

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    run(
      () =>
        requestJson(
          "/api/courses/learning-paths",
          "POST",
          {
            offeringId,
            title,
            description:
              description.trim() || null,
          },
        ),
      "Learning Path created",
      () => {
        setDescription("");
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      className="border-b border-border pb-5"
    >
      <h2 className="m-0 text-lg font-semibold text-foreground">
        Create shared Learning Path
      </h2>
      <p className="mt-1 text-sm leading-6 text-body">
        This path becomes the common lesson
        structure for every Section Delivery in
        this Offering.
      </p>
      <div className="mt-4 grid gap-4">
        <label>
          <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
            Title
          </span>
          <Input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            maxLength={255}
            required
          />
        </label>
        <label>
          <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
            Description
          </span>
          <Textarea
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            maxLength={5000}
            placeholder="Optional path description"
          />
        </label>
      </div>
      <div className="mt-[var(--lms-space-4)] flex justify-stretch md:justify-end [&>button]:w-full md:[&>button]:w-auto">
        <Button
          type="submit"
          loading={pending}
          disabled={
            pending || !title.trim()
          }
        >
          {pending
            ? "Creating…"
            : "Create Learning Path"}
        </Button>
      </div>
    </form>
  );
}

export function LearningPathActions({
  learningPath,
}: {
  learningPath: {
    id: string;
    title: string;
    description: string | null;
    status:
      | "DRAFT"
      | "PUBLISHED"
      | "ARCHIVED";
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const [title, setTitle] =
    useState(learningPath.title);
  const [description, setDescription] =
    useState(
      learningPath.description ?? "",
    );
  const { pending, run } =
    useLearningMutation();

  function openEdit() {
    setTitle(learningPath.title);
    setDescription(
      learningPath.description ?? "",
    );
    setEditOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Button
          size="sm"
          variant="secondary"
          onClick={openEdit}
        >
          Edit
        </Button>
        {learningPath.status ===
        "DRAFT" ? (
          <Button
            size="sm"
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  requestJson(
                    "/api/courses/learning-paths/" +
                      learningPath.id +
                      "/transition",
                    "POST",
                    { action: "PUBLISH" },
                  ),
                "Learning Path published",
              )
            }
          >
            {pending
              ? "Publishing…"
              : "Publish path"}
          </Button>
        ) : null}
        {learningPath.status === "PUBLISHED" ? (
          <Button size="sm" variant="secondary"
            onClick={() => setUnpublishOpen(true)}
            disabled={pending}>
            Unpublish
          </Button>
        ) : null}
        <Dropdown trigger="More" label="Learning structure actions" mobileSheet align="end" triggerClassName="md:!min-h-9"><Menu className="w-full min-w-0"><MenuItem onClick={() => setArchiveOpen(true)}>Archive</MenuItem></Menu></Dropdown>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={next=>{if(!pending)setEditOpen(next);}}
        dismissible={!pending}
        title="Edit Learning Path"
        description="The Offering relationship is immutable."
        footer={
          <div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() =>
                setEditOpen(false)
              }
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending || !title.trim()
              }
              onClick={() =>
                run(
                  () =>
                    requestJson(
                      "/api/courses/learning-paths/" +
                        learningPath.id,
                      "PATCH",
                      {
                        title,
                        description:
                          description.trim() ||
                          null,
                      },
                    ),
                  "Learning Path updated",
                  () => setEditOpen(false),
                )
              }
            >
              {pending
                ? "Saving…"
                : "Save"}
            </Button>
          </div>
        }
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)]">
          <label>
            <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
              Title
            </span>
            <Input
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              maxLength={255}
            />
          </label>
          <label>
            <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
              Description
            </span>
            <Textarea
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={5000}
            />
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={unpublishOpen}
        onOpenChange={setUnpublishOpen}
        title="Unpublish learning path?"
        description="Unpublishing is blocked if learner content progress, assignment submissions, or quiz attempts exist."
        confirmLabel="Unpublish path"
        pending={pending}
        onConfirm={() => run(
          () => requestJson(
            "/api/courses/learning-paths/" + learningPath.id + "/transition",
            "POST", { action: "UNPUBLISH" },
          ),
          "Learning Path unpublished",
          () => setUnpublishOpen(false),
        )}
      />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={
          "Archive " +
          learningPath.title +
          "?"
        }
        description="The path leaves active Course surfaces, while historical records remain preserved."
        confirmLabel="Archive path"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              requestJson(
                "/api/courses/learning-paths/" +
                  learningPath.id +
                  "/transition",
                "POST",
                { action: "ARCHIVE" },
              ),
            "Learning Path archived",
            () => setArchiveOpen(false),
          )
        }
      />
    </>
  );
}

export function CreateLessonForm({
  learningPathId,
  nextSequence,
}: {
  learningPathId: string;
  nextSequence: number;
}) {
  const [name, setName] =
    useState("");
  const [description, setDescription] =
    useState("");
  const { pending, run } =
    useLearningMutation();

  function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    run(
      () =>
        requestJson(
          "/api/courses/lessons",
          "POST",
          {
            learningPathId,
            name,
            description:
              description.trim() || null,
            sequence: nextSequence,
          },
        ),
      "Lesson created",
      () => {
        setName("");
        setDescription("");
      },
    );
  }

  return (
    <form
      onSubmit={submit}
      className="min-w-0 border-t border-border pt-[var(--lms-space-4)]"
    >
      <p className="m-0 text-sm font-semibold text-foreground">
        Add Lesson
      </p>
      <div className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]">
        <label>
          <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
            Name
          </span>
          <Input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            maxLength={255}
            required
          />
        </label>
        <label>
          <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
            Description
          </span>
          <Input
            value={description}
            onChange={(event) =>
              setDescription(
                event.target.value,
              )
            }
            maxLength={5000}
            placeholder="Optional"
          />
        </label>
        <Button
          type="submit"
          disabled={
            pending || !name.trim()
          }
        >
          {pending
            ? "Adding…"
            : "Add Lesson"}
        </Button>
      </div>
    </form>
  );
}

export function LessonActions({
  lesson,
}: {
  lesson: {
    id: string;
    name: string;
    description: string | null;
    sequence: number;
    updatedAt: Date | string;
    visibleToStudents?: boolean;
  };
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [typedArchiveName, setTypedArchiveName] = useState("");
  const [name, setName] = useState(lesson.name);
  const [description, setDescription] = useState(lesson.description ?? "");
  const [visibleToStudents,setVisibleToStudents]=useState(lesson.visibleToStudents??true);
  const {showToast}=useToast();
  const [editFailure, setEditFailure] = useState("");
  const [archiveFailure, setArchiveFailure] = useState("");
  const { pending, run } = useLearningMutation();
  const dirty = name !== lesson.name || description !== (lesson.description ?? "") ||
    (lesson.visibleToStudents!==undefined && visibleToStudents!==lesson.visibleToStudents);
  const validName = name.trim().length > 0 && name.trim().length <= 255;
  function dismissEdit(next: boolean) {
    if (pending) {showToast({tone:"warning",title:"Wait for the lesson save to finish."});return;}
    if (!next && dirty) { setDiscardOpen(true); return; }
    setEditOpen(next);
  }
  function openEdit() {
    if (pending) return;
    setName(lesson.name);
    setDescription(lesson.description ?? "");
    setVisibleToStudents(lesson.visibleToStudents??true);
    setEditFailure("");
    setDiscardOpen(false);
    setEditOpen(true);
  }
  function openArchive() {
    if (pending) return;
    setTypedArchiveName("");
    setArchiveFailure("");
    setArchiveOpen(true);
  }
  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Button size="sm" variant="secondary" disabled={pending} onClick={openEdit}
         aria-label={"Edit lesson "+lesson.name} className="min-h-11 gap-1.5 md:min-h-9">
         <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          strokeLinejoin="round"><path d="m15 5 4 4M4 20l5-1 11-11a2 2 0 0 0-4-4L5 15z"/></svg>
         Edit
        </Button>
        <Button size="sm" variant="danger" disabled={pending} onClick={openArchive}
         aria-label={"Delete lesson "+lesson.name} className="min-h-11 gap-1.5 md:min-h-9">
         <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
          strokeLinejoin="round"><path d="M3 6h18M8 6V4h8v2M5 6l1 14h12l1-14M10 10v6m4-6v6"/></svg>
         Delete
        </Button>
      </div>
      <Dialog
        open={editOpen}
        onOpenChange={dismissEdit}
        dismissible
        className="max-w-[520px]"
        title={"Edit lesson “"+lesson.name+"”"}
        description="Course membership is managed by the Learning Path. Use the Reorder tool to change lesson order and the Visibility control to show or hide the lesson."
        footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
          <Button variant="secondary" disabled={pending} onClick={() => dismissEdit(false)}>Cancel</Button>
          <Button disabled={pending || !validName} onClick={() => {
            setEditFailure("");
            run(
              () => requestJson("/api/courses/lessons/" + lesson.id, "PATCH", {
                name: name.trim(),
                description: description.trim() || null,
                ...(lesson.visibleToStudents!==undefined?{visibleToStudents}:{}),
                expectedUpdatedAt: new Date(lesson.updatedAt).toISOString(),
              }),
              "Updated lesson “" + name.trim() + "”.",
              () => {setEditOpen(false);setEditFailure("");},
              error => setEditFailure(error instanceof Error ? error.message : "Review your changes and retry."),
            );
          }}>{pending ? "Saving…" : "Save Changes"}</Button>
        </div>}
      >
        <div className="grid min-w-0 gap-[var(--lms-space-4)]">
          <label>
            <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">Name</span>
            <Input value={name} onChange={event=>setName(event.target.value)} maxLength={255}
              aria-invalid={!validName} aria-describedby={!validName ? "lesson-name-error" : undefined}/>
            {!validName?<span id="lesson-name-error" role="alert" className="mt-1 block text-xs text-error">
              {name.trim() ? "Maximum 255 characters" : "Enter lesson name"}
            </span>:null}
          </label>
          <label>
            <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">Description</span>
            <Textarea value={description} onChange={event=>setDescription(event.target.value)} maxLength={5000}/>
          </label>
          {lesson.visibleToStudents!==undefined?<label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-body">
            <input type="checkbox" className="h-4 w-4 accent-[var(--lms-primary)]"
             checked={visibleToStudents} disabled={pending}
             onChange={event=>setVisibleToStudents(event.target.checked)}/>
            Visible to students
          </label>:null}
          <p className="text-xs text-muted-foreground">
           The parent course and learning path are immutable. Change lesson order using Reorder.
          </p>
          {editFailure?<div role="alert" className="space-y-2 rounded border border-danger p-3">
            <p className="text-sm font-semibold text-error">Lesson changes were not saved</p>
            <p className="text-sm text-body">{editFailure}</p>
            <Button size="sm" variant="secondary" onClick={()=>setEditFailure("")}>Dismiss</Button>
          </div>:null}
        </div>
      </Dialog>
      <ConfirmDialog open={discardOpen} onOpenChange={setDiscardOpen}
        title={"Discard edits to “" + lesson.name + "”?"}
        description="Unsaved changes will be lost." confirmLabel="Discard edits"
        onConfirm={()=>{setDiscardOpen(false);setEditOpen(false);setEditFailure("");}}/>
      <ConfirmDialog open={archiveOpen}
        onOpenChange={next=>{if(!pending){setArchiveOpen(next);if(!next)setTypedArchiveName("");}}}
        title={"Delete lesson “"+lesson.name+"”?"}
        description="This archives the lesson: students and teachers lose access immediately. Uploaded files, learner progress and submissions are retained for restoration. No files are deleted."
        confirmLabel="Delete lesson"
        pending={pending}
        confirmDisabled={typedArchiveName!==lesson.name}
        onConfirm={()=>{
          if (typedArchiveName!==lesson.name || pending) return;
          setArchiveFailure("");
          run(
            () => requestJson("/api/courses/lessons/" + lesson.id, "DELETE"),
            "Lesson deleted successfully. Uploaded files and learner progress are kept for restoration.",
            () => {setArchiveOpen(false);setTypedArchiveName("");},
            error => setArchiveFailure(error instanceof Error ? error.message : "Archive failed; refresh and try again."),
          );
        }}>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-body">
            Type the lesson name to confirm: <strong>{lesson.name}</strong>
            <Input value={typedArchiveName} autoComplete="off" disabled={pending}
              onChange={event=>setTypedArchiveName(event.target.value)}
              aria-label={"Type lesson name to confirm deleting "+lesson.name}
              className="mt-2" />
          </label>
          {archiveFailure?<p role="alert" className="text-sm text-error">
            Lesson was not archived. {archiveFailure}
          </p>:null}
        </div>
      </ConfirmDialog>
    </>
  );
}

export function AdminQuizResultsActions({
  quizId,
  status,
  resultsPublished,
  deadlineReached = false,
}: {
  quizId: string;
  status:
    | "DRAFT"
    | "PUBLISHED"
    | "CLOSED"
    | "ARCHIVED";
  resultsPublished: boolean;
  deadlineReached?: boolean;
}) {
  const { pending, run } =
    useLearningMutation();

  if(status!=="CLOSED" && !(status==="PUBLISHED" && deadlineReached))
    return null;

  return (
    <Button
      size="sm"
      variant={
        resultsPublished
          ? "ghost"
          : "secondary"
      }
      disabled={pending}
      onClick={() =>
        run(
          () =>
            requestJson(
              "/api/courses/quizzes/" +
                quizId +
                "/results",
              "POST",
              {
                published:
                  !resultsPublished,
              },
            ),
          resultsPublished
            ? "Results withheld from learners"
            : "Results released to learners",
        )
      }
    >
      {pending
        ? "Saving…"
        : resultsPublished
          ? "Withhold results"
          : "Release results"}
    </Button>
  );
}
