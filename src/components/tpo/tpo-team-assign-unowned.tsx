"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { InlineNotice } from "@/components/ui/inline-notice";
import { Select } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { apiFetch } from "@/lib/api-fetch";

type Member = { membershipId: string; displayName: string };

export function TpoTeamAssignUnowned({
  drives, companies, members,
}: {
  drives: number;
  companies: number;
  members: Member[];
}) {
  const router = useRouter();
  const pending = useRef(false);
  const [assignee, setAssignee] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const teammate = members.find(member => member.membershipId === assignee);
  const hasWork = drives > 0 || companies > 0;
  const description = "Assign " + drives + " unowned drive(s) and " +
    companies + " company relationship(s) to " +
    (teammate?.displayName ?? "the selected teammate") +
    "? Work that already has an owner will not move.";

  async function assign() {
    if (pending.current || !teammate) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const assigned = await apiFetch<{ drives: number; companies: number }>(
        "/api/placements/tpo/team/unowned", {
          method: "POST",
          credentials: "same-origin",
          timeoutMs: 15000,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetMembershipId: teammate.membershipId }),
        },
      );
      setMessage(assigned.drives || assigned.companies
        ? "Assigned " + assigned.drives + " drive(s) and " +
          assigned.companies + " company relationship(s)."
        : "Everything already has an owner.");
      setConfirmOpen(false);
      router.refresh();
    } catch {
      setError("Could not assign unowned work. Nothing has been assumed saved. Try again.");
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  if (!hasWork) {
    return message ? <InlineNotice tone="success" message={message} /> : null;
  }

  return (
    <section aria-label="Assign unowned placement work" className="min-w-0 space-y-3 border-t border-border pt-4">
      <h2 className="text-base font-semibold leading-6 text-foreground">
        Nobody owns {drives} drives and {companies} companies
      </h2>
      <p className="max-w-3xl text-sm leading-6 text-body">
        Give the unassigned active drives and company relationships to one placement team member.
        Work with an owner is not moved.
      </p>

      {members.length === 0 ? (
        <InlineNotice tone="info" message="No eligible placement team member is available to receive this work." />
      ) : null}

      <div className="grid min-w-0 max-w-3xl grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <label className="grid min-w-0 gap-1 text-sm font-semibold text-body">
          Who takes them?
          <Select
            disabled={busy || members.length === 0}
            value={assignee}
            onChange={event => {
              setAssignee(event.target.value);
              setError("");
            }}
            className="min-h-11 w-full min-w-0 md:min-h-9"
          >
            <option value="">Choose a team member</option>
            {members.map(member => (
              <option key={member.membershipId} value={member.membershipId}>
                {member.displayName}
              </option>
            ))}
          </Select>
        </label>
        <Button
          variant="primary"
          type="button"
          disabled={busy || !teammate}
          onClick={() => setConfirmOpen(true)}
          className="min-h-11 w-full sm:w-auto md:min-h-9"
        >
          {busy ? "Assigning…" : "Assign work"}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={open => { if (!open && !busy) setConfirmOpen(false); }}
        title="Assign unowned placement work?"
        description={description}
        confirmLabel="Assign work"
        confirmVariant="primary"
        confirmDisabled={!teammate}
        pending={busy}
        onConfirm={() => { void assign(); }}
      >
        {error ? <InlineNotice tone="error" message={error} /> : null}
      </ConfirmDialog>
      {error && !confirmOpen ? <InlineNotice tone="error" message={error} /> : null}
      {message ? <InlineNotice tone="success" message={message} /> : null}
    </section>
  );
}
