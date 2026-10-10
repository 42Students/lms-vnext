"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { courseApiError } from "./learner-course-api";

type Kind = "ASSIGNMENT" | "QUIZ";

type EditableAssessment = {
  id: string;
  kind: Kind;
  title: string;
  description: string | null;
  dueAt: Date | string | null;
  status: string;
  maxPoints?: number;
  maxAttempts?: number;
};

function toLocalDateTime(
  value: Date | string | null,
) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(
    date.getTime() - offset * 60_000,
  )
    .toISOString()
    .slice(0, 16);
}

function toIso(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Choose a valid due date.");
  }
  return date.toISOString();
}

export function FacultyAssessmentEditor({
  assessment,
}: {
  assessment: EditableAssessment;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(
    assessment.title,
  );
  const [description, setDescription] =
    useState(assessment.description ?? "");
  const [dueAt, setDueAt] = useState(
    toLocalDateTime(assessment.dueAt),
  );
  const [points, setPoints] = useState(
    assessment.kind === "ASSIGNMENT"
      ? String(assessment.maxPoints ?? 10)
      : String(assessment.maxAttempts ?? 1),
  );
  const [saving, setSaving] =
    useState(false);
  const [deleting, setDeleting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const itemPath =
    assessment.kind === "ASSIGNMENT"
      ? `/api/courses/assignments/${assessment.id}`
      : `/api/courses/quizzes/${assessment.id}`;
  const transitionPath =
    assessment.kind === "ASSIGNMENT"
      ? `/api/courses/assignments/${assessment.id}/transition`
      : `/api/courses/quizzes/${assessment.id}/transition`;

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (saving || deleting) return;

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("Enter a title.");
      return;
    }

    const number = Number(points);
    if (
      !Number.isInteger(number) ||
      number < 1 ||
      (assessment.kind === "ASSIGNMENT"
        ? number > 10000
        : number > 20)
    ) {
      setError(
        assessment.kind === "ASSIGNMENT"
          ? "Maximum points must be between 1 and 10000."
          : "Maximum attempts must be between 1 and 20.",
      );
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const response = await fetch(itemPath, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: cleanTitle,
          description:
            description.trim() || null,
          dueAt: toIso(dueAt),
          ...(assessment.kind ===
          "ASSIGNMENT"
            ? { maxPoints: number }
            : { maxAttempts: number }),
        }),
      });
      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save this assessment.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAssessment() {
    if (saving || deleting) return;
    if (
      !window.confirm(
        `Delete this ${assessment.kind.toLowerCase()} from active Course surfaces? Existing historical attempts/submissions will be preserved.`,
      )
    ) {
      return;
    }

    setError(null);
    setDeleting(true);
    try {
      const response = await fetch(
        transitionPath,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action: "ARCHIVE",
          }),
        },
      );
      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError(
        "Could not delete this assessment. Check your connection and try again.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
      >
        Edit
      </Button>

      <Drawer
        open={open}
        onOpenChange={setOpen}
        title={`Edit ${assessment.kind === "QUIZ" ? "Quiz" : "Assignment"}`}
        description={
          assessment.kind === "QUIZ" &&
          assessment.status !== "DRAFT"
            ? "Published Quiz metadata may be edited, but question structure remains immutable once the Quiz leaves Draft."
            : "Changes keep the same assessment identity and learner history."
        }
        footer={
          <>
            <Button
              variant="danger"
              disabled={saving || deleting}
              onClick={deleteAssessment}
            >
              {deleting
                ? "Deleting…"
                : "Delete"}
            </Button>
            <Button
              type="submit"
              form={`faculty-assessment-edit-${assessment.id}`}
              disabled={saving || deleting}
            >
              {saving
                ? "Saving…"
                : "Save changes"}
            </Button>
          </>
        }
      >
        <form
          id={`faculty-assessment-edit-${assessment.id}`}
          onSubmit={save}
          className="space-y-4"
        >
          <label className="block text-sm font-semibold text-body">
            Title
            <Input
              className="mt-1.5"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              required
              maxLength={255}
            />
          </label>

          <label className="block text-sm font-semibold text-body">
            Description
            <Textarea
              className="mt-1.5"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value,
                )
              }
              maxLength={10000}
            />
          </label>

          <label className="block text-sm font-semibold text-body">
            Due date
            <Input
              className="mt-1.5"
              type="datetime-local"
              value={dueAt}
              onChange={(event) =>
                setDueAt(event.target.value)
              }
            />
          </label>

          <label className="block text-sm font-semibold text-body">
            {assessment.kind === "ASSIGNMENT"
              ? "Maximum points"
              : "Maximum attempts"}
            <Input
              className="mt-1.5"
              type="number"
              min={1}
              max={
                assessment.kind ===
                "ASSIGNMENT"
                  ? 10000
                  : 20
              }
              value={points}
              onChange={(event) =>
                setPoints(event.target.value)
              }
              required
            />
          </label>

          {error ? (
            <p
              role="alert"
              className="text-sm font-semibold text-error"
            >
              {error}
            </p>
          ) : null}
        </form>
      </Drawer>
    </>
  );
}
