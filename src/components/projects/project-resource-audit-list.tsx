"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { projectResourceAuditAction } from "@/modules/projects/project-resource-audit-model";
import {formatProjectIstDateTime} from "@/modules/projects/project-date-time-format-model";

type ResourceEvent = {
  id: string;
  eventType: string;
  summary: string;
  subjectLabel: string | null;
  actorDisplayName: string | null;
  actorType?: string | null;
  actorUserId?: string | null;
  resourceKey?: string | null;
  occurredAt: string;
};
type ResourceAction = "CREATE" | "UPDATE" | "UPSERT" | "DELETE" | "UNKNOWN";
type ActionFilter = "ALL" | Exclude<ResourceAction,"UNKNOWN">;
type ResourceRow = { event: ResourceEvent; action: ResourceAction; label: string };
const labelByAction: Record<ResourceAction, string> = {
  CREATE: "Added", UPDATE: "Edited", UPSERT: "Saved", DELETE: "Removed",
  UNKNOWN: "Unknown",
};
const toneByAction = {
  CREATE: "success", UPDATE: "warning", UPSERT: "info", DELETE: "error",
  UNKNOWN: "neutral",
} as const;

function resourceLabel(event: ResourceEvent) {
  const original = event.resourceKey || event.subjectLabel || event.summary || "—";
  return original.startsWith("resource-")
    ? original.slice("resource-".length).replaceAll("-", " ").replace(/^./, char => char.toUpperCase())
    : original;
}
function actionFor(eventType: string): ResourceAction | null {
  const action=projectResourceAuditAction(eventType);
  switch (action) {
    case "Added": return "CREATE";
    case "Edited": return "UPDATE";
    case "Saved": return "UPSERT";
    case "Removed": return "DELETE";
    default: return action!==null?"UNKNOWN":null;
  }
}
function formatWhen(value: string) {
  return formatProjectIstDateTime(new Date(value));
}

/** Legacy Resource activity table, limited to events in the parent workspace snapshot. */
export function ProjectResourceAuditList({ events }: { events: readonly ResourceEvent[] }) {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<ActionFilter>("ALL");
  const [page, setPage] = useState(1);
  const rows: ResourceRow[] = events.flatMap(event => {
    const action = actionFor(event.eventType);
    return action ? [{ event, action, label: resourceLabel(event) }] : [];
  });
  const query = search.trim().toLocaleLowerCase("en");
  const filtered = rows.filter(row => {
    if (actionFilter !== "ALL" && row.action !== actionFilter) return false;
    if (!query) return true;
    return [row.label, row.event.summary, row.event.actorDisplayName,
      row.event.actorUserId, row.event.actorType, labelByAction[row.action],
      row.event.eventType].join(" ").toLocaleLowerCase("en").includes(query);
  });
  const pageCount = Math.max(1, Math.ceil(filtered.length / 10));
  const currentPage = Math.min(page, pageCount);
  const start = (currentPage - 1) * 10;
  const visible = filtered.slice(start, start + 10);
  const count = (key: ResourceAction) => rows.filter(row => row.action === key).length;
  const columns: DataTableColumn<ResourceRow>[] = [
    { key: "resource", header: "Resource", mobilePriority: "primary",
      cell: row => <span className="break-words">{row.label}</span> },
    { key: "action", header: "Action", mobilePriority: "secondary",
      cell: row => <StatusBadge tone={toneByAction[row.action]}>
        {row.action==="UNKNOWN"?row.event.eventType:labelByAction[row.action]}
      </StatusBadge> },
    { key: "actor", header: "Actor", mobilePriority: "secondary",
      cell: row => <span><span className="block">{row.event.actorDisplayName || row.event.actorUserId || "System"}</span>
        {row.event.actorType?<span className="block text-xs text-muted-foreground">{row.event.actorType}</span>:null}
      </span> },
    { key: "when", header: "When", mobilePriority: "secondary",
      cell: row => <time dateTime={row.event.occurredAt}
        title={new Date(row.event.occurredAt).toLocaleString("en-IN",{
          dateStyle:"full",timeStyle:"long",timeZone:"Asia/Kolkata",
        })}>{formatWhen(row.event.occurredAt)}</time> },
  ];
  return <section aria-label="Resource activity" className="min-w-0 space-y-3 rounded-[var(--lms-control-radius)] border border-border bg-surface p-4 sm:p-5">
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-body">Resource activity</p>
      <h3 className="mt-1 text-base font-semibold text-foreground">See who changed project resources and when</h3>
      <p className="mt-1 text-sm text-body">
        This view focuses on resource changes inside the workspace. Use the full audit trail for broader project events.
      </p>
    </div>
    <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {([
        ["Changes", rows.length], ["Added", count("CREATE")],
        ["Edited", count("UPDATE") + count("UPSERT")], ["Removed", count("DELETE")],
      ] as const).map(([name, value]) => <div key={name} className="border-b border-border px-2 py-2">
        <dt className="text-xs text-muted-foreground">{name}</dt>
        <dd className="mt-1 text-lg font-semibold tabular-nums">{value}</dd>
      </div>)}
    </dl>
    <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(180px,240px)]">
      <label className="min-w-0 text-xs font-semibold text-body">
        Search resource or actor
        <Input type="search" className="mt-1" placeholder="Search resource or actor"
          aria-label="Search resource audit" value={search} onChange={event => {
            setSearch(event.target.value); setPage(1);
          }} />
      </label>
      <label className="min-w-0 text-xs font-semibold text-body">
        Action
        <Select className="mt-1" aria-label="Filter audit actions" value={actionFilter}
          onChange={event => { setActionFilter(event.target.value as ActionFilter); setPage(1); }}>
          <option value="ALL">All actions</option>
          <option value="CREATE">Added</option>
          <option value="UPDATE">Edited</option>
          <option value="UPSERT">Saved</option>
          <option value="DELETE">Removed</option>
        </Select>
      </label>
    </div>
    <DataTable columns={columns} rows={visible} mobileMode="scroll"
      getRowKey={row => row.event.id} caption="Resource activity"
      empty={<EmptyState title={rows.length === 0
        ? "No resource changes yet" : "No resource changes match these filters"}
        description={rows.length === 0 ? "Resource changes will appear here." :
          "Try a different search or action filter."} />} />
    {filtered.length > 0 ? <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-body">
      <span className="tabular-nums">
        {start + 1}–{Math.min(start + 10, filtered.length)} of {filtered.length} matching changes
      </span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" disabled={currentPage <= 1}
          onClick={() => setPage(value => Math.max(1, value - 1))}>Previous</Button>
        <span className="tabular-nums">Page {currentPage} of {pageCount}</span>
        <Button size="sm" variant="secondary" disabled={currentPage >= pageCount}
          onClick={() => setPage(value => Math.min(pageCount, value + 1))}>Next</Button>
      </div>
    </div> : null}
    {events.length >= 100 ? <p className="text-xs text-muted-foreground">
      The workspace activity snapshot is limited to recent events. The four totals only cover loaded events. Open the full audit trail for older resource history.
    </p> : null}
  </section>;
}
