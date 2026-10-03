"use client";

import {
  type FormEvent,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { projectMutation } from "./project-api";

type Submission = {
  id: string;
  version: number;
  status: string;
  summary: string;
  sourceUrl: string | null;
  demoUrl: string | null;
  notes: string | null;
};

export function LearnerFinalDeliveryControl({
  projectId,
  latest,
  canCreateDraft,
  canSubmitDraft,
}: {
  projectId: string;
  latest: Submission | null;
  canCreateDraft: boolean;
  canSubmitDraft: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const draft =
    latest?.status === "DRAFT" ? latest : null;
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState(
    draft?.summary ?? "",
  );
  const [sourceUrl, setSourceUrl] = useState(
    draft?.sourceUrl ?? "",
  );
  const [demoUrl, setDemoUrl] = useState(
    draft?.demoUrl ?? "",
  );
  const [notes, setNotes] = useState(
    draft?.notes ?? "",
  );
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  function resetFromDraft() {
    setSummary(draft?.summary ?? "");
    setSourceUrl(draft?.sourceUrl ?? "");
    setDemoUrl(draft?.demoUrl ?? "");
    setNotes(draft?.notes ?? "");
  }

  async function save(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await projectMutation(
        draft
          ? `/api/projects/${projectId}/submissions/${draft.id}`
          : `/api/projects/${projectId}/submissions`,
        draft ? "PATCH" : "POST",
        {
          summary: summary.trim(),
          sourceUrl:
            sourceUrl.trim() || undefined,
          demoUrl:
            demoUrl.trim() || undefined,
          notes: notes.trim() || undefined,
        },
      );
      setOpen(false);
      showToast({
        tone: "success",
        title: draft
          ? "Final draft updated"
          : "Final draft created",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the final draft.",
      );
    } finally {
      setPending(false);
    }
  }

  async function submitDraft() {
    if (!draft) return;
    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/submissions/${draft.id}/submit`,
        "POST",
      );
      showToast({
        tone: "success",
        title: "Final delivery submitted",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Could not submit final delivery",
        description:
          caught instanceof Error
            ? caught.message
            : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  if (!canCreateDraft && !draft) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(canCreateDraft || draft) ? (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            resetFromDraft();
            setOpen(true);
          }}
        >
          {draft
            ? "Edit final draft"
            : "Create final draft"}
        </Button>
      ) : null}
      {draft ? (
        <Button
          size="sm"
          disabled={
            pending || !canSubmitDraft
          }
          onClick={submitDraft}
          title={
            canSubmitDraft
              ? undefined
              : "Complete every release, sprint and task before submitting."
          }
        >
          {pending
            ? "Submitting…"
            : "Submit final delivery"}
        </Button>
      ) : null}

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={
          draft
            ? "Edit final draft"
            : "Create final draft"
        }
        description="Drafts can be prepared early. Final submission unlocks after Project execution is complete."
      >
        <form
          onSubmit={save}
          className="grid gap-4"
        >
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Summary
            </span>
            <Textarea
              required
              maxLength={6000}
              value={summary}
              onChange={(event) =>
                setSummary(event.target.value)
              }
              placeholder="What did the team build and deliver?"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Source URL
            </span>
            <Input
              type="url"
              value={sourceUrl}
              maxLength={2048}
              placeholder="https://…"
              onChange={(event) =>
                setSourceUrl(
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Demo URL
            </span>
            <Input
              type="url"
              value={demoUrl}
              maxLength={2048}
              placeholder="https://…"
              onChange={(event) =>
                setDemoUrl(event.target.value)
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Notes
            </span>
            <Textarea
              value={notes}
              maxLength={6000}
              onChange={(event) =>
                setNotes(event.target.value)
              }
            />
          </label>
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
                pending || !summary.trim()
              }
            >
              {pending ? "Saving…" : "Save draft"}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}

export function FinalReviewControl({
  projectId,
  submissionId,
}: {
  projectId: string;
  submissionId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [decision, setDecision] = useState<
    "APPROVED" | "CHANGES_REQUESTED"
  >("APPROVED");
  const [feedback, setFeedback] =
    useState("");
  const [pending, setPending] =
    useState(false);

  async function review() {
    if (
      decision === "CHANGES_REQUESTED" &&
      !feedback.trim()
    ) {
      return;
    }

    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/submissions/${submissionId}/review`,
        "POST",
        {
          decision,
          feedback:
            feedback.trim() || undefined,
        },
      );
      setOpen(false);
      setFeedback("");
      showToast({
        tone: "success",
        title:
          decision === "APPROVED"
            ? "Final delivery approved"
            : "Changes requested",
      });
      router.refresh();
    } catch (caught) {
      showToast({
        tone: "error",
        title: "Final review failed",
        description:
          caught instanceof Error
            ? caught.message
            : undefined,
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        Review final delivery
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Review final delivery"
        description="This decision is preserved as immutable Project review history."
        footer={
          <>
            <Button
              variant="secondary"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              disabled={
                pending ||
                (decision ===
                  "CHANGES_REQUESTED" &&
                  !feedback.trim())
              }
              onClick={review}
            >
              {pending
                ? "Saving…"
                : decision === "APPROVED"
                  ? "Approve delivery"
                  : "Request changes"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Decision
            </span>
            <Select
              value={decision}
              onChange={(event) =>
                setDecision(
                  event.target.value as
                    | "APPROVED"
                    | "CHANGES_REQUESTED",
                )
              }
            >
              <option value="APPROVED">
                Approve
              </option>
              <option value="CHANGES_REQUESTED">
                Request changes
              </option>
            </Select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Feedback
            </span>
            <Textarea
              value={feedback}
              maxLength={6000}
              onChange={(event) =>
                setFeedback(event.target.value)
              }
              placeholder={
                decision === "CHANGES_REQUESTED"
                  ? "Explain the required revision…"
                  : "Optional approval note…"
              }
            />
          </label>
        </div>
      </Dialog>
    </>
  );
}

type EvaluationRow = {
  criterion: string;
  score: string;
  maxScore: string;
  feedback: string;
};

function emptyEvaluationRow(): EvaluationRow {
  return {
    criterion: "",
    score: "",
    maxScore: "",
    feedback: "",
  };
}

export function ProjectEvaluationControl({
  projectId,
  submissionId,
}: {
  projectId: string;
  submissionId: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [rows, setRows] = useState<
    EvaluationRow[]
  >([emptyEvaluationRow()]);
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const valid = useMemo(
    () =>
      rows.length > 0 &&
      rows.every((row) => {
        const score = Number(row.score);
        const maxScore = Number(
          row.maxScore,
        );
        return (
          row.criterion.trim().length > 0 &&
          Number.isInteger(score) &&
          Number.isInteger(maxScore) &&
          score >= 0 &&
          maxScore > 0 &&
          score <= maxScore
        );
      }),
    [rows],
  );

  function updateRow(
    index: number,
    patch: Partial<EvaluationRow>,
  ) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index
          ? { ...row, ...patch }
          : row,
      ),
    );
  }

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!valid) return;

    setPending(true);
    setError(null);
    try {
      await projectMutation(
        `/api/projects/${projectId}/submissions/${submissionId}/evaluation`,
        "POST",
        {
          summary: summary.trim() || undefined,
          items: rows.map((row) => ({
            criterion: row.criterion.trim(),
            score: Number(row.score),
            maxScore: Number(row.maxScore),
            feedback:
              row.feedback.trim() || undefined,
          })),
        },
      );
      setOpen(false);
      showToast({
        tone: "success",
        title: "Project evaluation recorded",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not save the evaluation.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => setOpen(true)}
      >
        Evaluate project
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Evaluate approved project"
        description="Score explicit criteria. The total is derived from these rubric rows."
      >
        <form
          onSubmit={submit}
          className="grid gap-4"
        >
          {rows.map((row, index) => (
            <div
              key={index}
              className="rounded-lg border border-border bg-muted p-3"
            >
              <div className="grid gap-3 sm:grid-cols-[1fr_7rem_7rem]">
                <label>
                  <span className="mb-1 block text-xs font-semibold text-body">
                    Criterion
                  </span>
                  <Input
                    value={row.criterion}
                    maxLength={240}
                    onChange={(event) =>
                      updateRow(index, {
                        criterion:
                          event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-body">
                    Score
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={row.score}
                    onChange={(event) =>
                      updateRow(index, {
                        score:
                          event.target.value,
                      })
                    }
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-semibold text-body">
                    Max
                  </span>
                  <Input
                    type="number"
                    min={1}
                    value={row.maxScore}
                    onChange={(event) =>
                      updateRow(index, {
                        maxScore:
                          event.target.value,
                      })
                    }
                  />
                </label>
              </div>
              <label className="mt-3 block">
                <span className="mb-1 block text-xs font-semibold text-body">
                  Feedback
                </span>
                <Textarea
                  value={row.feedback}
                  maxLength={4000}
                  onChange={(event) =>
                    updateRow(index, {
                      feedback:
                        event.target.value,
                    })
                  }
                />
              </label>
              {rows.length > 1 ? (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="mt-2"
                  onClick={() =>
                    setRows((current) =>
                      current.filter(
                        (_, rowIndex) =>
                          rowIndex !== index,
                      ),
                    )
                  }
                >
                  Remove criterion
                </Button>
              ) : null}
            </div>
          ))}

          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={rows.length >= 20}
            onClick={() =>
              setRows((current) => [
                ...current,
                emptyEvaluationRow(),
              ])
            }
          >
            Add criterion
          </Button>

          <label>
            <span className="mb-1 block text-xs font-semibold text-body">
              Overall summary
            </span>
            <Textarea
              value={summary}
              maxLength={6000}
              onChange={(event) =>
                setSummary(event.target.value)
              }
            />
          </label>

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
              disabled={pending || !valid}
            >
              {pending
                ? "Saving…"
                : "Record evaluation"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
