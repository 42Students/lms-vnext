"use client";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
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
    }} className="flex min-w-0 flex-wrap items-end gap-3 border-t border-border pt-4">
      <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
        Add learner
        <Select value={selection} onChange={(event) => setSelection(event.target.value)}
          className="min-h-11 min-w-0 md:min-h-9">
          <option value="">Choose from first 100 members</option>
          {available.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
      <label className="grid min-w-52 flex-1 gap-1 text-sm font-semibold text-body">
        Or learner membership ID
        <Input value={manualId} onChange={(event) => setManualId(event.target.value)}
          placeholder="UUID" className="min-h-11 min-w-0 md:min-h-9" />
      </label>
      <Button type="submit" loading={pending} className="min-h-11 md:min-h-9" disabled={pending}>Review add</Button>
    </form>
    <p className="text-xs text-muted-foreground">
      Adding to a full group follows the registered group waitlist policy. Only active same-college learners are eligible.
    </p>
    <div className="divide-y divide-border">
      {members.every(member=>member.state==="REMOVED") ? <EmptyState title="No active group members" description="No active group members are recorded."/> : null}
      {members.filter((member) => member.state !== "REMOVED").map((member) =>
        <div key={member.membershipId}
          className="flex min-w-0 flex-wrap items-center justify-between gap-3 py-3">
          <span className="text-sm text-body">
            {member.displayName ?? "Unnamed member"} · <StatusBadge tone={member.state==="ACTIVE"?"success":member.state==="WAITLISTED"?"warning":"neutral"}>{member.state}</StatusBadge>
            {member.isLocked ? " · Locked" : ""}
          </span>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" className="min-h-11 md:min-h-9" disabled={pending}
              onClick={() => setAction({
                action: "LOCK", membershipId: member.membershipId, locked: !member.isLocked,
              })}>{member.isLocked ? "Unlock" : "Lock"}</Button>
            <Button size="sm" variant="danger" className="min-h-11 md:min-h-9" disabled={pending}
              onClick={() => setAction({ action: "REMOVE", membershipId: member.membershipId })}>
              Remove
            </Button>
            <Button size="sm" variant="danger" className="min-h-11 md:min-h-9" disabled={pending}
              onClick={() => setAction({ action: "REMOVE_AND_LOCK",
                membershipId: member.membershipId, expectedVersion: member.version, confirm: true })}>
              Remove &amp; lock
            </Button>
          </div>
        </div>,
      )}
    </div>
    {error ? <Alert tone="error">{error}</Alert> : null}
    <ConfirmDialog open={action !== null} onOpenChange={(value) => { if (!value && !pending) setAction(null); }}
      title={action ? collegeStudyMemberLabel(action) : "Confirm membership action"}
      description={`Study group: ${name}. Changes are audited; removing an active member may promote a waitlisted learner. Remove & lock also blocks self-rejoining until an admin changes the lock.`}
      confirmLabel={action?.action === "REMOVE_AND_LOCK" ? "Remove & lock" : action?.action === "REMOVE" ? "Remove member" : "Confirm"}
      confirmVariant={action?.action === "REMOVE" || action?.action === "REMOVE_AND_LOCK" ? "danger" : "primary"}
      pending={pending} onConfirm={confirm} />
  </div>;
}
