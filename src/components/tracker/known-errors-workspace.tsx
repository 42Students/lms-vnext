"use client";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dialog } from "@/components/ui/dialog";
import { Disclosure } from "@/components/ui/disclosure";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { FRIENDLY_MESSAGES, friendlyApiError } from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { listKnownErrorsForAdmin } from "@/modules/log-alerts/admin-service";
import Link from "next/link";
import {knownErrorSafeSummary,knownErrorSafeSql} from "@/modules/log-alerts/known-error-safe-summary";

type KnownError = Awaited<ReturnType<typeof listKnownErrorsForAdmin>>[number];

function formatInstant(value: Date | string | null) {
  if (!value || Number.isNaN(new Date(value).getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium", timeStyle: "short",
  }).format(new Date(value));
}

function KnownErrorCard({ item }: { item: KnownError }) {
  const router = useRouter();
  const { showToast } = useToast();
  const { run, pending } = useGuardedAction({ timeoutMs: 20_000 });
  const [note, setNote] = useState("");
  const [muteReason, setMuteReason] = useState("");
  const [confirmMute, setConfirmMute] = useState(false);
  const [commit, setCommit] = useState("");
  const [issuePublicId, setIssuePublicId] = useState(item.issuePublicId ?? "");

  async function update(body: Record<string, unknown>) {
    try {
      await run(async () => {
        await apiFetch("/api/tracker/logs/known-errors/" + item.id, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          timeoutMs: 15_000,
        });
        showToast({ tone: "success", title: "Known error updated" });
        setConfirmMute(false);
        router.refresh();
      });
    } catch (error) {
      showToast({
        tone: "error", title: "Known error update failed",
        description: error instanceof FriendlyFetchError
          ? error.message
          : error instanceof Error && error.message === FRIENDLY_MESSAGES.timeout
            ? FRIENDLY_MESSAGES.timeout : friendlyApiError({}),
      });
    }
  }

  return (
    <article id={"known-error-"+item.id} className="scroll-mt-4 min-w-0 space-y-4 py-5">
      <div className="flex min-w-0 flex-col items-start gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="m-0 break-all font-mono text-xs text-muted-foreground leading-[20px]">
            Signature {item.signatureHash.slice(0, 12)}…
          </p>
          <h3 className="mt-2 flex min-w-0 flex-wrap items-center gap-2 text-base font-semibold text-[var(--lms-heading)]">
            <StatusBadge tone={item.fixStatus==="FIXED"?"success":item.fixStatus==="OPEN"?"warning":"info"}>{item.fixStatus}</StatusBadge>
            <StatusBadge tone={item.muted?"warning":"neutral"}>{item.muted ? "Muted" : "Unmuted"}</StatusBadge>
          </h3>
          <p className="mt-1 text-sm text-muted-foreground leading-[22px]">
            {item.occurrenceCount} occurrences · {item.affectedAccounts} distinct affected accounts
          </p>
        </div>
        <p className="m-0 text-xs text-muted-foreground leading-[20px]">
          First seen {formatInstant(item.firstSeenAt)} · Last seen {formatInstant(item.lastSeenAt)}
        </p>
      </div>
      {item.acknowledgedAt ? (
        <p role="status" className="text-xs text-muted-foreground leading-[20px]">Acknowledged {formatInstant(item.acknowledgedAt)}</p>
      ) : null}
      {item.regressedAt ? (
        <p role="status" className="flex flex-wrap items-center gap-2 text-sm font-semibold text-error leading-[22px]">
          <StatusBadge tone="error">Regressed</StatusBadge> Regression observed {formatInstant(item.regressedAt)}
        </p>
      ) : null}
      <div className="flex min-w-0 flex-col gap-2 md:flex-row">
        <Link href={"/tracker?context="+encodeURIComponent(knownErrorSafeSummary({
          signatureHash:item.signatureHash,environment:item.environment,fixStatus:item.fixStatus,
          occurrences:item.occurrenceCount,affectedAccounts:item.affectedAccounts,
          firstSeen:formatInstant(item.firstSeenAt),lastSeen:formatInstant(item.lastSeenAt),
          issuePublicId:item.issuePublicId,
        }).slice(0,450))+"&knownErrorId="+encodeURIComponent(item.id)}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-[650] text-primary-text md:w-auto md:min-h-9">
          Create tracker issue
        </Link>
      </div>
      <Disclosure title="Triage and diagnostic actions" className="border-t border-border" contentClassName="space-y-3 px-2 pb-3">
      <div className="grid min-w-0 gap-3 md:grid-cols-3">
        <label className="block min-w-0 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Triage note
          <Input
            className="mt-[6px] min-h-11 w-full min-w-0 md:min-h-9" value={note} maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason / owner update"
          />
        </label>
        <label className="block min-w-0 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Fix commit (optional)
          <Input
            className="mt-[6px] min-h-11 w-full min-w-0 md:min-h-9" value={commit} maxLength={64}
            onChange={(event) => setCommit(event.target.value)}
            placeholder="Git commit SHA"
          />
        </label>
        <label className="block min-w-0 font-semibold text-[13px] leading-4 text-[var(--lms-neutral-400)]">
          Tracker issue ID
          <Input
            className="mt-[6px] min-h-11 w-full min-w-0 md:min-h-9" value={issuePublicId} maxLength={32}
            onChange={(event) => setIssuePublicId(event.target.value)}
            placeholder="e.g. BT-123"
          />
        </label>
      </div>
      <div className="flex min-w-0 flex-col gap-2 md:flex-row md:flex-wrap">
        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending}
          onClick={()=>void navigator.clipboard.writeText(knownErrorSafeSummary({
            signatureHash:item.signatureHash,environment:item.environment,fixStatus:item.fixStatus,
            occurrences:item.occurrenceCount,affectedAccounts:item.affectedAccounts,
            firstSeen:formatInstant(item.firstSeenAt),lastSeen:formatInstant(item.lastSeenAt),
            issuePublicId:item.issuePublicId,
          })).then(()=>showToast({tone:"success",title:"Sanitized diagnostic summary copied"}))
            .catch(()=>showToast({tone:"error",title:"Could not copy diagnostic summary"}))}>
          Copy for Claude
        </Button>
        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending}
          onClick={()=>{const sql=knownErrorSafeSql({
            signatureHash:item.signatureHash,environment:item.environment,
          });
          if(!sql){showToast({tone:"error",title:"Diagnostic signature is invalid"});return;}
          void navigator.clipboard.writeText(sql)
            .then(()=>showToast({tone:"success",title:"Read-only diagnostic SQL copied"}))
            .catch(()=>showToast({tone:"error",title:"Could not copy diagnostic SQL"}));
          }}>
          Copy SQL to check the data
        </Button>

        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending || Boolean(item.acknowledgedAt)}
          onClick={() => update({ action: "ACKNOWLEDGE" })}>
          {item.acknowledgedAt ? "Acknowledged" : "Acknowledge"}
        </Button>
        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending}
          aria-expanded={item.muted ? undefined : confirmMute}
          onClick={() => {
            if (item.muted) void update({ action: "MUTE", muted: false });
            else setConfirmMute(true);
          }}>
          {item.muted ? "Unmute" : "Mute"}
        </Button>
        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending}
          onClick={() => update({
            action: "STATUS", status: "EXPECTED",
            ...(note.trim() ? { note } : {}),
          })}>
          Mark expected
        </Button>
        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary"
          disabled={pending || (commit.trim() !== "" && !/^[0-9a-f]{7,64}$/i.test(commit.trim()))}
          onClick={() => update({
            action: "STATUS", status: "FIXED",
            ...(commit.trim() ? { commit: commit.trim() } : {}),
            ...(note.trim() ? { note } : {}),
          })}>
          Mark fixed
        </Button>
        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending}
          onClick={() => update({ action: "STATUS", status: "OPEN" })}>
          Reopen
        </Button>
        <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending}
          onClick={() => update({
            action: "LINK_ISSUE", issuePublicId: issuePublicId.trim() || null,
          })}>
          Save issue link
        </Button>
      </div>

      </Disclosure>
      <Dialog open={confirmMute&&!item.muted}
        onOpenChange={next=>{if(!pending)setConfirmMute(next);}}
        title="Mute this error"
        description="Why is it safe to ignore? It comes back on its own if it suddenly spikes."
        dismissible={!pending}
        footer={<div className="flex w-full flex-col-reverse gap-2 md:flex-row md:justify-end">
            <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" variant="secondary" disabled={pending}
              onClick={() => setConfirmMute(false)}>
              Cancel
            </Button>
            <Button size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={pending}
              onClick={() => void update({
                action: "MUTE", muted: true,
                ...(muteReason.trim() ? { reason: muteReason.trim() } : {}),
              })}>
              Mute
            </Button>
          </div>}>
        <div className="min-w-0 space-y-3">
          <label className="block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Reason (optional)
            <Input className="mt-[6px] min-h-11 w-full min-w-0 md:min-h-9" value={muteReason} maxLength={255}
              onChange={(event) => setMuteReason(event.target.value)}
              placeholder="Why this error is expected"
            />
          </label>
        </div>
      </Dialog>
      {item.issuePublicId ? (
        <p className="m-0 text-xs text-muted-foreground leading-[20px]">
          Linked tracker issue: {item.issuePublicId}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground leading-[20px]">
        Raw log samples, error paths and account identities are deliberately not exposed here.
      </p>
    </article>
  );
}

