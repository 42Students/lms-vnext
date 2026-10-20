"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { apiFetch } from "@/lib/api-fetch";

type Display = {
  introductionText: string | null;
  bodyHtml: string | null;
  takeaways: string[];
  thumbnailUrl: string | null;
  version: number;
} | null;

export function AdminCourseDisplayEditor({
  courseId,
  enabled,
  initial,
}: {
  courseId: string;
  enabled: boolean;
  initial: Display;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const {pending,run:guardedRun}=useGuardedAction();
  const [introductionText, setIntroductionText] =
    useState(initial?.introductionText ?? "");
  const [bodyHtml, setBodyHtml] =
    useState(initial?.bodyHtml ?? "");
  const [takeaways, setTakeaways] =
    useState(
      (initial?.takeaways ?? []).join("\n"),
    );
  const [thumbnailUrl, setThumbnailUrl] =
    useState(initial?.thumbnailUrl ?? "");

  function save() {
    void guardedRun(async () => {
      try {
        await apiFetch<void>(
          `/api/courses/${courseId}/display`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              introductionText:
                introductionText.trim() ||
                null,
              bodyHtml:
                bodyHtml.trim() || null,
              takeaways: takeaways
                .split(/\r?\n/)
                .map((item) =>
                  item
                    .replace(
                      /^\s*(?:[-*•]\s+|\d+[.)]\s+)/,
                      "",
                    )
                    .trim(),
                )
                .filter(Boolean),
              thumbnailUrl:
                thumbnailUrl.trim() ||
                null,
              expectedVersion:
                initial?.version ?? null,
            }),
          },
        );
        showToast({
          tone: "success",
          title:
            "Course overview updated",
          description:
            "Learner and Faculty Course Home will use the saved introduction and takeaways.",
        });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title:
            "Course overview update failed",
          description:
            error instanceof Error
              ? error.message
              : "The request could not be completed.",
        });
      }
    });
  }

  const dirty =
    introductionText !== (initial?.introductionText ?? "") ||
    bodyHtml !== (initial?.bodyHtml ?? "") ||
    takeaways !== (initial?.takeaways ?? []).join("\n") ||
    thumbnailUrl !== (initial?.thumbnailUrl ?? "");
  const thumbnailIssue = Boolean(
    thumbnailUrl.trim() && !/^https:\/\//i.test(thumbnailUrl.trim()),
  );

  if (!enabled) {
    return (
      <section className="min-w-0" aria-label="Course Home content">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="m-0 text-base font-semibold text-foreground">
            Course Home content
          </h3>
          <StatusBadge tone="warning">Migration pending</StatusBadge>
        </div>
        <p className="mt-2 max-w-prose break-words text-sm leading-6 text-body">
          Rich introduction, ordered takeaways and Course thumbnail are staged
          but cannot be persisted until the DB05 migration is verified. The
          existing Course description remains the learner-safe fallback.
        </p>
      </section>
    );
  }

  return (
    <section className="min-w-0" aria-label="Course Home content" aria-busy={pending}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-semibold text-foreground">
            Course Home content
          </h3>
          <p className="mt-1 max-w-prose text-xs leading-5 text-muted-foreground">
            Shared public Course overview.
          </p>
        </div>
        <StatusBadge tone="success">DB05 verified</StatusBadge>
      </div>

      <div className="mt-[var(--lms-space-4)] grid min-w-0 max-w-[920px] gap-[var(--lms-space-4)]">
        <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold leading-5 text-[var(--lms-neutral-400)]">
          Introduction
          <Input
            className="mt-[var(--lms-space-2)] w-full"
            value={introductionText}
            maxLength={500}
            placeholder="One-line hook for the Course Home page"
            disabled={pending}
            onChange={(event) => setIntroductionText(event.target.value)}
          />
        </label>

        <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold leading-5 text-[var(--lms-neutral-400)]">
          What learners will take away
          <Textarea
            className="mt-[var(--lms-space-2)] min-h-32 w-full"
            value={takeaways}
            maxLength={15000}
            placeholder={"One point per line\nUnderstand the core concepts\nApply them in practice"}
            disabled={pending}
            onChange={(event) => setTakeaways(event.target.value)}
          />
          <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
            Order is preserved. Bullet and numbered prefixes are removed.
          </span>
        </label>

        <Disclosure
          title="Advanced formatting and thumbnail"
          defaultOpen={Boolean(initial?.bodyHtml || initial?.thumbnailUrl)}
          className="min-w-0"
          contentClassName="grid min-w-0 gap-[var(--lms-space-4)] px-[var(--lms-space-2)] pt-2"
        >
          <p className="m-0 max-w-prose text-xs leading-5 text-muted-foreground">
            Rich HTML is sanitized to a strict attribute-free formatting allowlist before storage.
          </p>
          <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold leading-5 text-[var(--lms-neutral-400)]">
            Rich description HTML
            <Textarea
              className="mt-[var(--lms-space-2)] min-h-40 w-full font-mono text-sm"
              value={bodyHtml}
              maxLength={20000}
              placeholder="<p>Describe the course...</p>"
              disabled={pending}
              onChange={(event) => setBodyHtml(event.target.value)}
            />
            <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
              Scripts, images, links, attributes and unknown tags are escaped or
              stripped; simple formatting/list/table tags are retained.
            </span>
          </label>
          <label className="block min-w-0 text-[var(--lms-font-sm)] font-semibold leading-5 text-[var(--lms-neutral-400)]">
            Thumbnail URL
            <Input
              className="mt-[var(--lms-space-2)] w-full"
              type="url"
              inputMode="url"
              value={thumbnailUrl}
              error={thumbnailIssue}
              aria-describedby={thumbnailIssue ? "course-thumbnail-issue" : undefined}
              placeholder="https://..."
              disabled={pending}
              onChange={(event) => setThumbnailUrl(event.target.value)}
            />
            {thumbnailIssue ? (
              <span id="course-thumbnail-issue" className="mt-1 block text-xs font-normal text-[var(--lms-error-text)]">
                Enter an HTTPS thumbnail URL.
              </span>
            ) : null}
            <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">
              HTTPS only. Upload-backed thumbnails remain dependent on W01
              private/shared storage.
            </span>
          </label>
        </Disclosure>
      </div>

      <div className="mt-[var(--lms-space-4)] flex min-w-0 flex-col items-stretch gap-2 border-t border-border pt-[var(--lms-space-4)] sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-muted-foreground" role="status">
          {dirty ? "Unsaved changes" : "No unsaved changes"}
        </span>
        <Button
          type="button"
          className="w-full sm:w-auto"
          loading={pending}
          disabled={pending || !dirty || thumbnailIssue}
          onClick={save}
        >
          {pending ? "Saving…" : "Save Course Home"}
        </Button>
      </div>
    </section>
  );
}
