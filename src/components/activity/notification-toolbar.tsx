"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [pending, setPending] = useState(false);

  async function markAllRead() {
    if (confirmMarkAll && !window.confirm(confirmMessage)) return;
    setPending(true);
    try {
      const response = await fetch(markAllEndpoint, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("The inbox could not be updated. Retry the action.");
      }
      router.refresh();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Could not mark all as read",
        description: error instanceof Error ? error.message : "Please retry.",
      });
    } finally {
      setPending(false);
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
        onClick={markAllRead}
      >
        {pending ? "Marking…" : "Mark all as read"}
      </Button>
    </div>
  );
}
