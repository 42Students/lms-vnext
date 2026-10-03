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

export function ProjectTaskSubmissionControl({
  projectId,
  taskId,
  disabled = false,
}: {
  projectId: string;
  taskId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [submissionUrl, setSubmissionUrl] =
    useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    try {
      const url = new URL(
        submissionUrl.trim(),
      );
      if (
        url.protocol !== "https:" &&
        url.protocol !== "http:"
      ) {
        throw new Error("bad protocol");
      }
    } catch {
      setError(
        "Enter a valid HTTP or HTTPS submission link.",
      );
      return;
    }

    setPending(true);
    try {
      await projectMutation(
        `/api/projects/${projectId}/tasks/${taskId}/submissions`,
        "POST",
        {
          submissionUrl:
            submissionUrl.trim(),
          note: note.trim() || undefined,
        },
      );
      setOpen(false);
      setSubmissionUrl("");
      setNote("");
      showToast({
        tone: "success",
        title: "Task sent for review",
      });
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Could not submit this task.",
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
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Submit for review
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Submit task for review"
        description="Share the work artifact the mentor should review. Every attempt is preserved."
      >
        <form
          onSubmit={submit}
          className="grid gap-4"
        >
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Work link
            </span>
            <Input
              type="url"
              inputMode="url"
              required
              maxLength={2048}
              value={submissionUrl}
              placeholder="https://…"
              onChange={(event) =>
                setSubmissionUrl(
                  event.target.value,
                )
              }
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-body">
              Note
            </span>
            <Textarea
              value={note}
              maxLength={4000}
              placeholder="Optional context for the reviewer…"
              onChange={(event) =>
                setNote(event.target.value)
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
                pending ||
                !submissionUrl.trim()
              }
            >
              {pending
                ? "Submitting…"
                : "Submit task"}
            </Button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
