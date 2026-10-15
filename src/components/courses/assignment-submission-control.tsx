"use client";

import {
  type FormEvent,
  useState,
  useRef,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AssignmentFileSubmissionControl } from "./assignment-file-submission-control";
import { courseApiError } from "./learner-course-api";
import { createSubmissionFlightGuard } from "@/modules/courses/learner-submission-flight-model";
import { isLearnerAssignmentHttpsLink } from "@/modules/courses/learner-assignment-link-model";
import { learnerAssignmentFinalConfirmation } from "@/modules/courses/learner-assignment-confirmation-model";

type SubmissionType = "TEXT" | "LINK" | "FILE";

export function AssignmentSubmissionControl({
  assignmentId,
  deliveryId,
  fileUploadsEnabled = false,
}: {
  assignmentId: string;
  deliveryId: string;
  fileUploadsEnabled?: boolean;
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
  const flight = useRef(createSubmissionFlightGuard());

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (submissionType === "FILE" || !flight.current.begin()) return;
    setError(null);
    setSuccess(false);

    if (
      submissionType === "TEXT" &&
      !textContent.trim()
    ) {
      setError(
        "Enter your assignment response before submitting.",
      );
      flight.current.end();
      return;
    }

    if (submissionType === "LINK") {
      if (!isLearnerAssignmentHttpsLink(submissionUrl)) {
        setError(
          "Enter an HTTPS submission link without embedded credentials.",
        );
        flight.current.end();
        return;
      }
    }

    if (!window.confirm(learnerAssignmentFinalConfirmation(submissionType))) {
      flight.current.end();
      return;
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
      flight.current.end();
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
      <fieldset disabled={submitting && submissionType !== "FILE"}>
        <legend className="text-sm font-semibold text-foreground">
          Submit assignment
        </legend>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Submission is final. Choose a written
          response, an HTTPS link, or a file when uploads are available.
        </p>

        <div
          className="mt-3 flex flex-wrap gap-2"
          role="group"
          aria-label="Submission type"
        >
          <Button
            type="button"
            size="sm"
            disabled={submitting}
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
            disabled={submitting}
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
          <Button type="button" size="sm" disabled={!fileUploadsEnabled || submitting}
            variant={submissionType === "FILE" ? "primary" : "secondary"}
            aria-pressed={submissionType === "FILE"} onClick={() => setSubmissionType("FILE")}>
            File upload
          </Button>
        </div>

        {!fileUploadsEnabled ? <p className="mt-2 text-xs text-muted-foreground">File uploads are currently unavailable. You can submit a written response or an HTTPS link.</p> : null}
        {submissionType === "FILE" ? <AssignmentFileSubmissionControl
          assignmentId={assignmentId} deliveryId={deliveryId} onBusyChange={setSubmitting}
          onSubmitted={() => { setSuccess(true); router.refresh(); }} /> : submissionType === "TEXT" ? (
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
              maxLength={2048}
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

        {submissionType !== "FILE" ? <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button type="submit">
            {submitting
              ? "Submitting…"
              : "Submit assignment"}
          </Button>
          <span className="text-xs text-muted-foreground">
            You cannot replace the submission
            after it is recorded.
          </span>
        </div> : null}
      </fieldset>
    </form>
  );
}
