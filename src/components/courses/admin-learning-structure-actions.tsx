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
  };
}) {
  const [editOpen, setEditOpen] =
    useState(false);
  const [archiveOpen, setArchiveOpen] =
    useState(false);
  const [name, setName] =
    useState(lesson.name);
  const [description, setDescription] =
    useState(
      lesson.description ?? "",
    );
  const [sequence, setSequence] =
    useState(String(lesson.sequence));
  const { pending, run } =
    useLearningMutation();

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-[var(--lms-space-2)]">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setName(lesson.name);
            setDescription(
              lesson.description ?? "",
            );
            setSequence(
              String(lesson.sequence),
            );
            setEditOpen(true);
          }}
        >
          Edit
        </Button>
        <Dropdown trigger="More" label="Lesson actions" mobileSheet align="end" triggerClassName="md:!min-h-9"><Menu className="w-full min-w-0"><MenuItem onClick={() => setArchiveOpen(true)}>Archive</MenuItem></Menu></Dropdown>
      </div>

      <Dialog
        open={editOpen}
        onOpenChange={next=>{if(!pending)setEditOpen(next);}}
        dismissible={!pending}
        title="Edit Lesson"
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
                pending ||
                !name.trim() ||
                !sequence.trim() || !Number.isInteger(Number(sequence)) || Number(sequence)<0 || Number(sequence)>10000
              }
              onClick={() =>
                run(
                  () =>
                    requestJson(
                      "/api/courses/lessons/" +
                        lesson.id,
                      "PATCH",
                      {
                        name,
                        description:
                          description.trim() ||
                          null,
                        sequence:
                          Number(sequence),
                        expectedUpdatedAt:new Date(lesson.updatedAt).toISOString(),
                      },
                    ),
                  "Lesson updated",
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
              Name
            </span>
            <Input
              value={name}
              onChange={(event) =>
                setName(event.target.value)
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
          <label>
            <span className="mb-[var(--lms-space-2)] block text-xs font-semibold text-body">
              Order
            </span>
            <Input
              type="number"
              min={0}
              max={10000}
              value={sequence}
              onChange={(event) =>
                setSequence(
                  event.target.value,
                )
              }
            />
          </label>
        </div>
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={
          "Archive " + lesson.name + "?"
        }
        description="The Lesson and its active learning items leave current Course surfaces. Historical records remain preserved."
        confirmLabel="Archive Lesson"
        pending={pending}
        onConfirm={() =>
          run(
            () =>
              requestJson(
                "/api/courses/lessons/" +
                  lesson.id,
                "DELETE",
              ),
            "Lesson archived",
            () => setArchiveOpen(false),
          )
        }
      />
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
            ? "Quiz results hidden"
            : "Quiz results published",
        )
      }
    >
      {pending
        ? "Saving…"
        : resultsPublished
          ? "Hide results"
          : "Publish results"}
    </Button>
  );
}
