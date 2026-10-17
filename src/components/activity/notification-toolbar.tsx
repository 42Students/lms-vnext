"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api-fetch";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { ConfirmActionDialog } from "@/components/ui/confirm-action-dialog";
import { FRIENDLY_MESSAGES } from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export function NotificationToolbar({
  view,
  unreadCount,
  allLabel = "All",
  baseHref = "/notifications",
  markAllEndpoint = "/api/notifications/read-all",
  confirmMarkAll = false,
  confirmMessage = "Mark all unread Mentor notifications in this college as read?",
}: {
  view: "all" | "unread";
  unreadCount: number;
  allLabel?: string;
  baseHref?: string;
  markAllEndpoint?: string;
  confirmMarkAll?: boolean;
  confirmMessage?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { pending, run } = useGuardedAction();
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function markAllRead() {
    try {
      await run(async () => {
        await apiFetch(markAllEndpoint, { method: "POST", timeoutMs: 25_000 });
        setConfirmOpen(false);
        router.refresh();
      });
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not mark all as read",
        description: error instanceof Error ? error.message : FRIENDLY_MESSAGES.unexpected,
      });
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Notification filter">
        <Link
          href={baseHref + "?view=all"}
          aria-current={view === "all" ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold transition ${view === "all" ? "border-primary bg-primary-subtle text-primary-text" : "border-border text-foreground hover:border-primary"}`}
        >
          {allLabel}
        </Link>
        <Link
          href={baseHref + "?view=unread"}
          aria-current={view === "unread" ? "page" : undefined}
          className={`inline-flex min-h-10 items-center rounded-md border px-4 text-sm font-semibold transition ${view === "unread" ? "border-primary bg-primary-subtle text-primary-text" : "border-border text-foreground hover:border-primary"}`}
        >
          Unread ({unreadCount})
        </Link>
      </div>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending || unreadCount === 0}
        onClick={() => confirmMarkAll ? setConfirmOpen(true) : void markAllRead()}
      >
        {pending ? "Marking…" : "Mark all as read"}
      </Button>
      <ConfirmActionDialog
        open={confirmOpen}
        title="Mark all as read"
        consequence={confirmMessage}
        confirmLabel="Mark all as read"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void markAllRead()}
        pending={pending}
      />
    </div>
  );
}
