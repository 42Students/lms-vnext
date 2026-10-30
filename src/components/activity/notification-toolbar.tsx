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
  canMarkAll = true,
  confirmMessage = "Mark all unread Mentor notifications in this college as read?",
  categories = [],
  selectedCategory,
  categoryParam = "category",
  display = "all",
  segmented = false,
}: {
  view: "all" | "unread";
  unreadCount: number;
  allLabel?: string;
  baseHref?: string;
  markAllEndpoint?: string;
  confirmMarkAll?: boolean;
  /** Hide bulk personal mutations on tabs containing only read-state-free notices. */
  canMarkAll?: boolean;
  confirmMessage?: string;
  categories?: readonly {id:string;label:string;unread:number}[];
  selectedCategory?: string;
  categoryParam?: "category" | "tab";
  display?: "all" | "filters" | "mark-all";
  segmented?:boolean;
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
    <div className={display==="mark-all"?"min-w-0":display==="filters"?"min-w-0":"min-w-0 space-y-3 border-b border-[var(--lms-canvas-border)] pb-4"}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
      {display!=="mark-all"?<div className={segmented?"inline-flex max-w-full flex-wrap gap-0 overflow-hidden rounded-[9px] border border-border bg-[var(--lms-neutral-50)] p-[3px]":"flex min-w-0 flex-wrap gap-2"} role="group" aria-label="Notification filter">
        <Link
          href={baseHref + "?view=all" + (selectedCategory&&selectedCategory!=="all"?"&"+categoryParam+"="+encodeURIComponent(selectedCategory):"")}
          aria-current={view === "all" ? "page" : undefined}
          className={`inline-flex min-h-11 min-[768px]:min-h-9 min-w-0 items-center justify-center break-words rounded-[var(--lms-filter-radius,8px)] border px-3 text-center text-sm font-medium leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] ${view === "all" ? "border-primary bg-primary text-on-primary hover:bg-primary-hover" : "border-border text-body hover:border-primary hover:bg-primary-subtle hover:text-primary-text"}`}
        >
          {allLabel}
        </Link>
        <Link
          href={baseHref + "?view=unread" + (selectedCategory&&selectedCategory!=="all"?"&"+categoryParam+"="+encodeURIComponent(selectedCategory):"")}
          aria-current={view === "unread" ? "page" : undefined}
          className={`inline-flex min-h-11 min-[768px]:min-h-9 min-w-0 items-center justify-center break-words rounded-[var(--lms-filter-radius,8px)] border px-3 text-center text-sm font-medium leading-5 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] ${view === "unread" ? "border-primary bg-primary text-on-primary hover:bg-primary-hover" : "border-border text-body hover:border-primary hover:bg-primary-subtle hover:text-primary-text"}`}
        >
          Unread ({unreadCount})
        </Link>
      </div>:null}
      {display!=="filters"&&canMarkAll?<Button
        size="sm"
        variant="secondary"
        className="min-h-11 w-full min-[768px]:min-h-9 min-[768px]:w-auto"
        disabled={pending || unreadCount === 0}
        onClick={() => confirmMarkAll ? setConfirmOpen(true) : void markAllRead()}
      >
        {pending ? "Marking…" : "Mark all as read"}
      </Button>:null}
      </div>
      {display!=="mark-all"&&categories.length?(
        <nav aria-label="Notification categories" className="flex min-w-0 gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible">
          {categories.map(item=>{
            const query=new URLSearchParams({view});
            if(item.id!=="all")query.set(categoryParam,item.id);
            const link=baseHref+"?"+query.toString();
            const active=item.id===(selectedCategory??"all");
            return <Link key={item.id} href={link} scroll={false}
              aria-current={active?"page":undefined}
              aria-label={item.label+" ("+item.unread+" in loaded view)"}
              className={"inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[var(--lms-control-radius)] border px-3 text-sm font-semibold md:min-h-9 "+(
                active?"border-primary bg-primary-subtle text-primary-text":"border-border text-body hover:border-primary"
              )}>
              <span aria-hidden="true">{item.id==="all"?"◈":item.id==="college"?"▣":item.id==="department"?"◇":item.id==="faculty"?"▤":item.id==="personal"?"●":"•"}</span>
              {item.label}
              <span aria-hidden="true" className="tabular-nums text-xs text-muted-foreground">({item.unread})</span>
            </Link>;
          })}
        </nav>
      ):null}
      {confirmMarkAll && canMarkAll ? <ConfirmActionDialog
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
