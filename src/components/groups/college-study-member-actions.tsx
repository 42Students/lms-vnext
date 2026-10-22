"use client";

import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Dropdown } from "@/components/ui/dropdown";
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
  const mutationRef=useRef(false);
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
    if(mutationRef.current)return;
    if (!action) return;
    mutationRef.current = true;
    start(async () => {
      try { await send(action); }
      catch (err) { setError(err instanceof Error ? err.message : "Membership change failed"); }
      finally { mutationRef.current = false; }
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
    }} className="grid min-w-0 grid-cols-1 items-end gap-3 border-t border-border pt-4 md:grid-cols-2 min-[992px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-body leading-4">
        Add learner
        <Select value={selection} onChange={(event) => {setSelection(event.target.value);if(event.target.value)setManualId("");}}
          className="min-h-11 min-w-0 md:min-h-9">
          <option value="">Choose from first 100 members</option>
          {available.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-body leading-4">
        Or learner membership ID
        <Input value={manualId} onChange={(event) => {setManualId(event.target.value);if(event.target.value.trim())setSelection("");}}
          placeholder="UUID" className="min-h-11 min-w-0 md:min-h-9" />
      </label>
      <Button type="submit" loading={pending} className="min-h-11 w-full md:col-span-2 md:min-h-9 min-[992px]:col-span-1 min-[992px]:w-auto" disabled={pending}>Review add</Button>
    </form>
    <details className="border-b border-border pb-3 text-xs text-muted-foreground"><summary className="min-h-11 cursor-pointer py-3 font-semibold md:min-h-9">Membership policy</summary><p>
      Adding to a full group follows the registered group waitlist policy. Only active same-college learners are eligible.
    </p></details>
    <div className="divide-y divide-border">
      {members.every(member=>member.state==="REMOVED") ? <EmptyState title="No active group members" description="No active group members are recorded."/> : null}
      {members.filter((member) => member.state !== "REMOVED").map((member) =>
        <div key={member.membershipId}
          className="flex min-w-0 flex-col items-stretch gap-3 py-3 md:flex-row md:items-center md:justify-between">
          <span className="min-w-0 break-words text-sm text-body">
            {member.displayName ?? "Unnamed member"} · <StatusBadge tone={member.state==="ACTIVE"?"success":member.state==="WAITLISTED"?"warning":"neutral"}>{member.state}</StatusBadge>
            {member.isLocked ? " · Locked" : ""}
          </span>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            <Button size="sm" variant="secondary" className="min-h-11 w-full md:min-h-9 sm:w-auto" disabled={pending}
              onClick={() => setAction({
                action: "LOCK", membershipId: member.membershipId, locked: !member.isLocked,
              })}>{member.isLocked ? "Unlock" : "Lock"}</Button>
            <Button size="sm" variant="danger" className="min-h-11 w-full md:min-h-9 sm:w-auto" disabled={pending}
              onClick={() => setAction({ action: "REMOVE", membershipId: member.membershipId })}>
              Remove
            </Button>
            <Dropdown mobileSheet align="end" label={"Additional actions for "+(member.displayName??"member")} trigger="More actions">
            <Button size="sm" variant="danger" className="min-h-11 w-full md:min-h-9" disabled={pending}
              onClick={() => setAction({ action: "REMOVE_AND_LOCK",
                membershipId: member.membershipId, expectedVersion: member.version, confirm: true })}>
              Remove &amp; lock
            </Button>
            </Dropdown>
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
