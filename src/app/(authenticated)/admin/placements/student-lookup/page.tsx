import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { PageBackLink } from "@/components/ui/page-back-link";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { AdminPlacementStudentSearch } from "@/components/placements/admin-placement-student-search";
import { lookupCollegeStudentPlacement, getCollegeStudentPlacementDetails } from "@/modules/placements/college-placement-student-lookup-service";
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
  const scope = ctx.adminScope?.collegeId ?? null;
  // Memberships and application history are fetched only for the selected,
  // authorized college. A forged learner ID never bypasses this result set.
  const lookup = query && scope
    ? await lookupCollegeStudentPlacement(ctx, query)
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
    ? await getCollegeStudentPlacementDetails(ctx,{membershipId:selectedStudent.membershipId})
        .then(value=>({ok:true as const,value}))
        .catch(()=>({ok:false as const,value:null}))
    : null;
  const selectedProfile = selectedDetail?.value?.student.profile;
  const fullApplicationRows = selectedDetail?.value?.applications??[];
  const byApplicationId = new Map(fullApplicationRows.map(row=>[row.applicationId,row]));
  const studentLabel = selectedStudent
    ? selectedStudent.name?.trim() || selectedStudent.email || `Student #${selectedStudent.membershipId}`
    : "";

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
          label: person.name?.trim() || person.email || `Student #${person.membershipId}`,
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
        <StatusBadge tone={selectedStudent.placed ? "success" : "neutral"}>
          {selectedStudent.placed ? "Joined (confirmed)" : "No confirmed joining recorded"}
        </StatusBadge>
      </div>
      <p className="text-xs text-muted-foreground">{selectedStudent.roll ?? "No roll number"}
        {selectedStudent.email ? ` · ${selectedStudent.email}` : ""}
      </p>
      {selectedDetail&&!selectedDetail.ok?<p role="alert" className="text-sm text-error">The private learner profile and upcoming interviews could not be loaded. Search results below may be incomplete. Refresh to retry.</p>:null}
      <div className="space-y-1" aria-label="Learner profile sections">
        <details className="border-b border-border py-2">
          <summary className="min-h-9 cursor-pointer text-sm font-semibold text-[var(--lms-heading)]">Resume</summary>
          <p className="pt-2 text-xs text-muted-foreground">{selectedProfile?.resumeAvailable
            ? "A verified resume is stored in the learner’s private profile. Open the authorized student directory to review it; no public download URL is exposed."
            : "No verified resume available. Upload and verification are managed in the learner’s profile."}</p>
          <Link href="/admin/students" className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Open student directory</Link>
        </details>
        <details className="border-b border-border py-2">
          <summary className="min-h-9 cursor-pointer text-sm font-semibold text-[var(--lms-heading)]">Skills</summary>
          {selectedProfile?.skills.length ? <ul className="list-disc space-y-1 pl-5 pt-2 text-sm text-body">
            {selectedProfile.skills.map((skill,index)=><li key={index}>{skill}</li>)}
          </ul> : <p className="pt-2 text-xs text-muted-foreground">No skills recorded in the authorized learner profile.</p>}
          <Link href="/admin/students" className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Open student directory</Link>
        </details>
        <details className="border-b border-border py-2">
          <summary className="min-h-9 cursor-pointer text-sm font-semibold text-[var(--lms-heading)]">Job Preferences</summary>
          {selectedProfile?.jobPreferences.length ? <ul className="list-disc space-y-1 pl-5 pt-2 text-sm text-body">
            {selectedProfile.jobPreferences.map((preference,index)=><li key={index}>{preference}</li>)}
          </ul> : <p className="pt-2 text-xs text-muted-foreground">No job preferences recorded in the authorized learner profile.</p>}
          <Link href="/admin/students" className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Open student directory</Link>
        </details>
      </div>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 className="m-0 text-sm font-semibold text-[var(--lms-heading)]">Placement history</h2>
        <Link href={`/admin/placements/student-lookup?${new URLSearchParams({q, student: selectedStudent.membershipId, refresh: "1"})}`}
          className="inline-flex min-h-9 items-center font-semibold text-sm text-link underline">
          Refresh placement history
        </Link>
      </div>
      {selectedStudent.applications.length === 0
        ? <EmptyState title="No applications yet" description="No applications yet — this student hasn't applied to any job posting." />
        : <ul className="min-w-0 divide-y divide-border border-y border-border">
          {selectedStudent.applications.map((row, index) => {
            const detailed=byApplicationId.get(row.applicationId);
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
              {detailed?.rejectionReason ? <p className="text-xs text-error">Rejection reason: {detailed.rejectionReason}</p> : null}
              {detailed?.nextInterview ? <p className="text-xs text-body">
                Next interview: {detailed.nextInterview.roundName} · {new Intl.DateTimeFormat("en-IN",{
                  timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
                }).format(new Date(detailed.nextInterview.startsAt))} IST
                {detailed.nextInterview.room?" · "+detailed.nextInterview.room:""}
              </p> : null}
            </li>;
          })}
        </ul>}
      {selectedStudent.truncated ? <p className="text-xs text-muted-foreground">
        Showing the newest 100 application/offer records. Use the learner’s full placement history to review older records.
      </p> : null}
    </section> : null}
    <div className="flex justify-end">
      <Link href="/admin/placements/analytics" className="text-sm font-semibold text-link underline">Analytics</Link>
    </div>
  </div>;
}
