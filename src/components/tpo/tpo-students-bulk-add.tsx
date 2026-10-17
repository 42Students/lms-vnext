"use client";
import {apiFetch} from "@/lib/api-fetch";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";

import { useState } from "react";
import {useTpoStudentsSelection} from "./tpo-students-selection";
import { useRouter } from "next/navigation";
import type { BulkDriveResult } from "@/modules/placements/bulk-drive-model";
import {
  buildTpoStudentsBulkPayload,
  formatTpoStudentsBulkOutcome,
} from "@/modules/placements/tpo-students-bulk-add-model";

type Learner = {
  membershipId: string;
  displayName: string;
  branchName: string;
  readinessSignal: string;
};
type Drive = { id: string; title: string; companyName: string };
type Role = { id: string; title: string; status: string };

export function TpoStudentsBulkAdd({
  learners,
  drives,
}: {
  learners: readonly Learner[];
  drives: readonly Drive[];
}) {
  const router = useRouter();
  const [localSelection, setLocalSelection] = useState<string[]>([]);
  const shared=useTpoStudentsSelection();
  const selected=shared?.selected??localSelection;
  const setSelected=shared?.setSelected??setLocalSelection;
  const [driveId, setDriveId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleOptionId, setRoleOptionId] = useState("");
  const [busy, setBusy] = useState(false);
  const {run:runGuarded,pending:guardedPending}=useGuardedAction();
  const [confirmOpen,setConfirmOpen]=useState(false);
  const [includeIneligible,setIncludeIneligible]=useState(false);
  const [overrideReason,setOverrideReason]=useState("");
  const [roleError, setRoleError] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<BulkDriveResult[]>([]);
  const names = new Map(learners.map((learner) => [learner.membershipId, learner.displayName]));
  const pageSelected=selected.filter(id=>names.has(id));

  async function loadRoles(jobId: string) {
    setDriveId(jobId);
    setRoles([]);
    setRoleOptionId("");
    setRoleError("");
    setResults([]);
    if (!jobId) return;
    setBusy(true);
    try {
      const body=await apiFetch<{roles?:Role[]}>(
        "/api/placements/jobs/"+encodeURIComponent(jobId)+"/roles",
        {credentials:"same-origin",cache:"no-store"},
      );
      const active = (body.roles ?? []).filter((role) => role.status === "ACTIVE");
      setRoles(active);
      setRoleOptionId(active[0]?.id ?? "");
      if (active.length === 0) setRoleError("This drive has no active role options.");
    } catch {
      setRoleError("Could not load the selected drive roles. Choose a drive again.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(id: string, checked: boolean) {
    setSelected((current) => checked
      ? current.includes(id) || current.length >= 100 ? current : [...current, id]
      : current.filter((item) => item !== id));
    setError("");
  }

  async function submit() {
    if (busy || !driveId || !roleOptionId || pageSelected.length === 0 || pageSelected.length>100 ||
        includeIneligible && overrideReason.trim().length<3) return;
    const candidates = pageSelected.flatMap((id) => {
      const learner = learners.find((item) => item.membershipId === id);
      return learner ? [{
        membershipId: learner.membershipId,
        displayName: learner.displayName,
      }] : [];
    });
    let payload: ReturnType<typeof buildTpoStudentsBulkPayload>;
    try {
      payload = buildTpoStudentsBulkPayload(roleOptionId, candidates);
      if (payload.membershipIds.length !== pageSelected.length) throw new Error("Selection changed");
    } catch {
      setError("The current-page selection or role is invalid. Review the roster.");
      return;
    }
    // The confirmation is an accessible in-page dialog, opened by the
    // "Review and add selected" button; the server still rechecks eligibility.
    setConfirmOpen(false);
    setBusy(true);
    setError("");
    setResults([]);
    try {
      const body=await apiFetch<{results:BulkDriveResult[]}>(
        "/api/placements/jobs/"+encodeURIComponent(driveId)+"/bulk-add",{
          method:"POST",credentials:"same-origin",
          headers:{"Content-Type":"application/json"},body:JSON.stringify({
           ...payload,...(includeIneligible?{includeIneligible:{reason:overrideReason.trim()}}:{}),
          }),
        });
      if(!Array.isArray(body?.results))throw Error("Could not confirm the selected additions. Refresh applications and try again.");
      setResults(body.results);
      setSelected([]);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message :
        "Could not verify the addition. Refresh drive applications before retrying.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (learners.length === 0) return (
    <section role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      No learners are listed on this filtered roster page. There is nobody to select.
    </section>
  );
  return (
    <section id="student-bulk-add" className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Add selected students to a drive
        </h2>
        <p className="mt-1 text-sm text-body">
          Select up to 100 learners on this current roster page. This selection
          resets when changing the roster page; no student is considered eligible
          until the server checks the selected drive and role.
        </p>
      </div>
      {drives.length === 0 ? (
        <p role="status" className="text-sm text-body">
          No published internal application drives in an active season are available.
          Create or publish a drive before adding learners.
        </p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="text-sm font-semibold text-foreground">
              Published drive
              <select className="mt-1 min-h-10 w-full rounded-md border border-border bg-surface px-3"
                value={driveId} disabled={busy}
                onChange={(event) => void loadRoles(event.target.value)}>
                <option value="">Choose a drive</option>
                {drives.map((drive) => (
                  <option key={drive.id} value={drive.id}>
                    {drive.companyName} · {drive.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-foreground">
              Active role
              <select className="mt-1 min-h-10 w-full rounded-md border border-border bg-surface px-3"
                value={roleOptionId} disabled={busy || roles.length === 0}
                onChange={(event) => setRoleOptionId(event.target.value)}>
                {roles.length === 0 ? <option value="">Select a drive first</option> : null}
                {roles.map((role) => <option key={role.id} value={role.id}>{role.title}</option>)}
              </select>
            </label>
          </div>
          {roleError ? <p role="alert" className="text-sm text-error">{roleError}</p> : null}
          <div className="max-h-80 space-y-1 overflow-auto rounded-md border border-border p-2">
            {learners.map((learner) => (
              <label key={learner.membershipId} className="flex min-h-11 items-center gap-3 rounded-md p-2 text-sm hover:bg-surface-secondary">
                <input type="checkbox" className="h-4 w-4"
                  checked={selected.includes(learner.membershipId)}
                  disabled={busy || !drives.length}
                  onChange={(event) => toggle(learner.membershipId, event.target.checked)}/>
                <span className="flex-1 font-semibold text-foreground">
                  {learner.displayName}
                  <span className="ml-2 font-normal text-muted-foreground">{learner.branchName}</span>
                </span>
                <span className="text-xs text-muted-foreground">
                  {learner.readinessSignal.replaceAll("_", " ").toLowerCase()}
                </span>
              </label>
            ))}
          </div>
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" checked={includeIneligible} disabled={busy}
              onChange={event=>{setIncludeIneligible(event.target.checked);setError("");}}/>
            Add students who are not eligible anyway, with a recorded inclusion reason
          </label>
          {includeIneligible?<label className="grid gap-1 text-sm">Required reason for inclusion
            <textarea value={overrideReason} disabled={busy} maxLength={500}
             onChange={event=>setOverrideReason(event.target.value)}
             className="min-h-20 w-full rounded border border-border bg-surface p-2"/>
          </label>:null}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-body">{pageSelected.length} learner(s) selected</span>
            <button type="button" disabled={busy || !roleOptionId || pageSelected.length === 0 || pageSelected.length>100 ||
                includeIneligible&&overrideReason.trim().length<3}
              onClick={() => setConfirmOpen(true)}
              className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
              {busy ? "Checking learners…" : "Review and add selected"}
            </button>
          </div>
        </>
      )}
      {pageSelected.length>100?<p role="alert">Select at most 100 students for this drive. The same selection remains available for other actions.</p>:null}
      <Dialog open={confirmOpen} onOpenChange={value=>{if(!busy)setConfirmOpen(value);}}
        title="Add selected students to a drive"
        description={"Add "+pageSelected.length+" selected learner(s) to "+
          (drives.find(drive=>drive.id===driveId)?.title??"this drive")+
          "? Eligibility and participation are checked individually by the server. "+
          (includeIneligible?"The inclusion reason will be audited; college, cohort, debarment and proof guards still apply.":
          "Ineligible learners will not be added.")+" Existing applications are preserved."}
        footer={<><Button variant="secondary" disabled={busy} onClick={()=>setConfirmOpen(false)}>Cancel</Button>
          <Button disabled={busy||guardedPending||!pageSelected.length||pageSelected.length>100||!roleOptionId||
            includeIneligible&&overrideReason.trim().length<3} onClick={()=>void runGuarded(submit)}>
            {busy?"Checking learners…":"Confirm add selected"}
          </Button></>}>
        <p className="text-sm">Each eligible learner will be told about the new application. Existing applications remain unchanged.</p>
      </Dialog>
      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}
      {results.length > 0 ? (
        <div aria-live="polite" className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Per-learner result</h3>
          <ul className="max-h-60 divide-y divide-border overflow-auto rounded-md border border-border text-sm">
            {results.map((result) => (
              <li key={result.membershipId} className="flex flex-wrap gap-2 p-3">
                <span className="font-semibold text-foreground">
                  {names.get(result.membershipId) ?? "Selected learner"}
                </span>
                <span className="text-body">{formatTpoStudentsBulkOutcome(result)}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
