import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { AdminPlacementStudentSearch } from "@/components/placements/admin-placement-student-search";
import { AdminPlacementStudentProfileEditor } from "@/components/placements/admin-placement-student-profile-editor";
import { suggestCollegePlacementLearners, getCollegeStudentPlacementDetails } from "@/modules/placements/college-placement-student-lookup-service";
import { parseSuperAdminPlacementStudentSearch } from "@/modules/admin-ui/super-admin-placement-student-search-model";

function humanStage(raw: string | null, offer: string | null, joining: string | null) {
  const status = joining === "JOINED" ? "HIRED" :
    offer === "ACCEPTED" ? "OFFERED" : raw === "SUBMITTED" ? "APPLIED" : (raw ?? "");
  const labels: Record<string, string> = {
    APPLIED: "Applied", SHORTLISTED: "Shortlisted", ASSESSMENT: "Test",
    INTERVIEW: "Interview", WAITLISTED: "Waitlisted", OFFERED: "Offered",
    HIRED: "Placed", REJECTED: "Not selected", WITHDRAWN: "Withdrawn",
  };
  return { status, label: labels[status] ?? (status ? status.replaceAll("_", " ").toLowerCase().replace(/^./, char => char.toUpperCase()) : "-") };
}

function stageTone(status: string): "neutral" | "info" | "success" | "warning" | "error" {
  if (status === "HIRED") return "success";
  if (status === "REJECTED") return "error";
  if (status === "APPLIED" || status === "WITHDRAWN") return "neutral";
  if (status === "SHORTLISTED" || status === "OFFERED") return "info";
  return "warning";
}
function stageColor(status: string) {
  switch (status) {
    case "ASSESSMENT": return "bg-amber-50 text-amber-700";
    case "INTERVIEW": return "bg-purple-50 text-purple-700";
    case "WAITLISTED": return "bg-orange-50 text-orange-700";
    case "OFFERED": return "bg-cyan-50 text-cyan-700";
    case "SHORTLISTED": return "bg-blue-50 text-blue-700";
    default: return "";
  }
}
function appliedDate(value: Date | string | null) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}

