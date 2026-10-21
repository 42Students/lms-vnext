"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {ActionPagination} from "@/components/ui/action-pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable } from "@/components/ui/data-table";
import { facultyRosterCsv, facultyRosterFileName } from "@/modules/courses/faculty-roster-export";
import {Dialog} from "@/components/ui/dialog";
import {sortFacultyRosterByRollThenName,facultyRosterPhotoPreview,facultyRosterMetrics} from "@/modules/courses/faculty-roster-display-model";

export type FacultyCourseRosterLearner = {
  membershipId: string;
  displayName: string | null;
  email: string | null;
  phoneE164: string | null;
  rollNumber: string | null;
  /** Explicitly permitted same-origin avatar download; absent until profile photos are provisioned. */
  photoDownloadUrl?: string | null;
};

const PAGE_SIZE = 25;

function nameOf(learner: FacultyCourseRosterLearner) {
  return (
    learner.displayName?.trim() ||
    learner.email?.trim() ||
    `Learner ${learner.membershipId.slice(0, 8)}`
  );
}

function initials(value: string) {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    (parts.length > 1
      ? `${parts[0]![0]}${parts.at(-1)![0]}`
      : parts[0]?.slice(0, 2)) || "L"
  ).toUpperCase();
}

export function FacultyCourseRoster({
  learners,
  sectionName,
  deliveryId,
}: {
  learners: readonly FacultyCourseRosterLearner[];
  sectionName: string;
  deliveryId?: string;
}) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [preview, setPreview] = useState<FacultyCourseRosterLearner|null>(null);

  // Missing roll numbers always follow assigned rolls; ties sort by name.
  const sorted=useMemo(()=>sortFacultyRosterByRollThenName(learners),[learners]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((learner) =>
      [
        nameOf(learner),
        learner.rollNumber,
        learner.email,
        learner.phoneE164,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [search, sorted]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE),
  );
  const currentPage = Math.min(page, totalPages);
  const rows = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const {missingRoll,contactLabel,rollLabel}=facultyRosterMetrics(learners);
  const contacts = learners.filter(
    (learner) =>
      Boolean(learner.email || learner.phoneE164),
  ).length;

  // Faculty exports exclude phone/email and cap the already authorized roster.
  function exportFiltered() {
    // CSV contains exactly the active Section roster already authorized for
    // this Faculty view; filtering does not widen the permission boundary.
    const csv = facultyRosterCsv(filtered);
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    }));
    const link = document.createElement("a");
    link.href = url;
    link.download = facultyRosterFileName(sectionName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  if (learners.length === 0) {
    return (
      <EmptyState
        title="No students yet"
        description="Students will appear here once they are enrolled in this class."
      />
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="min-w-0 space-y-1">
        <h2 className="text-2xl font-semibold leading-8 text-[var(--lms-heading)]">Class list</h2>
        <p className="text-sm text-muted-foreground">{sectionName}</p>
      </header>
      <div className="grid grid-cols-2 gap-x-4 border-y border-[var(--lms-canvas-border)] md:grid-cols-3">
        {[
          ["Students", learners.length],
          [rollLabel, missingRoll],
          [contactLabel, contacts],
        ].map(([label, value]) => (
          <section
            key={label}
            className="min-w-0 py-4 last:col-span-2 md:last:col-span-1"
          >
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-xl font-semibold leading-7 tabular-nums text-[var(--lms-heading)]">
              {value}
            </p>
          </section>
        ))}
      </div>

      <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm text-body">Search or export students in this class.</p>
          </div>
          <div className="grid w-full min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:max-w-[42rem]">
          <label className="block w-full min-w-0 text-[13px] font-semibold text-[var(--lms-neutral-400)] print:hidden leading-4">
            Search students
            <Input
              className="mt-[6px] min-h-11 w-full min-w-0 md:min-h-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Name, roll number, phone or email"
              aria-label="Search students"
            />
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={filtered.length === 0}
            onClick={exportFiltered}
            aria-label="Download roster CSV"
            className="w-full sm:w-auto print:hidden"
          >
            Download roster CSV (names and roll numbers)
          </Button>
          </div>
        </div>
        {search.trim()?<p className="mt-3 text-xs text-muted-foreground" aria-live="polite">
          Showing {rows.length} of {filtered.length} students
          {filtered.length!==learners.length?" · "+learners.length+" in class":""}
        </p>:null}
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title="No students match this search"
          description="Try searching by name, roll number, or contact number."
        />
      ) : (
        <>
          <DataTable
            caption="Students in this class"
            rows={rows}
            getRowKey={learner=>learner.membershipId}
            empty={<EmptyState title="No students match this search" description="Try searching by name, roll number, or contact number." />}
            columns={[
              {key:"student",header:"Student",mobilePriority:"primary" as const,
                cell:(learner)=><div className="flex min-w-0 items-center gap-3">
                  <Button type="button" variant="ghost" onClick={()=>setPreview(learner)}
                    aria-label={"Preview avatar for "+nameOf(learner)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary-text print:hidden">
                    {initials(nameOf(learner))}
                  </Button>
                  <span aria-hidden="true" className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-subtle text-xs font-bold text-primary-text print:inline-flex">{initials(nameOf(learner))}</span>
                  <div className="min-w-0">
                    <p className="m-0 break-words font-semibold text-foreground">{nameOf(learner)}</p>
                    <StatusBadge tone={learner.rollNumber?"info":"warning"}>
                      {learner.rollNumber?`Roll ${learner.rollNumber}`:"Roll not assigned"}
                    </StatusBadge>
                    {deliveryId?<Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+
                      "/students/"+encodeURIComponent(learner.membershipId)}
                      className="mt-1 inline-flex min-h-11 items-center text-xs font-semibold text-[var(--lms-link-text)] hover:underline md:min-h-9">
                      View student details →
                    </Link>:null}
                  </div>
                </div>},
              {key:"phone",header:"Phone",mobilePriority:"secondary" as const,
                cell:(learner)=>learner.phoneE164?<a href={`tel:${learner.phoneE164}`}
                  className="inline-flex min-h-11 items-center break-all font-semibold text-[var(--lms-link-text)] md:min-h-9"
                  aria-label={`Call ${nameOf(learner)}`}>{learner.phoneE164}</a>:
                  <span className="text-muted-foreground">No number</span>},
              {key:"email",header:"Email",mobilePriority:"secondary" as const,
                cell:(learner)=>learner.email?<a href={`mailto:${learner.email}`}
                  className="inline-flex min-h-11 items-center break-all font-semibold text-[var(--lms-link-text)] md:min-h-9"
                  aria-label={`Email ${nameOf(learner)}`}>{learner.email}</a>:
                  <span className="text-muted-foreground">No email</span>},
            ]}
          />

          {totalPages > 1 ? (
            <ActionPagination label="Student roster pages" page={currentPage}
              pageCount={totalPages} onPageChange={setPage} className="print:hidden" />
          ) : null}
        </>
      )}
      <Dialog open={preview!==null} onOpenChange={open=>{if(!open)setPreview(null);}}
        title={preview?"Photo preview · "+nameOf(preview):"Photo preview"}
        description="Only photos provided through an authorized course roster can be displayed.">
        {preview&&facultyRosterPhotoPreview(preview.photoDownloadUrl)?
          <img src={facultyRosterPhotoPreview(preview.photoDownloadUrl)!}
            alt={"Profile photograph of "+nameOf(preview)}
            className="mx-auto max-h-[60vh] max-w-full rounded-[var(--lms-control-radius)] object-contain"/>:
          <div className="space-y-3 text-center">
            <div aria-hidden="true" className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-primary-subtle text-2xl font-semibold text-primary-text">
              {preview?initials(nameOf(preview)):""}
            </div>
            <p className="text-sm text-body">No photo is available for this student.</p>
          </div>}
      </Dialog>
    </div>
  );
}
