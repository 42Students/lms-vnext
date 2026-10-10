"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
}: {
  collegeId: string;
  basePath: string;
  templates: readonly AssignedProjectTemplateChoice[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openDialog() {
    setTemplateId(templates[0]?.templateId ?? "");
    setTitle("");
    setSlug("");
    setSummary("");
    setMentorMembershipId("");
    setMentorsError(null);
    setError(null);
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setMentorsLoading(true);
    setMentorsError(null);

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
        setMentors(body.mentors ?? []);
      })
      .catch((caught: unknown) => {
        if (
          caught instanceof DOMException &&
          caught.name === "AbortError"
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

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
          primaryMentorMembershipId:
            mentorMembershipId || undefined,
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

  return (
    <>
      <Button size="sm" onClick={openDialog}>
        Create Project
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Create Project"
        description="Create an independent Project workspace from the exact published template version assigned to this college."
      >
        <form onSubmit={submit} className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
            <span className="mb-1.5 block text-xs font-semibold text-body">
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                pending ||
                !templateId ||
                !title.trim() ||
                !slug.trim()
              }
            >
              {pending ? "Creating…" : "Create Project"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
