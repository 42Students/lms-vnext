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
const AVATAR_TINTS=[
 "bg-amber-100 text-amber-800","bg-sky-100 text-sky-800",
 "bg-emerald-100 text-emerald-800","bg-violet-100 text-violet-800",
 "bg-rose-100 text-rose-800","bg-indigo-100 text-indigo-800",
 "bg-teal-100 text-teal-800","bg-orange-100 text-orange-800",
] as const;
function avatarTint(learner:FacultyCourseRosterLearner){
 let n=0;
 for(const char of learner.membershipId)n=(n*31+char.charCodeAt(0))%8;
 return AVATAR_TINTS[n]??AVATAR_TINTS[0];
}
function phoneLabel(raw:string|null){
 if(!raw)return "No number";
 const value=raw.replace(/[\s-]/g,"");
 const india=/^\+91([6-9][0-9]{4})([0-9]{5})$/.exec(value);
 return india?"+91 "+india[1]+" "+india[2]:value;
}

function nameOf(learner: FacultyCourseRosterLearner) {
  return (
    learner.displayName?.trim() ||
    "—"
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
  advanced=false,
}: {
  learners: readonly FacultyCourseRosterLearner[];
  advanced?:boolean;
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

  const {contactLabel,rollLabel}=facultyRosterMetrics(learners);

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
        <p className="text-sm text-muted-foreground">Students enrolled in {sectionName}.</p>
      </header>
      <div className="flex flex-wrap items-center gap-2" aria-label="Class roster metrics">
        {[
          [learners.length+" students","bg-blue-50 text-blue-800","students"],
          [rollLabel,"bg-amber-50 text-amber-800","roll"],
          [contactLabel,"bg-emerald-50 text-emerald-800","contacts"],
        ].map(([text,tint,id])=><span key={id}
          className={"inline-flex items-center gap-2 rounded-[var(--lms-radius-full)] border border-border px-3 py-2 text-sm font-semibold "+tint}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="16" height="16"
            fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            {id==="students"?<><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M18 6a3 3 0 0 1 0 6m0 3a4 4 0 0 1 3 4"/></>:
            id==="roll"?<><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M5 16h8m2-7h4m-4 4h4"/></>:
            <path d="M4 4h4l2 5-2 2a15 15 0 0 0 5 5l2-2 5 2v4c-10 2-18-6-16-16z"/>}
          </svg>
          {text}
        </span>)}
      </div>
      <section className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
        <div className="flex min-w-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-body">Class list</p>
            <Link href="/teacher/courses" className="inline-flex min-h-9 items-center font-semibold text-link underline">
              Change class
            </Link>
          </div>
          <div className="grid w-full min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end lg:max-w-[42rem]">
          <label className="block w-full min-w-0 text-[13px] font-semibold text-[var(--lms-neutral-400)] print:hidden leading-4">
            {advanced?"Search detailed roster":"Search students"}
            <Input
              className="mt-[6px] min-h-11 w-full min-w-0 md:min-h-9"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, roll no, phone or email"
              aria-label={advanced?"Search detailed roster":"Search students"}
            />
            {search?<Button size="sm" type="button" variant="ghost"
              aria-label="Clear student search" onClick={()=>{setSearch("");setPage(1);}}>Clear search ×</Button>:null}
          </label>
          <Button
            type="button"
            variant="secondary"
            disabled={filtered.length === 0}
            onClick={exportFiltered}
            aria-label={advanced?"Download detailed roster CSV":"Download roster CSV"}
            className="w-full sm:w-auto print:hidden"
          >
            Download roster CSV (names and roll numbers)
          </Button>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground" role="status" aria-live="polite">
          Showing {filtered.length} of {learners.length} students
        </p>
      </section>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching students"
          description="Try searching by name, roll number, or contact number."
        />
      ) : (
        <>
          <div className="hidden min-w-0 md:block">
          <DataTable
            caption="Students in this class"
            rows={rows}
            mobileMode="scroll"
            getRowKey={learner=>learner.membershipId}
            empty={<EmptyState title="No matching students" description="Try searching by name, roll number, or contact number." />}
            columns={[
              {key:"student",header:"Student",mobilePriority:"primary" as const,
                cell:(learner)=><div className="flex min-w-0 items-center gap-3">
                  <Button type="button" variant="ghost" onClick={()=>setPreview(learner)}
                    aria-label={"View "+nameOf(learner)+" profile photo"}
                    className={"flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold print:hidden "+avatarTint(learner)}>
                    {initials(nameOf(learner))}
                  </Button>
                  <span aria-hidden="true" className={"hidden h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold print:inline-flex "+avatarTint(learner)}>{initials(nameOf(learner))}</span>
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
                  aria-label={`Call ${nameOf(learner)}`}>{phoneLabel(learner.phoneE164)}</a>:
                  <span className="text-muted-foreground">No number</span>},
              {key:"email",header:"Email",mobilePriority:"secondary" as const,
                cell:(learner)=>learner.email?<a href={`mailto:${learner.email}`}
                  className="inline-flex min-h-11 items-center break-all font-semibold text-[var(--lms-link-text)] md:min-h-9"
                  aria-label={`Email ${nameOf(learner)}`}>{learner.email}</a>:
                  <span className="text-muted-foreground">No email</span>},
            ]}
          />
          </div>
          <ul className="divide-y divide-border md:hidden" aria-label="Students in this class">
            {rows.map(learner=><li key={learner.membershipId} className="py-3">
              <div className="flex items-start gap-3">
                <Button type="button" variant="ghost" onClick={()=>setPreview(learner)}
                  aria-label={"View "+nameOf(learner)+" profile photo"}
                  className={"h-11 w-11 shrink-0 rounded-full text-xs font-bold "+avatarTint(learner)}>
                  {initials(nameOf(learner))}
                </Button>
                <div className="min-w-0 flex-1 space-y-1">
                  <strong className="block break-words text-sm text-foreground">{nameOf(learner)}</strong>
                  <p className="text-xs text-muted-foreground">Roll No: {learner.rollNumber||"Roll not assigned"}</p>
                  <p className="text-xs text-body">Contact: {phoneLabel(learner.phoneE164)}</p>
                  {deliveryId?<Link href={"/teacher/courses/"+encodeURIComponent(deliveryId)+
                    "/students/"+encodeURIComponent(learner.membershipId)}
                    className="inline-flex min-h-11 items-center text-xs font-semibold text-link underline md:min-h-9">
                    View student details
                  </Link>:null}
                </div>
              </div>
            </li>)}
          </ul>

          {totalPages > 1 ? (
            <ActionPagination label="Student roster pages" page={currentPage}
              pageCount={totalPages} onPageChange={setPage} className="print:hidden" />
          ) : null}
        </>
      )}
      <Dialog open={preview!==null} onOpenChange={open=>{if(!open)setPreview(null);}}
        title={preview?nameOf(preview):"Photo preview"}
        {...(preview ? {description:"Roll "+(preview.rollNumber||"not assigned")} : {})}
        className="max-w-[360px] w-[calc(100%_-_32px)]">
        {preview&&facultyRosterPhotoPreview(preview.photoDownloadUrl)?
          <img src={facultyRosterPhotoPreview(preview.photoDownloadUrl)!}
            alt={"Profile photograph of "+nameOf(preview)}
            className="mx-auto max-h-[60vh] max-w-full rounded-[var(--lms-control-radius)] object-contain"/>:
          <div className="space-y-3 text-center">
            <div aria-hidden="true" className={"mx-auto flex h-24 w-24 items-center justify-center rounded-full text-2xl font-semibold "+(preview?avatarTint(preview):"bg-primary-subtle text-primary-text")}>
              {preview?initials(nameOf(preview)):""}
            </div>
            <p className="text-sm text-muted-foreground" role="status">No photo is available for this student.</p>
          </div>}
      </Dialog>
    </div>
  );
}
