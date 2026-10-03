"use client";

import {
  type FormEvent,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { courseApiError } from "./learner-course-api";

type SubmissionType = "TEXT" | "LINK";

export function AssignmentSubmissionControl({
  assignmentId,
  deliveryId,
}: {
  assignmentId: string;
  deliveryId: string;
}) {
  const router = useRouter();
  const [submissionType, setSubmissionType] =
    useState<SubmissionType>("TEXT");
  const [textContent, setTextContent] =
    useState("");
  const [submissionUrl, setSubmissionUrl] =
    useState("");
  const [submitting, setSubmitting] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState(false);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (
      submissionType === "TEXT" &&
      !textContent.trim()
    ) {
      setError(
        "Enter your assignment response before submitting.",
      );
      return;
    }

    if (submissionType === "LINK") {
      try {
        const url = new URL(
          submissionUrl.trim(),
        );
        if (url.protocol !== "https:") {
          throw new Error("https required");
        }
      } catch {
        setError(
          "Enter a valid HTTPS submission link.",
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `/api/courses/assignments/${assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            submissionType === "TEXT"
              ? {
                  deliveryId,
                  submissionType,
                  textContent:
                    textContent.trim(),
                }
              : {
                  deliveryId,
                  submissionType,
                  submissionUrl:
                    submissionUrl.trim(),
                },
          ),
        },
      );

      if (!response.ok) {
        setError(
          await courseApiError(response),
        );
        return;
      }

      setSuccess(true);
      router.refresh();
    } catch {
      setError(
        "Could not submit the assignment. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="mt-4 rounded-lg bg-[var(--lms-success-subtle)] px-3 py-2 text-sm font-semibold text-success"
      >
        Assignment submitted successfully.
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="mt-4 rounded-lg border border-border bg-[var(--lms-neutral-50)] p-4"
    >
      <fieldset disabled={submitting}>
        <legend className="text-sm font-semibold text-foreground">
          Submit assignment
        </legend>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Submission is final. Choose a written
          response or an HTTPS link.
        </p>

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Submission type"
        >
          <Button
            type="button"
            size="sm"
            variant={
              submissionType === "TEXT"
                ? "primary"
                : "secondary"
            }
            aria-pressed={
              submissionType === "TEXT"
            }
            onClick={() =>
              setSubmissionType("TEXT")
            }
          >
            Written response
          </Button>
          <Button
            type="button"
            size="sm"
            variant={
              submissionType === "LINK"
                ? "primary"
                : "secondary"
            }
            aria-pressed={
              submissionType === "LINK"
            }
            onClick={() =>
              setSubmissionType("LINK")
            }
          >
            HTTPS link
          </Button>
        </div>

        {submissionType === "TEXT" ? (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Your response
            </span>
            <Textarea
              value={textContent}
              onChange={(event) =>
                setTextContent(
                  event.target.value,
                )
              }
              maxLength={50000}
              placeholder="Write your assignment response…"
              required
            />
          </label>
        ) : (
          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Submission link
            </span>
            <Input
              type="url"
              inputMode="url"
              value={submissionUrl}
              onChange={(event) =>
                setSubmissionUrl(
                  event.target.value,
                )
              }
              placeholder="https://…"
              required
            />
          </label>
        )}

        {error ? (
          <p
            role="alert"
            className="mt-3 text-sm font-semibold text-error"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit">
            {submitting
              ? "Submitting…"
              : "Submit assignment"}
          </Button>
          <span className="text-xs text-muted-foreground">
            You cannot replace the submission
            after it is recorded.
          </span>
        </div>
      </fieldset>
    </form>
  );
}
