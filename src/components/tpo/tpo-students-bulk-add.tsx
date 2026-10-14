"use client";

import { useState } from "react";
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
  const [selected, setSelected] = useState<string[]>([]);
  const [driveId, setDriveId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleOptionId, setRoleOptionId] = useState("");
  const [busy, setBusy] = useState(false);
  const [roleError, setRoleError] = useState("");
  const [error, setError] = useState("");
  const [results, setResults] = useState<BulkDriveResult[]>([]);
  const names = new Map(learners.map((learner) => [learner.membershipId, learner.displayName]));

  async function loadRoles(jobId: string) {
    setDriveId(jobId);
    setRoles([]);
    setRoleOptionId("");
    setRoleError("");
    setResults([]);
    if (!jobId) return;
    setBusy(true);
    try {
      const response = await fetch(
        "/api/placements/jobs/" + encodeURIComponent(jobId) + "/roles",
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!response.ok) throw new Error("Cannot load roles for this drive.");
      const body = (await response.json()) as { roles?: Role[] };
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
    if (busy || !driveId || !roleOptionId || selected.length === 0) return;
    const candidates = selected.flatMap((id) => {
      const learner = learners.find((item) => item.membershipId === id);
      return learner ? [{
        membershipId: learner.membershipId,
        displayName: learner.displayName,
      }] : [];
    });
    let payload: ReturnType<typeof buildTpoStudentsBulkPayload>;
    try {
      payload = buildTpoStudentsBulkPayload(roleOptionId, candidates);
      if (payload.membershipIds.length !== selected.length) throw new Error("Selection changed");
    } catch {
      setError("The current-page selection or role is invalid. Review the roster.");
      return;
    }
    if (!window.confirm(
      "Add " + candidates.length + " selected learner(s) to " +
      (drives.find((drive) => drive.id === driveId)?.title ?? "this drive") +
      "? Eligibility and participation are checked individually by the server. " +
      "Ineligible learners will not be added and existing applications are preserved.",
    )) return;
    setBusy(true);
    setError("");
    setResults([]);
    try {
      const response = await fetch(
        "/api/placements/jobs/" + encodeURIComponent(driveId) + "/bulk-add",
        {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | { results?: BulkDriveResult[]; error?: string } | null;
      if (!response.ok || !body?.results) throw new Error(body?.error ?? "Bulk add failed.");
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-body">{selected.length} learner(s) selected</span>
            <button type="button" disabled={busy || !roleOptionId || selected.length === 0}
              onClick={() => void submit()}
              className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary disabled:opacity-50">
              {busy ? "Checking learners…" : "Review and add selected"}
            </button>
          </div>
        </>
      )}
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
