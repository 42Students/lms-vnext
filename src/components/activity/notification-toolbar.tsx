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
  categories = [],
  selectedCategory,
}: {
  view: "all" | "unread";
  unreadCount: number;
  allLabel?: string;
  baseHref?: string;
  markAllEndpoint?: string;
  confirmMarkAll?: boolean;
  confirmMessage?: string;
  categories?: readonly {id:string;label:string;unread:number}[];
  selectedCategory?: string;
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
        showToast({ tone: "success", title: "Marked all as read" });
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
    <div className="flex min-w-0 flex-col items-stretch gap-3 border-b border-[var(--lms-canvas-border)] pb-4 min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between">
      <div className="grid w-full min-w-0 grid-cols-1 md:grid-cols-2 gap-2 min-[768px]:flex min-[768px]:w-auto min-[768px]:flex-wrap" role="group" aria-label="Notification filter">
        <Link
          href={baseHref + "?view=all" + (selectedCategory?"&category="+encodeURIComponent(selectedCategory):"")}
          aria-current={view === "all" ? "page" : undefined}
          className={`inline-flex min-h-11 min-[768px]:min-h-9 min-w-0 items-center justify-center break-words rounded-[var(--lms-filter-radius,8px)] border px-3 text-center text-sm font-medium leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] ${view === "all" ? "border-primary bg-primary text-on-primary hover:bg-primary-hover" : "border-border text-body hover:border-primary hover:bg-primary-subtle hover:text-primary-text"}`}
        >
          {allLabel}
        </Link>
        <Link
          href={baseHref + "?view=unread" + (selectedCategory?"&category="+encodeURIComponent(selectedCategory):"")}
          aria-current={view === "unread" ? "page" : undefined}
          className={`inline-flex min-h-11 min-[768px]:min-h-9 min-w-0 items-center justify-center break-words rounded-[var(--lms-filter-radius,8px)] border px-3 text-center text-sm font-medium leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] ${view === "unread" ? "border-primary bg-primary text-on-primary hover:bg-primary-hover" : "border-border text-body hover:border-primary hover:bg-primary-subtle hover:text-primary-text"}`}
        >
          Unread ({unreadCount})
        </Link>
      </div>
      <Button
        size="sm"
        variant="secondary"
        className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto"
        disabled={pending || unreadCount === 0}
        onClick={() => confirmMarkAll ? setConfirmOpen(true) : void markAllRead()}
      >
        {pending ? "Marking…" : "Mark all as read"}
      </Button>
      {categories.length?(
        <nav aria-label="Notification categories" className="flex min-w-0 flex-wrap gap-2">
          {categories.map(item=>{
            const link=baseHref+"?"+new URLSearchParams({
              view,...(item.id===selectedCategory?{}:{category:item.id}),
            }).toString();
            const active=item.id===selectedCategory;
            return <Link key={item.id} href={link}
              aria-current={active?"page":undefined}
              className={"inline-flex min-h-11 items-center gap-2 border-b-2 px-2 text-sm font-semibold md:min-h-9 "+(
                active?"border-primary text-primary-text":"border-transparent text-body hover:border-border"
              )}>
              {item.label}
              <span className="tabular-nums text-xs text-muted-foreground">{item.unread}</span>
            </Link>;
          })}
        </nav>
      ):null}
      {confirmMarkAll ? <ConfirmActionDialog
        open={confirmOpen}
        title="Mark all as read"
        consequence={confirmMessage}
        confirmLabel="Mark all as read"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => void markAllRead()}
        pending={pending}
      /> : null}
    </div>
  );
}
