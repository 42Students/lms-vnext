"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BulkDriveResult } from "@/modules/placements/bulk-drive-model";

type Learner = { membershipId: string; displayName: string };
type Candidates = { learners: Learner[]; page: number; hasMore: boolean };
type Role = { id: string; title: string };

export function PlacementBulkAddApplicants({
  jobId,
  roles,
  initial,
}: {
  jobId: string;
  roles: Role[];
  initial: Candidates;
}) {
  const router = useRouter();
  const [candidates, setCandidates] = useState(initial);
  const [selected, setSelected] = useState<Map<string, string>>(() => new Map());
  const [search, setSearch] = useState("");
  const [roleOptionId, setRoleOptionId] = useState(roles[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Array<BulkDriveResult & { name: string }>>([]);

  const url = "/api/placements/jobs/" + encodeURIComponent(jobId) + "/bulk-add";

  async function load(page: number) {
    setBusy(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), search: search.trim() });
      const response = await fetch(url + "?" + params.toString(), {
        credentials: "same-origin",
      });
      if (!response.ok) throw new Error("Candidate list could not be loaded.");
      setCandidates((await response.json()) as Candidates);
    } catch {
      setError("Could not load candidates. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function toggle(candidate: Learner, checked: boolean) {
    setError(null);
    setSelected((current) => {
      const next = new Map(current);
      if (checked) {
        if (next.size >= 200 && !next.has(candidate.membershipId)) return current;
        next.set(candidate.membershipId, candidate.displayName);
      } else {
        next.delete(candidate.membershipId);
      }
      return next;
    });
  }

  async function submit() {
    if (!roleOptionId || selected.size === 0 || selected.size > 200 || busy) return;
    const choice = new Map(selected);
    if (!window.confirm(
      "Add " + choice.size + " selected learner(s) to this drive? " +
      "Only currently eligible learners will be added. " +
      "Existing applications will not be replaced.",
    )) return;
    setBusy(true);
    setError(null);
    setResults([]);
    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleOptionId, membershipIds: [...choice.keys()], confirmed: true,
        }),
      });
      if (!response.ok) throw new Error("Bulk add was not completed.");
      const body = (await response.json()) as { results: BulkDriveResult[] };
      setResults(body.results.map((row) => ({
        ...row, name: choice.get(row.membershipId) ?? "Selected learner",
      })));
      setSelected(new Map());
      router.refresh();
    } catch {
      setError(
        "Bulk add could not be completed. Existing selections are preserved. " +
        "Reload the drive before retrying if the connection was interrupted.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-4 border-b border-border pb-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Applicants · Bulk Add-to-Drive</h2>
        <p className="mt-1 text-sm leading-6 text-body">
          Select up to 200 learners across these roster pages, choose the drive role
          and confirm. Eligibility, placement access and current application status
          are checked by the server for each learner before addition. A roster entry
          does not guarantee eligibility.
        </p>
      </div>

      {roles.length === 0 ? (
        <p className="rounded-md border border-border bg-muted p-4 text-sm text-body">
          No active role options are available. Add an active role before using bulk addition.
        </p>
      ) : (
        <>
          <label className="block max-w-md text-sm font-semibold text-foreground">
            Apply learners to role
            <select
              value={roleOptionId}
              onChange={(event) => setRoleOptionId(event.target.value)}
              disabled={busy}
              className="mt-2 min-h-10 w-full rounded-[9px] border border-border bg-surface px-3 text-sm text-foreground"
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>{role.title}</option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap items-end gap-2">
            <label className="flex-1 text-sm font-semibold text-foreground">
              Find learners by name
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                maxLength={80}
                disabled={busy}
                placeholder="Search names"
                className="mt-2 min-h-10 w-full rounded-[9px] border border-border bg-surface px-3 text-sm text-foreground"
              />
            </label>
            <button
              type="button"
              onClick={() => void load(1)}
              disabled={busy}
              className="min-h-10 rounded-[9px] border border-border bg-surface px-4 text-sm font-semibold text-foreground disabled:opacity-50"
            >
              Search
            </button>
          </div>

          {candidates.learners.length === 0 ? (
            <p className="rounded-md border border-border bg-muted p-4 text-sm text-body">
              No active learners match this roster filter. Nothing has been selected or added.
            </p>
          ) : (
            <div className="space-y-2">
              {candidates.learners.map((candidate) => (
                <label
                  key={candidate.membershipId}
                  className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border bg-muted px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={selected.has(candidate.membershipId)}
                    onChange={(event) => toggle(candidate, event.target.checked)}
                    disabled={busy || (selected.size >= 200 && !selected.has(candidate.membershipId))}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm font-medium text-foreground">
                    {candidate.displayName}
                  </span>
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-body">Page {candidates.page}</span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || candidates.page === 1}
                onClick={() => void load(candidates.page - 1)}
                className="min-h-10 rounded-[9px] border border-border px-3 font-medium text-foreground disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={busy || !candidates.hasMore}
                onClick={() => void load(candidates.page + 1)}
                className="min-h-10 rounded-[9px] border border-border px-3 font-medium text-foreground disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border bg-muted p-3">
            <span className="text-sm font-semibold text-foreground">
              {selected.size} / 200 selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy || selected.size === 0}
                onClick={() => setSelected(new Map())}
                className="min-h-10 rounded-[9px] border border-border bg-surface px-3 text-sm font-medium text-foreground disabled:opacity-50"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={busy || selected.size === 0 || !roleOptionId}
                onClick={() => void submit()}
                className="min-h-10 rounded-[9px] bg-primary px-4 text-sm font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
              >
                {busy ? "Working..." : "Review and confirm Add-to-Drive"}
              </button>
            </div>
          </div>
        </>
      )}

      {error ? <p role="alert" className="text-sm text-error">{error}</p> : null}

      {results.length > 0 ? (
        <div aria-live="polite" className="space-y-2">
          <h3 className="font-semibold text-foreground">Results for each selected learner</h3>
          <ul className="divide-y divide-border rounded-md border border-border">
            {results.map((row) => (
              <li key={row.membershipId} className="flex flex-wrap gap-2 px-3 py-2 text-sm">
                <span className="font-medium text-foreground">{row.name}</span>
                <span className="text-body">
                  {row.status === "added" ? "Added" :
                    row.status === "already-added" ? "Already added" : "Ineligible"}
                </span>
                {row.reason ? <span className="text-muted-foreground">— {row.reason}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
