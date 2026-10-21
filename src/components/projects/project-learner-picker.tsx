"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

type LearnerChoice = { membershipId: string; displayName: string; rollNumber: string };
type LearnerPage = { learners: LearnerChoice[]; hasMore: boolean; nextOffset: number | null };

export function ProjectLearnerPicker({ collegeId, selected, onChange, disabled = false }: {
  collegeId: string;
  selected: readonly string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const [offset, setOffset] = useState(0);
  const [rows, setRows] = useState<LearnerChoice[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<Record<string, string>>({});
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        collegeId, q: q.trim(), offset: String(offset), limit: "50",
      });
      void fetch("/api/projects/learner-candidates?" + params.toString(), {
        signal: controller.signal, cache: "no-store",
      }).then(async response => {
        if (!response.ok) throw new Error("Could not search learners.");
        return response.json() as Promise<LearnerPage>;
      }).then(page => {
        if (controller.signal.aborted) return;
        setRows(previous => offset === 0 ? page.learners : [
          ...previous, ...page.learners.filter(item =>
            !previous.some(existing => existing.membershipId === item.membershipId)),
        ]);
        setSelectedLabels(previous => {
          const updated = { ...previous };
          for (const item of page.learners) {
            updated[item.membershipId] = item.displayName +
              (item.rollNumber ? " · " + item.rollNumber : "");
          }
          return updated;
        });
        setHasMore(page.hasMore);
      }).catch(() => {
        if (!controller.signal.aborted) setError("Could not search learners.");
      }).finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [collegeId, q, offset, retry]);

  function toggle(id: string, checked: boolean) {
    if (disabled) return;
    if (checked) {
      if (selected.length >= 500 || selected.includes(id)) return;
      onChange([...selected, id]);
    } else {
      onChange(selected.filter(value => value !== id));
    }
  }

  return <section className="min-w-0 space-y-3 border-b border-border pb-4">
    <div>
      <p className="text-sm font-semibold text-foreground">
        Students · {selected.length} selected
      </p>
      <p className="mt-1 text-xs text-body">
        Search learners in this college and select up to 500 for one workspace.
      </p>
    </div>
    <Input type="search" aria-label="Search learners by name or roll number"
      placeholder="Search learners by name or roll number"
      maxLength={120} value={q} disabled={disabled}
      onChange={event => { setQ(event.target.value); setOffset(0); setRows([]); }} />
    {selected.length ? <div className="flex min-w-0 flex-wrap gap-2" aria-label="Selected learners">
      {selected.map(id => <div key={id} className="inline-flex min-w-0 items-center gap-2 rounded-[var(--lms-control-radius)] border border-border bg-surface px-2 py-1 text-xs">
        <span className="max-w-48 truncate">{selectedLabels[id] ?? "Selected learner"}</span>
        <Button variant="ghost" size="sm" type="button" disabled={disabled}
          onClick={() => toggle(id, false)} aria-label={"Remove " + (selectedLabels[id] ?? "learner")}>
          Remove
        </Button>
      </div>)}
    </div> : null}
    {error ? <div role="alert" className="text-sm text-error">
      {error}
      <Button variant="ghost" type="button" className="ml-2 underline"
        onClick={() => setRetry(value => value + 1)}>Try Again</Button>
    </div> : null}
    <div tabIndex={0} aria-label="College learner search results"
      className="max-h-52 divide-y divide-border overflow-y-auto border-y border-border">
      {rows.map(item => <label key={item.membershipId}
        className="flex min-h-11 min-w-0 items-center gap-2 py-2 text-sm text-body">
        <Checkbox checked={selected.includes(item.membershipId)}
          disabled={disabled || (selected.length >= 500 && !selected.includes(item.membershipId))}
          onChange={event => toggle(item.membershipId, event.target.checked)} />
        <span className="min-w-0 break-words">{item.displayName}
          {item.rollNumber ? " · " + item.rollNumber : ""}
        </span>
      </label>)}
      {loading ? <p role="status" className="px-2 py-3 text-sm text-body">Searching learners…</p> : null}
      {!loading && !rows.length && !error ? <p className="px-2 py-3 text-sm text-body">
        No learners match this search.
      </p> : null}
    </div>
    {hasMore && !loading ? <Button type="button" variant="secondary" disabled={disabled}
      onClick={() => setOffset(value => value + 50)}>Load more learners</Button> : null}
    {selected.length >= 500 ? <p role="status" className="text-xs text-warning-text">
      Maximum 500 learners selected.
    </p> : null}
  </section>;
}