export default async function SuperAdminPlacementStudentLookup({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getCurrentRequestContext();
  const params = await searchParams;
  const { query, invalid } = parseSuperAdminPlacementStudentSearch(params);
  const q = query ?? "";
  const historyPage=typeof params.historyPage==="string"&&
    /^[1-9][0-9]{0,4}$/.test(params.historyPage)
    ?Math.min(100000,Number(params.historyPage)):1;
  const scope = ctx.adminScope?.collegeId ?? null;
  // Memberships and application history are fetched only for the selected,
  // authorized college. A forged learner ID never bypasses this result set.
  const lookup = query && scope
    ? await suggestCollegePlacementLearners(ctx, query)
        .then(value => ({ ok: true as const, value }))
        .catch(() => ({ ok: false as const }))
    : null;
  const data = lookup?.ok ? lookup.value : null;
  const choices = data?.students.slice(0, 10) ?? [];
  const requestedStudent = typeof params.student === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(params.student)
    ? params.student : null;
  const selectedStudent = choices.find(person => person.membershipId === requestedStudent) ?? null;
  const selectedDetail = selectedStudent
    ? await getCollegeStudentPlacementDetails(ctx,{membershipId:selectedStudent.membershipId,page:historyPage})
        .then(value=>({ok:true as const,value}))
        .catch(()=>({ok:false as const,value:null}))
    : null;
  const selectedProfile = selectedDetail?.value?.student.profile;
  const history=selectedDetail?.value??null;
  const fullApplicationRows=history?.applications??[];
  const studentLabel=selectedStudent?.label??"";
  const historyHref=(page:number)=>"/admin/placements/student-lookup?"+
    new URLSearchParams({q,student:selectedStudent?.membershipId??"",
      historyPage:String(page)}).toString();

  return <div className="min-w-0 space-y-4">
    <div>
      <PageBackLink href="/admin/placements" label="Placement overview" />
      <PageHeader title="Student placement lookup" />
    </div>
    <section aria-label="Student placement status search" className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-4">
      <p className="mb-[6px] text-xs text-muted-foreground">Look up a student’s placement status</p>
      <AdminPlacementStudentSearch
        key={scope ?? "no-college"} collegeId={scope}
        initialQuery={q} selectedId={selectedStudent?.membershipId ?? null}
        choices={choices.map(person => ({
          membershipId: person.membershipId,
          label: person.label,
          roll: person.roll ?? null,
          email: person.email ?? null,
        }))} unavailable={Boolean(lookup && !lookup.ok)}
      />
      {invalid ? <p role="alert" className="mt-2 text-xs text-error">
        Enter 2 to 150 characters in a single search. Search results are scoped to the selected college.
      </p> : null}
      {!scope ? <p role="status" className="mt-2 text-xs text-muted-foreground" id="placement-student-scope-hint">
        Choose a college in the header above to look up student placements.
      </p> : null}
      {lookup && !lookup.ok ? <ErrorState title="Student search failed"
        description="Search failed — try again."
        action={<Link href={`/admin/placements/student-lookup?q=${encodeURIComponent(q)}`}
          className="text-link underline">Retry student search</Link>} /> : null}
      {requestedStudent && !selectedStudent ? <p role="alert" className="mt-2 text-sm text-error">
        Student not found in this college’s current search results. Choose a matching student.
      </p> : null}
    </section>
    {selectedStudent ? <section className="min-w-0 space-y-3 rounded-[8px] border border-[#f0f0f0] bg-[#fafafa] p-4"
      aria-label={`Placement history for ${studentLabel}`}>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
        <strong className="break-words text-sm text-[var(--lms-heading)]">{studentLabel}</strong>
        {history?<StatusBadge tone={history.placed?"success":"neutral"}>
          {history.placed?"Joined (confirmed)":"No confirmed joining recorded"}
        </StatusBadge>:<span role="status" className="text-xs text-muted-foreground">
          Joining status unavailable until the selected learner's record loads.
        </span>}
      </div>
      <p className="text-xs text-muted-foreground">{selectedStudent.roll ?? "No roll number"}
        {selectedStudent.email ? ` · ${selectedStudent.email}` : ""}
      </p>
      {selectedDetail&&!selectedDetail.ok?<p role="alert" className="text-sm text-error">The private learner profile and upcoming interviews could not be loaded. Search results below may be incomplete. Refresh to retry.</p>:null}
      <div className="space-y-1" aria-label="Learner profile sections">
        <details className="border-b border-border py-2">
          <summary className="min-h-9 cursor-pointer text-sm font-semibold text-[var(--lms-heading)]">Resume</summary>
          <p className="pt-2 text-xs text-muted-foreground">{selectedProfile?.resumeAvailable
            ? "The learner’s selected verified resume is stored privately. This link checks college access and file ownership again before granting a short-lived read."
            : "No selected, verified resume is available. Upload, selection and verification remain with the learner; an administrator cannot replace a resume with an unverified URL."}</p>
          {selectedProfile?.resumeAvailable?<a
            href={"/api/placements/college/students/"+encodeURIComponent(selectedStudent.membershipId)+"/resume"}
            target="_blank" rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center text-sm font-semibold text-link underline md:min-h-9">
            View verified resume
          </a>:null}
          <p className="mt-1 text-xs text-muted-foreground">
            Resume replacement is learner-owned. Save or Cancel in the authorized profile editor below changes skills and job preferences only.
          </p>
        </details>
        <AdminPlacementStudentProfileEditor
          key={selectedStudent.membershipId}
          membershipId={selectedStudent.membershipId}
          skills={selectedProfile?.skills ?? []}
          preferences={selectedProfile?.jobPreferences ?? null}
          expectedVersion={selectedProfile?.profileDocumentVersion ?? 0}
          readOnly={!selectedProfile}
        />
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-sm font-semibold text-[var(--lms-heading)]">Placement history</h2>
        <Link href={`/admin/placements/student-lookup?${new URLSearchParams({q, student: selectedStudent.membershipId, refresh: "1"})}`}
          className="inline-flex min-h-9 items-center font-semibold text-sm text-link underline">
          Refresh placement history
        </Link>
      </div>
      {!history?<p role="alert" className="text-sm text-error">
        The selected student's placement history is unavailable. Retry before assuming there are no applications.
      </p>:fullApplicationRows.length === 0
        ? <EmptyState title={history.total===0?"No applications yet":"No applications on this page"}
          description={history.total===0?"No applications yet — this student hasn't applied to any job posting.":"Choose an earlier history page to review the remaining records."} />
        : <ul className="min-w-0 divide-y divide-border border-y border-border">
          {fullApplicationRows.map((row, index) => {
            const { status, label } = humanStage(row.legacyStage??row.applicationStatus, row.offerStatus, row.joining);
            return <li key={row.jobId + ":" + index} className="min-w-0 space-y-1.5 py-3">
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-sm">
                <strong className="break-words text-[var(--lms-heading)]">{row.job?.trim() || "Job"}</strong>
                {row.company ? <span className="break-words text-muted-foreground">{row.company}</span> : null}
                <StatusBadge tone={stageTone(status)} className={stageColor(status)}>{label}</StatusBadge>
              </div>
              <p className="text-xs text-muted-foreground">Applied {appliedDate(row.submittedAt)}
                {status === "SHORTLISTED" ? " · Shortlisted" :
                  status === "ASSESSMENT" ? " · Test stage" :
                  status === "INTERVIEW" ? " · Interview stage" :
                  status === "WAITLISTED" ? " · Waitlisted" :
                  status === "REJECTED" ? " · Not selected" :
                  status === "WITHDRAWN" ? " · Withdrawn" :
                  row.joining === "JOINED" ? " · Joined" :
                  row.offerStatus === "ACCEPTED" ? " · Offer accepted" : ""}
              </p>
              {row.nextInterview ? <p className="text-xs text-body">
                Next interview: {row.nextInterview.roundName} · {new Intl.DateTimeFormat("en-IN",{
                  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
                }).format(new Date(row.nextInterview.startsAt))} IST
                {row.nextInterview.room?" · "+row.nextInterview.room:""}
              </p> : null}
              {row.rejectionReason ? <p className="text-xs text-error">Rejection reason: {row.rejectionReason}</p> : null}
            </li>;
          })}
        </ul>}
      {history?<nav aria-label="Student placement history pages"
        className="flex min-w-0 flex-wrap items-center justify-between gap-3 text-sm">
        <span role="status">Showing {history.total===0?0:(history.page-1)*history.pageSize+1}–{Math.min(history.total,history.page*history.pageSize)}
          {" "}of {history.total} applications · Page {history.page}
        </span>
        <div className="flex flex-wrap gap-3">
          {history.page>1?<Link href={historyHref(history.page-1)}
            className="inline-flex min-h-9 items-center font-semibold text-link underline">Previous</Link>:null}
          {history.hasMore?<Link href={historyHref(history.page+1)}
            className="inline-flex min-h-9 items-center font-semibold text-link underline">Load more / Next 25</Link>:null}
        </div>
      </nav>:null}
    </section> : null}
    <div className="flex justify-end">
      <Link href="/admin/placements/analytics" className="text-sm font-semibold text-link underline">Analytics</Link>
    </div>
  </div>;
}
