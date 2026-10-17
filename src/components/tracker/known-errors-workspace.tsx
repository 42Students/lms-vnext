"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useGuardedAction } from "@/hooks/use-guarded-action";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import { FRIENDLY_MESSAGES, friendlyApiError } from "@/lib/friendly-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import type { listKnownErrorsForAdmin } from "@/modules/log-alerts/admin-service";

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
    <article id={"known-error-"+item.id} className="scroll-mt-4 space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 break-all font-mono text-xs text-muted-foreground">
            Signature {item.signatureHash.slice(0, 12)}…
          </p>
          <h3 className="mt-2 text-base font-semibold text-foreground">
            {item.fixStatus} · {item.muted ? "Muted" : "Unmuted"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {item.occurrenceCount} occurrences · {item.affectedAccounts} distinct affected accounts
          </p>
        </div>
        <p className="m-0 text-xs text-muted-foreground">
          First seen {formatInstant(item.firstSeenAt)} · Last seen {formatInstant(item.lastSeenAt)}
        </p>
      </div>
      {item.acknowledgedAt ? (
        <p role="status" className="text-xs text-muted-foreground">Acknowledged {formatInstant(item.acknowledgedAt)}</p>
      ) : null}
      {item.regressedAt ? (
        <p role="status" className="text-sm font-semibold text-error">
          Regression observed {formatInstant(item.regressedAt)}
        </p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-semibold text-body">
          Triage note
          <Input
            className="mt-1" value={note} maxLength={500}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Reason / owner update"
          />
        </label>
        <label className="block text-xs font-semibold text-body">
          Fix commit (optional)
          <Input
            className="mt-1" value={commit} maxLength={64}
            onChange={(event) => setCommit(event.target.value)}
            placeholder="Git commit SHA"
          />
        </label>
        <label className="block text-xs font-semibold text-body">
          Tracker issue ID
          <Input
            className="mt-1" value={issuePublicId} maxLength={32}
            onChange={(event) => setIssuePublicId(event.target.value)}
            placeholder="e.g. BT-123"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" disabled={pending || Boolean(item.acknowledgedAt)}
          onClick={() => update({ action: "ACKNOWLEDGE" })}>
          {item.acknowledgedAt ? "Acknowledged" : "Acknowledge"}
        </Button>
        <Button size="sm" variant="secondary" disabled={pending}
          aria-expanded={item.muted ? undefined : confirmMute}
          onClick={() => {
            if (item.muted) void update({ action: "MUTE", muted: false });
            else setConfirmMute(true);
          }}>
          {item.muted ? "Unmute" : "Mute"}
        </Button>
        <Button size="sm" variant="secondary" disabled={pending}
          onClick={() => update({
            action: "STATUS", status: "EXPECTED",
            ...(note.trim() ? { note } : {}),
          })}>
          Mark expected
        </Button>
        <Button size="sm" variant="secondary"
          disabled={pending || (commit.trim() !== "" && !/^[0-9a-f]{7,64}$/i.test(commit.trim()))}
          onClick={() => update({
            action: "STATUS", status: "FIXED",
            ...(commit.trim() ? { commit: commit.trim() } : {}),
            ...(note.trim() ? { note } : {}),
          })}>
          Mark fixed
        </Button>
        <Button size="sm" variant="secondary" disabled={pending}
          onClick={() => update({ action: "STATUS", status: "OPEN" })}>
          Reopen
        </Button>
        <Button size="sm" variant="secondary" disabled={pending}
          onClick={() => update({
            action: "LINK_ISSUE", issuePublicId: issuePublicId.trim() || null,
          })}>
          Save issue link
        </Button>
      </div>
      {confirmMute && !item.muted ? (
        <section aria-label="Mute this error"
          className="space-y-3 rounded-lg border border-border bg-surface p-4">
          <p className="font-semibold text-foreground">Mute this error</p>
          <p className="text-sm text-body">
            Why is it safe to ignore? It comes back on its own if it suddenly spikes.
          </p>
          <label className="block text-sm text-body">
            Reason (optional)
            <Input className="mt-1" value={muteReason} maxLength={255}
              onChange={(event) => setMuteReason(event.target.value)}
              placeholder="Why this error is expected"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={pending}
              onClick={() => void update({
                action: "MUTE", muted: true,
                ...(muteReason.trim() ? { reason: muteReason.trim() } : {}),
              })}>
              Mute
            </Button>
            <Button size="sm" variant="secondary" disabled={pending}
              onClick={() => setConfirmMute(false)}>
              Cancel
            </Button>
          </div>
        </section>
      ) : null}
      {item.issuePublicId ? (
        <p className="m-0 text-xs text-muted-foreground">
          Linked tracker issue: {item.issuePublicId}
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Raw log samples, error paths and account identities are deliberately not exposed here.
      </p>
    </article>
  );
}

export function KnownErrorsWorkspace({
  items,
  lastViewedAt,
}: {
  items: readonly KnownError[];
  lastViewedAt: Date | null;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const { run, pending } = useGuardedAction({ timeoutMs: 20_000 });

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
    <div id="known-errors" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4">
        <p className="m-0 text-sm text-body">Last reviewed: {formatInstant(lastViewedAt)}</p>
        <Button variant="secondary" size="sm" disabled={pending} onClick={markViewed}>
          {pending ? "Saving…" : "Mark logs reviewed"}
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="rounded-xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          No tracked errors yet. This does not prove that live Cloud Logging contains no errors.
        </p>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => <KnownErrorCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );
}
