"use client";

import { Children, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SprintRow = {
  id: string;
  title: string;
  status: string;
  description: string | null;
  goal: string | null;
  dueLabel: string | null;
};

/** Legacy large-workspace scan: search and expand only the sprints needed. */
export function ProjectSprintRowList({
  rows, children,
}: {
  rows: readonly SprintRow[];
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  const large = rows.length > 12;
  const nodes = Children.toArray(children);
  const visible = rows.map((row, index) => ({ row, index }))
    .filter(({ row, index }) => !search.trim() ||
      [row.title, row.status, row.description, row.goal, row.dueLabel,
        "Sprint " + (index + 1)].some(value =>
        (value ?? "").toLowerCase().includes(search.trim().toLowerCase())));
  return <div className="mt-4 min-w-0 space-y-3">
    {large ? <div className="space-y-2">
      <label className="block text-xs font-semibold text-body">
        Find an item in this section
        <Input className="mt-1" value={search}
          placeholder="Find an item by title or content"
          onChange={event => setSearch(event.target.value)}/>
      </label>
      <p role="status" className="text-xs text-body">
        Showing {visible.length} of {rows.length} items. Expand only the items you need to edit.
      </p>
    </div> : null}
    {visible.length === 0 ? <p role="status" className="text-sm text-body">
      No sprints match this search.
    </p> : null}
    {visible.map(({ row, index }) => {
      const isOpen = !large || expanded.includes(row.id);
      return <div key={row.id} className="min-w-0">
        {large ? <div className="flex min-w-0 items-center justify-between gap-3 border-t border-[var(--lms-canvas-border)] py-2">
          <Button type="button" variant="ghost" size="sm"
            aria-expanded={isOpen} aria-controls={"workspace-sprint-"+row.id}
            onClick={() => setExpanded(current => current.includes(row.id)
              ? current.filter(id => id !== row.id) : [...current, row.id])}>
            {row.title || "Sprint " + (index + 1)} · {isOpen ? "Collapse" : "Expand"}
          </Button>
          <span className="text-xs text-body">{row.status.replaceAll("_", " ")}</span>
        </div> : null}
        <div id={"workspace-sprint-"+row.id}>{isOpen ? nodes[index] : null}</div>
      </div>;
    })}
  </div>;
}
