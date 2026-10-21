"use client";

import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { studentSectionMoveMessage } from "@/modules/academics/college-student-section-move-model";

type Options = {
  current: { id: string; sectionId: string };
  options: Array<{ id: string; name: string; capacity: number | null }>;
};

export function StudentClassMoveAction({ membershipId, name }: {
  membershipId: string; name: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const requestVersion = useRef(0);
  const moving = useRef(false);
  function close() { if (busy || moving.current) return; requestVersion.current++; setOpen(false); }
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState<Options | null>(null);
  const [targetId, setTargetId] = useState("");
  const [error, setError] = useState("");
  const [busy, start] = useTransition();
  const base = "/api/college/students/" + encodeURIComponent(membershipId) + "/section";
  function load() {
    if (busy || moving.current) return;
    const version = ++requestVersion.current;
    setOpen(true);
    setLoaded(null);
    setTargetId("");
    setError("");
    start(async () => {
      try {
        const response = await fetch(base, { cache: "no-store" });
        if (!response.ok) throw new Error("Class options unavailable or permission denied");
        const value = await response.json() as Options;
        if (version === requestVersion.current) setLoaded(value);
      } catch (reason) {
        if (version === requestVersion.current) setError(reason instanceof Error ? reason.message : "Could not load classes");
      }
    });
  }
  const selected = loaded?.options.find(item => item.id === targetId);
  const canMove = loaded && selected && selected.id !== loaded.current.sectionId;
  const original=loaded?.options.find(item=>item.id===loaded.current.sectionId);
  const moveConfirmation=selected?studentSectionMoveMessage(name,selected.name):"";
  function submit() {
    if (!loaded || !canMove || !selected || busy || moving.current) return;
    moving.current = true;
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
        requestVersion.current++;
        setOpen(false);
        setLoaded(null);
        setTargetId("");
        showToast({tone:"success",title:"Learner moved successfully",
         description:(original?.name??"Previous class")+" → "+selected.name+". Enrollment history was retained."});
        router.refresh();
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Move failed");
      } finally { moving.current = false; }
    });
  }
  return <div className="min-w-0 text-left">
    <Button variant="secondary" type="button" onClick={load} disabled={busy}
      className="min-h-11 w-full md:min-h-9 md:w-auto">
      Move class
    </Button>
    <Dialog open={open} onOpenChange={next=>{if(!next)close();}} title={"Move class for "+name} dismissible={!busy} footer={<div className="flex w-full flex-col-reverse gap-[var(--lms-space-2)] md:flex-row md:justify-end">
      <Button variant="secondary" type="button" onClick={close}
        className="min-h-11 w-full md:w-auto md:min-h-9" disabled={busy}>Cancel</Button>
      <Button variant="primary" type="button" disabled={!canMove || busy} onClick={submit}
        className="min-h-11 w-full md:w-auto md:min-h-9" loading={busy}>Confirm move</Button>
    </div>}>
      <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <p className="max-w-prose text-xs leading-5 text-body">Same batch and academic period only. Your existing section enrollment is ended and history retained.</p>
      {loaded?<p className="text-sm text-body">Current class: <strong>{original?.name??"Current class"}</strong></p>:null}
      {loaded && loaded.options.every(item => item.id === loaded.current.sectionId) ?
        <EmptyState title="No eligible classes" description="No other eligible class is available in the current batch and period."/> : null}
      {loaded && loaded.options.some(item => item.id !== loaded.current.sectionId) ? <Select className="min-h-11 w-full md:min-h-9" aria-label={"Destination class for " + name}
        value={targetId} disabled={busy} onChange={e => setTargetId(e.target.value)}>
        <option value="">Choose destination</option>
        {loaded.options.filter(item => item.id !== loaded.current.sectionId).map(item =>
          <option key={item.id} value={item.id}>{item.name} (capacity {item.capacity ?? "unlimited"})</option>)}
      </Select> : busy?<Skeleton variant="row" label="Loading classes"/>:!error ? <EmptyState title="No classes loaded" description="No class data loaded"/> : null}
      {error ? <div className="space-y-[var(--lms-space-2)]"><Alert tone="error">{error}</Alert>
        <Button variant="secondary" type="button" onClick={load} disabled={busy} className="min-h-11 w-full md:w-auto md:min-h-9">Retry</Button></div> : null}
      {canMove?<Alert tone="info">{moveConfirmation}</Alert>:null}
      </div>
    </Dialog>
  </div>;
}
