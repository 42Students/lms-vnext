"use client";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  collegeStudyMemberLabel, type CollegeStudyMemberAction,
} from "@/modules/groups/college-member-management-model";

export function CollegeStudyMemberActions({
  groupId, name, members, available,
}: {
  groupId: string;
  name: string;
  members: readonly {
    membershipId: string; displayName: string | null;
    state: string; isLocked: boolean; version: number;
  }[];
  available: readonly { id: string; label: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [selection, setSelection] = useState("");
  const [manualId, setManualId] = useState("");
  const [action, setAction] = useState<CollegeStudyMemberAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function send(payload: CollegeStudyMemberAction) {
    const response = await fetch(`/api/college/groups/${groupId}/members`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const body: { error?: string } | null = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Membership change failed");
    }
    setError(null);
    setAction(null);
    setSelection("");
    setManualId("");
    router.refresh();
  }
  function confirm() {
    if (!action) return;
    start(async () => {
      try { await send(action); }
      catch (err) { setError(err instanceof Error ? err.message : "Membership change failed"); }
    });
  }
  return <div className="space-y-4">
    <form onSubmit={(event) => {
      event.preventDefault();
      const membershipId = selection || manualId.trim();
      if (!/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(membershipId)) {
        setError("Select a learner or provide a valid membership UUID.");
        return;
      }
      setError(null);
      setAction({ action: "ADD", membershipId });
    }} className="flex flex-wrap items-end gap-3 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-4">
      <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
        Add learner
        <Select value={selection} onChange={(event) => setSelection(event.target.value)}
          className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-foreground">
          <option value="">Choose from first 100 members</option>
          {available.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
      <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
        Or learner membership ID
        <Input value={manualId} onChange={(event) => setManualId(event.target.value)}
          placeholder="UUID" className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-3 text-foreground" />
      </label>
      <Button type="submit" disabled={pending}>Review add</Button>
    </form>
    <p className="text-xs text-muted-foreground">
      Adding to a full group follows the registered group waitlist policy. Only active same-college learners are eligible.
    </p>
    <div className="space-y-2">
      {members.filter((member) => member.state !== "REMOVED").map((member) =>
        <div key={member.membershipId}
          className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--lms-control-radius,9px)] border border-border p-3">
          <span className="text-sm text-body">
            {member.displayName ?? "Unnamed member"} · {member.state}
            {member.isLocked ? " · Locked" : ""}
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" disabled={pending}
              onClick={() => setAction({
                action: "LOCK", membershipId: member.membershipId, locked: !member.isLocked,
              })}>{member.isLocked ? "Unlock" : "Lock"}</Button>
            <Button size="sm" variant="danger" disabled={pending}
              onClick={() => setAction({ action: "REMOVE", membershipId: member.membershipId })}>
              Remove
            </Button>
            <Button size="sm" variant="danger" disabled={pending}
              onClick={() => setAction({ action: "REMOVE_AND_LOCK",
                membershipId: member.membershipId, expectedVersion: member.version, confirm: true })}>
              Remove &amp; lock
            </Button>
          </div>
        </div>,
      )}
    </div>
    {error ? <p role="alert" className="text-sm text-[var(--lms-error)]">{error}</p> : null}
    <ConfirmDialog open={action !== null} onOpenChange={(value) => { if (!value && !pending) setAction(null); }}
      title={action ? collegeStudyMemberLabel(action) : "Confirm membership action"}
      description={`Study group: ${name}. Changes are audited; removing an active member may promote a waitlisted learner. Remove & lock also blocks self-rejoining until an admin changes the lock.`}
      confirmLabel={action?.action === "REMOVE_AND_LOCK" ? "Remove & lock" : action?.action === "REMOVE" ? "Remove member" : "Confirm"}
      confirmVariant={action?.action === "REMOVE" || action?.action === "REMOVE_AND_LOCK" ? "danger" : "primary"}
      pending={pending} onConfirm={confirm} />
  </div>;
}
