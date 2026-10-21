"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProjectMemberActions } from "./project-team-controls";

export type ProjectRosterRow = {
  id: string;
  membershipId: string;
  displayName: string | null;
  role: string;
  roleLabel: string | null;
  isPrimary: boolean;
  tasksAssigned: number;
  tasksDone: number;
  tasksInReview: number;
  tasksInProgress: number;
  lastTaskUpdate: string | null;
  canEdit: boolean;
};

const MEMBER_PAGE_SIZE = 20;

/** Legacy Team tab filter/pagination, with vNext's college membership IDs. */
export function ProjectRosterTable({ projectId, rows }: {
  projectId: string;
  rows: readonly ProjectRosterRow[];
}) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<"ALL" | "LEARNER" | "FACULTY">("ALL");
  const [page, setPage] = useState(1);
  const query = search.trim().toLowerCase();
  const filtered = rows.filter(member =>
    (role === "ALL" ||
      (role === "FACULTY" ? member.role === "MENTOR" : member.role === role)) &&
    (!query || (member.displayName ?? "").toLowerCase().includes(query) ||
      member.membershipId.toLowerCase().includes(query)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / MEMBER_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const first = (currentPage - 1) * MEMBER_PAGE_SIZE;
  const visible = filtered.slice(first, first + MEMBER_PAGE_SIZE);
  const hasActions=rows.some(member=>member.canEdit);
  return <section aria-label="Team members" className="min-w-0 space-y-3">
    <div>
      <h3 className="text-base font-semibold text-[var(--lms-heading)]">Team roster ({rows.length})</h3>
      <p className="mt-1 text-sm text-body">Search, filter and compare task activity</p>
    </div>
    <div className="flex min-w-0 flex-wrap items-end justify-between gap-3">
      <div className="min-w-0 flex-1 sm:max-w-80">
        <label htmlFor="project-roster-search" className="mb-1 block text-xs font-semibold text-body">Search project members</label>
        <Input id="project-roster-search" type="search" value={search} maxLength={120}
          placeholder="Search member name or ID" aria-label="Search project members"
          onChange={event=>{setSearch(event.target.value);setPage(1);}}/>
      </div>
      <div className="min-w-40">
        <label htmlFor="project-roster-role" className="mb-1 block text-xs font-semibold text-body">Member type</label>
        <Select id="project-roster-role" aria-label="Filter project members by type" value={role}
          onChange={event=>{setRole(event.target.value as "ALL"|"LEARNER"|"FACULTY");setPage(1);}}>
          <option value="ALL">All members</option>
          <option value="LEARNER">Learners</option>
          <option value="FACULTY">Faculty</option>
        </Select>
      </div>
    </div>
    {visible.length?<div role="region" aria-label="Project team roster table" tabIndex={0}
      className="min-w-0 overflow-x-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
      <table className="w-full min-w-[780px] border-collapse text-left text-sm leading-5 tabular-nums">
        <caption className="sr-only">Project team members; scroll horizontally to see all columns</caption>
        <thead className="bg-[var(--lms-neutral-50)] text-xs text-[var(--lms-neutral-400)]">
          <tr>{["Member","Role","Tasks assigned","Done · In review · In progress","Last task update",...(hasActions?["Actions"]:[])].map(name=>
            <th key={name} scope="col" className="whitespace-nowrap border-b border-[var(--lms-canvas-border)] px-3 py-3 font-semibold">{name}</th>)}</tr>
        </thead>
        <tbody>{visible.map(member=><tr key={member.id} className="hover:bg-[var(--lms-neutral-50)]">
          <th scope="row" className="border-b border-[var(--lms-canvas-border)] px-3 py-3 font-semibold text-foreground">{member.displayName?.trim()||"—"}</th>
          <td className="border-b border-[var(--lms-canvas-border)] px-3 py-3">
            <StatusBadge tone={member.role==="MENTOR"?"info":"neutral"}>
              {member.role==="MENTOR"&&member.isPrimary?"Primary mentor":
                member.roleLabel?.trim()||(member.role==="MENTOR"?"Faculty":"Learner")}
            </StatusBadge>
          </td>
          <td className="border-b border-[var(--lms-canvas-border)] px-3 py-3">
            {member.role!=="LEARNER"?"—":member.tasksAssigned||<StatusBadge tone="warning">None</StatusBadge>}
          </td>
          <td className="whitespace-nowrap border-b border-[var(--lms-canvas-border)] px-3 py-3">
            {member.role!=="LEARNER"&&!member.tasksAssigned?"—":
              member.tasksAssigned?member.tasksDone+" · "+member.tasksInReview+" · "+member.tasksInProgress:"—"}
          </td>
          <td className="whitespace-nowrap border-b border-[var(--lms-canvas-border)] px-3 py-3">{member.lastTaskUpdate||"—"}</td>
          {hasActions?<td className="border-b border-[var(--lms-canvas-border)] px-3 py-3">
            {member.canEdit?<ProjectMemberActions projectId={projectId}
              member={{id:member.id,role:member.role,isPrimary:member.isPrimary,displayName:member.displayName}}/>:null}
          </td>:null}
        </tr>)}</tbody>
      </table>
    </div>:<EmptyState title={rows.length?"No members match these filters":"No members yet"}
      description={rows.length?"Try a different member name or type.":"No team members have been added."}/>}
    {filtered.length > MEMBER_PAGE_SIZE ? <nav aria-label="Project team pages"
      className="flex flex-wrap items-center justify-between gap-3 text-sm text-body">
      <span>{first + 1}–{Math.min(first + MEMBER_PAGE_SIZE, filtered.length)} of {filtered.length} matching members</span>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" disabled={currentPage <= 1}
          onClick={() => setPage(current => Math.max(1, current - 1))}>Previous</Button>
        <span aria-live="polite">Page {currentPage} of {totalPages}</span>
        <Button size="sm" variant="secondary" disabled={currentPage >= totalPages}
          onClick={() => setPage(current => Math.min(totalPages, current + 1))}>Next</Button>
      </div>
    </nav> : null}
  </section>;
}
