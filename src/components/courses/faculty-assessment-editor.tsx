"use client";

import {
  type FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { authoringLocalDateTime, authoringDueInstant } from "@/modules/courses/faculty-authoring-datetime-model";
import { courseApiError } from "./learner-course-api";
import { facultyAssessmentLimitEditable, facultyAssessmentLimitPatch, facultyAssessmentCanArchive, facultyAssessmentEditReceiptMatches, facultyAssessmentArchiveReceiptMatches } from "@/modules/courses/faculty-assessment-editor-model";

type Kind = "ASSIGNMENT" | "QUIZ";

type EditableAssessment = {
  id: string;
  kind: Kind;
  title: string;
  description: string | null;
  dueAt: Date | string | null;
  status: string;
  updatedAt: Date | string;
  maxPoints?: number;
  maxAttempts?: number;
};

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
    authoringLocalDateTime(assessment.dueAt),
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

  const dirty = title !== assessment.title || description !== (assessment.description ?? "") ||
    dueAt !== authoringLocalDateTime(assessment.dueAt) ||
    points !== String(assessment.kind === "ASSIGNMENT" ? (assessment.maxPoints ?? 10) : (assessment.maxAttempts ?? 1));
  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);
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
        ? number > 1000
        : number > 20)
    ) {
      setError(
        assessment.kind === "ASSIGNMENT"
          ? "Enter a whole number from 1 to 1000"
          : "Maximum attempts must be between 1 and 20.",
      );
      return;
    }

    if (!window.confirm(assessment.kind === "QUIZ" && assessment.status !== "DRAFT"
      ? "Confirm metadata-only Quiz edits? Existing questions and learner attempts remain unchanged."
      : "Confirm these draft assessment edits?")) return;
    setError(null);
    setSaving(true);
    try {
      const response = await fetch(itemPath, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          expectedUpdatedAt: new Date(assessment.updatedAt).toISOString(),
          confirmed: true,
          title: cleanTitle,
          description:
            description.trim() || null,
          dueAt: authoringDueInstant(dueAt),
          ...facultyAssessmentLimitPatch(assessment.kind,assessment.status,number),
        }),
      });
      if (!response.ok) {
        setError(response.status===409 && assessment.kind==="ASSIGNMENT"
          ? "Learner submissions exist. Deadline, points, audience, resources and submission methods are locked. You can still correct the title."
          : await courseApiError(response));
        return;
      }
      const receipt:unknown=await response.json().catch(()=>null);
      if(!facultyAssessmentEditReceiptMatches(assessment.kind,assessment.id,assessment.status,cleanTitle,receipt)){
        setError("The save result could not be verified. Reload this Section before retrying.");
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
    if (saving || deleting || !facultyAssessmentCanArchive(assessment.kind,assessment.status)) return;
    if (
      !window.confirm(
        `Archive this ${assessment.kind.toLowerCase()} from active Course surfaces? Existing historical attempts/submissions will be preserved.`,
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
            expectedUpdatedAt: new Date(assessment.updatedAt).toISOString(),
            confirmed: true,
          }),
        },
      );
      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }
      const receipt:unknown=await response.json().catch(()=>null);
      if(!facultyAssessmentArchiveReceiptMatches(assessment.kind,assessment.id,assessment.title,receipt)){
        setError("The archive result could not be verified. Reload this Section before trying again.");
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
          // Reset from latest server props every time: cancelled edits and
          // stale local state must not overwrite subsequently refreshed rows.
          setTitle(assessment.title);
          setDescription(assessment.description ?? "");
          setDueAt(authoringLocalDateTime(assessment.dueAt));
          setPoints(assessment.kind === "ASSIGNMENT"
            ? String(assessment.maxPoints ?? 10)
            : String(assessment.maxAttempts ?? 1));
          setError(null);
          setOpen(true);
        }}
      >
        Edit
      </Button>

      <Drawer
        open={open}
        onOpenChange={(next) => {
          if (!next && (saving || deleting)) return;
          if (!next && dirty && !window.confirm(assessment.kind==="QUIZ"?"Discard quiz changes?":"Discard this assignment draft?")) return;
          setOpen(next);
        }}
        title={`Edit ${assessment.kind === "QUIZ" ? "Quiz" : "Assignment"}`}
        description={
          assessment.kind === "QUIZ" &&
          assessment.status !== "DRAFT"
            ? "Published Quiz metadata may be edited, but question structure remains immutable once the Quiz leaves Draft."
            : "Changes keep the same assessment identity and learner history."
        }
        footer={
          <>
            {facultyAssessmentCanArchive(assessment.kind,assessment.status) ? <Button
              variant="danger"
              disabled={saving || deleting}
              onClick={deleteAssessment}
            >
              {deleting
                ? "Deleting…"
                : "Archive"}
            </Button> : null}
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
            Due date (IST)
            <Input
              className="mt-1.5"
              type="datetime-local"
              disabled={assessment.kind==="QUIZ" && assessment.status==="CLOSED"}
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
                  ? 1000
                  : 20
              }
              value={points}
              disabled={!facultyAssessmentLimitEditable(assessment.kind,assessment.status)}
              onChange={(event) =>
                setPoints(event.target.value)
              }
              required
            />
            {!facultyAssessmentLimitEditable(assessment.kind,assessment.status) ?
              <span className="mt-1 block text-xs font-normal text-muted-foreground">The published Quiz attempt limit is locked. Quiz deadlines cannot change after learner attempts or closure.</span> : null}
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
