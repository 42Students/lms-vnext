"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/components/ui/toast";
import {useGuardedAction} from "@/hooks/use-guarded-action";
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

  if (!enabled) {
    return (
      <section className="border-b border-border pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-base font-semibold text-foreground">
            Course Home content
          </h2>
          <StatusBadge tone="warning">
            Migration pending
          </StatusBadge>
        </div>
        <p className="mt-2 text-sm leading-6 text-body">
          Rich introduction, ordered takeaways and Course thumbnail are staged
          but cannot be persisted until the DB05 migration is verified. The
          existing Course description remains the learner-safe fallback.
        </p>
      </section>
    );
  }

  return (
    <section className="border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="m-0 text-base font-semibold text-foreground">
            Course Home content
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Shared public Course overview. Rich HTML is sanitized to a strict
            attribute-free formatting allowlist before storage.
          </p>
        </div>
        <StatusBadge tone="success">
          DB05 verified
        </StatusBadge>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="text-sm font-semibold text-body">
          Introduction
          <Input
            className="mt-1.5"
            value={introductionText}
            maxLength={500}
            placeholder="One-line hook for the Course Home page"
            onChange={(event) =>
              setIntroductionText(
                event.target.value,
              )
            }
          />
        </label>

        <label className="text-sm font-semibold text-body">
          Rich description HTML
          <Textarea
            className="mt-1.5 min-h-40 font-mono text-sm"
            value={bodyHtml}
            maxLength={20000}
            placeholder="<p>Describe the course...</p>"
            onChange={(event) =>
              setBodyHtml(
                event.target.value,
              )
            }
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Scripts, images, links, attributes and unknown tags are escaped or
            stripped; simple formatting/list/table tags are retained.
          </span>
        </label>

        <label className="text-sm font-semibold text-body">
          What learners will take away
          <Textarea
            className="mt-1.5 min-h-32"
            value={takeaways}
            maxLength={15000}
            placeholder={"One point per line\nUnderstand the core concepts\nApply them in practice"}
            onChange={(event) =>
              setTakeaways(
                event.target.value,
              )
            }
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            Order is preserved. Bullet and numbered prefixes are removed.
          </span>
        </label>

        <label className="text-sm font-semibold text-body">
          Thumbnail URL
          <Input
            className="mt-1.5"
            type="url"
            inputMode="url"
            value={thumbnailUrl}
            placeholder="https://..."
            onChange={(event) =>
              setThumbnailUrl(
                event.target.value,
              )
            }
          />
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            HTTPS only. Upload-backed thumbnails remain dependent on W01
            private/shared storage.
          </span>
        </label>
      </div>

      <div className="mt-5 flex justify-end">
        <Button
          type="button"
          disabled={pending}
          onClick={save}
        >
          {pending
            ? "Saving…"
            : "Save Course Home"}
        </Button>
      </div>
    </section>
  );
}
