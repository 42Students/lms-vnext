"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
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
        onOpenChange={setOpen}
        title="Create project template"
        description="Start with a valid release → sprint → task baseline. The draft can be published after review."
      >
        <form
          onSubmit={submit}
          className="grid gap-4"
        >
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Slug
            </span>
            <Input
              required
              maxLength={64}
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
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
          <div className="grid gap-3 sm:grid-cols-3">
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-body">
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
              <span className="mb-1.5 block text-xs font-semibold text-body">
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
              <span className="mb-1.5 block text-xs font-semibold text-body">
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
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
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
}: {
  templateId: string;
  title: string;
  status: string;
  selectedCollegeId: string | null;
  assignedToSelectedCollege: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] =
    useState<string | null>(null);
  const [confirmArchive, setConfirmArchive] =
    useState(false);

  async function mutate(
    label: string,
    path: string,
    method: "POST" | "DELETE",
    body?: unknown,
  ) {
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
        {},
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
        {status !== "PUBLISHED" ? (
          <Button
            size="sm"
            disabled={pending !== null}
            onClick={() =>
              void mutate(
                status === "ARCHIVED"
                  ? "Republish template"
                  : "Publish template",
                "/api/projects/templates/" +
                  templateId +
                  "/publish",
                "POST",
              )
            }
          >
            {pending === "Publish template" ||
            pending === "Republish template"
              ? "Publishing…"
              : status === "ARCHIVED"
                ? "Republish"
                : "Publish"}
          </Button>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending !== null}
            onClick={() =>
              void mutate(
                "Unpublish template",
                "/api/projects/templates/" +
                  templateId +
                  "/unpublish",
                "POST",
              )
            }
          >
            {pending === "Unpublish template"
              ? "Unpublishing…"
              : "Unpublish"}
          </Button>
        )}

        {status === "ARCHIVED" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending !== null}
            onClick={() =>
              void mutate(
                "Return template to draft",
                "/api/projects/templates/" +
                  templateId +
                  "/unpublish",
                "POST",
              )
            }
          >
            Return to draft
          </Button>
        ) : null}

        <Button
          size="sm"
          variant="secondary"
          disabled={pending !== null}
          onClick={() => void duplicate()}
        >
          {pending === "Duplicate template"
            ? "Duplicating…"
            : "Duplicate"}
        </Button>

        {selectedCollegeId &&
        status === "PUBLISHED" ? (
          <Button
            size="sm"
            variant="secondary"
            disabled={pending !== null}
            onClick={() =>
              void mutate(
                assignedToSelectedCollege
                  ? "Revoke college assignment"
                  : "Assign to college",
                "/api/projects/templates/" +
                  templateId +
                  "/assignments",
                assignedToSelectedCollege
                  ? "DELETE"
                  : "POST",
                {
                  collegeId:
                    selectedCollegeId,
                },
              )
            }
          >
            {assignedToSelectedCollege
              ? "Revoke selected college"
              : "Assign selected college"}
          </Button>
        ) : null}

        {status !== "ARCHIVED" ? (
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

      <Dialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        title="Archive project template?"
        description="Archiving hides this template from normal creation flows. Active college assignments must be revoked first; existing workspaces are unaffected."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending !== null}
              onClick={() =>
                setConfirmArchive(false)
              }
            >
              Cancel
            </Button>
            <Button
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
          </>
        }
      >
        <p className="m-0 text-sm leading-6 text-body">
          Existing project workspaces remain pinned to their materialized template version.
        </p>
      </Dialog>
    </>
  );
}