export function KnownErrorsWorkspace({
  items,
  lastViewedAt,
  backendStartedAt,
}: {
  items: readonly KnownError[];
  lastViewedAt: Date | null;
  backendStartedAt?:string|null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { run, pending } = useGuardedAction({ timeoutMs: 20_000 });
  const viewedOnce = useRef(false);
  const [dismissed, setDismissed] = useState(false);
  const [drawerOpen,setDrawerOpen]=useState(false);
  const unseenCount = items.filter((item) =>
    new Date(item.lastSeenAt).getTime() > (lastViewedAt?.getTime() ?? 0)).length;

  // This runs only after the authorized server query has returned. Retain the
  // pre-query timestamp and count for the current view; do not silently erase
  // the "since your last visit" banner by refreshing immediately.
  useEffect(() => {
    if (viewedOnce.current) return;
    viewedOnce.current = true;
    void apiFetch("/api/tracker/logs/viewed", {
      method: "POST", timeoutMs: 15_000,
    }).catch(() => { viewedOnce.current = false; });
  }, []);

  async function markViewed() {
    try {
      await run(async () => {
        await apiFetch("/api/tracker/logs/viewed", {
          method: "POST", timeoutMs: 15_000,
        });
        router.refresh();
        showToast({ tone: "success", title: "Logs review time updated" });
      });
    } catch (error) {
      showToast({
        tone: "error", title: "Update failed",
        description: error instanceof FriendlyFetchError
          ? error.message
          : error instanceof Error && error.message === FRIENDLY_MESSAGES.timeout
            ? FRIENDLY_MESSAGES.timeout : friendlyApiError({}),
      });
    }
  }

  return (
    <div id="known-errors" className="space-y-3">
      <Button type="button" variant="secondary" onClick={()=>setDrawerOpen(true)}
        aria-label={"Open Known errors drawer"+(unseenCount>0?" · "+unseenCount+" new or updated":"")}
        className="min-h-11 w-full md:min-h-9 md:w-auto">Known errors ({items.length}{items.length===40?"+":""})
        {unseenCount>0?" · "+unseenCount+" new":""}
      </Button>
      <Dialog open={drawerOpen} onOpenChange={setDrawerOpen} title="Known errors"
        description="Stored signatures, acknowledgements and triage controls, separate from live logs."
        className="!max-w-[1120px]" bodyClassName="space-y-5">
      {backendStartedAt?<p className="m-0 text-xs text-muted-foreground">Backend started {backendStartedAt} IST</p>:null}
      {unseenCount > 0 && !dismissed ? <div role="status"
        className="flex flex-wrap items-center justify-between gap-3 border border-[var(--lms-info-border)] bg-[var(--lms-info-subtle)] px-4 py-3 text-sm text-body">
        <p>{unseenCount} new or updated error {unseenCount === 1 ? "group" : "groups"} since your last visit.</p>
        <Button variant="secondary" size="sm" type="button" onClick={() => setDismissed(true)}>
          Dismiss
        </Button>
      </div> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <p className="m-0 text-sm text-body leading-[22px]">Last reviewed: {formatInstant(lastViewedAt)}</p>
        <Button variant="secondary" size="sm" className="min-h-11 w-full md:w-auto md:min-h-9" disabled={pending} loading={pending} onClick={markViewed}>
          {pending ? "Saving…" : "Mark logs reviewed"}
        </Button>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No tracked errors" description="This does not prove that live Cloud Logging contains no errors."/>
      ) : (
        <div className="divide-y divide-border border-y border-border">
          {items.map((item) => <KnownErrorCard key={item.id} item={item} />)}
        </div>
      )}
      </Dialog>
    </div>
  );
}
