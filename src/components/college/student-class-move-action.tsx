"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { studentSectionMoveMessage } from "@/modules/academics/college-student-section-move-model";

type Options = {
  current: { id: string; sectionId: string };
  options: Array<{ id: string; name: string; capacity: number | null }>;
};

export function StudentClassMoveAction({ membershipId, name }: {
  membershipId: string; name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Options | null>(null);
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const base = "/api/college/students/" + encodeURIComponent(membershipId) + "/section";
  function load() {
    setOpen(true);
    setLoaded(null);
    setTargetId("");
    setError("");
    start(async () => {
      try {
        const response = await fetch(base, { cache: "no-store" });
        if (!response.ok) throw new Error("Class options unavailable or permission denied");
        const value = await response.json() as Options;
        setLoaded(value);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Could not load classes");
      }
    });
  }
  const selected = loaded?.options.find(item => item.id === targetId);
  const canMove = loaded && selected && selected.id !== loaded.current.sectionId;
  const moveConfirmation=selected?studentSectionMoveMessage(name,selected.name):"";
  function submit() {
    if (!loaded || !canMove || !selected) return;
    setError("");
    start(async () => {
      try {
        const response = await fetch(base, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sectionId: selected.id,
            expectedSectionEnrollmentId: loaded.current.id,
            confirm: true,
          }),
        });
        if (!response.ok) throw new Error("Class move was denied. Refresh options and try again.");
        setOpen(false);
        setLoaded(null);
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Move failed");
      }
    });
  }
  return <div className="text-left">
    <Button variant="secondary" type="button" onClick={load} disabled={busy}
      className="rounded-[var(--lms-control-radius,9px)] border border-border px-3 py-2 text-xs font-semibold text-primary-text">
      Move class
    </Button>
    {open ? <div className="mt-2 min-w-56 rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-3">
      <p className="mb-2 text-xs text-body">Same batch and academic period only</p>
      {loaded && loaded.options.every(item => item.id === loaded.current.sectionId) ?
        <p className="mb-2 text-xs text-muted-foreground">No other eligible class is available in the current batch and period.</p> : null}
      {loaded ? <Select aria-label={"Destination class for " + name}
        value={targetId} onChange={e => setTargetId(e.target.value)}
        className="min-h-[var(--lms-control-height)] w-full rounded-[var(--lms-control-radius,9px)] border border-border bg-surface p-2 text-base sm:text-sm text-foreground">
        <option value="">Choose destination</option>
        {loaded.options.filter(item => item.id !== loaded.current.sectionId).map(item =>
          <option key={item.id} value={item.id}>{item.name} (capacity {item.capacity ?? "unlimited"})</option>)}
      </Select> : <p className="text-xs text-muted-foreground">{busy ? "Loading classes..." : "No class data loaded"}</p>}
      {error ? <p role="alert" className="my-2 text-xs text-red-700">{error}</p> : null}
      {canMove?<p className="mt-2 text-sm text-body">{moveConfirmation}</p>:null}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="primary" type="button" disabled={!canMove || busy} onClick={submit}
          className="rounded-[var(--lms-control-radius,9px)] bg-primary px-3 py-2 text-xs font-semibold text-on-primary">Confirm move</Button>
        <Button variant="secondary" type="button" onClick={() => setOpen(false)}
          className="rounded-[var(--lms-control-radius,9px)] border border-border px-3 py-2 text-xs">Cancel</Button>
      </div>
    </div> : null}
  </div>;
}
