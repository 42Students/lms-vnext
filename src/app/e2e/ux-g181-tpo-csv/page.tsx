import { notFound } from "next/navigation";
import { serializeTpoEligibilityPreviewCsv } from "@/modules/placements/tpo-eligibility-preview-csv-model";
import { serializeTpoLiveDriveDayCsv } from "@/modules/placements/tpo-live-drive-day-csv-model";
import { recruiterLeadsCsv } from "@/modules/placements/tpo-recruiter-export-model";
import { toTpoRequestsPageCsv } from "@/modules/placements/tpo-requests-page-csv-model";
import { tpoRoundFailureCsv } from "@/modules/placements/tpo-round-failure-csv-model";
import { tpoUnplacedFilteredCsv } from "@/modules/placements/tpo-unplaced-filtered-export-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

export const dynamic = "force-dynamic";

/** Synthetic proof for the real CSV serializers. Never available in production. */
export default function TpoCsvProof() {
  if (process.env.NODE_ENV !== "development" || process.env.UX_G181_FIXTURE !== "1") notFound();
  const dangerous = "\u093E=FORMULA(1)";
  const now = new Date("2026-11-08T00:00:00Z");
  const samples = [
    { title: "Eligibility preview", file: "eligibility-preview.csv",
      csv: serializeTpoEligibilityPreviewCsv(
        [{ studentCode: dangerous, decision: "ELIGIBLE", reason: "" }],
        [{ index: 0, status: "matched" as const, reason: null, membershipId: null, expectedVersion: null }]) },
    { title: "Drive-day round", file: "drive-day.csv",
      csv: serializeTpoLiveDriveDayCsv([{ id: "round-1", companyName: dangerous,
        jobTitle: "Engineer", name: "Interview", scheduledAt: null, durationMinutes: null,
        counts: { total: 1, checkedIn: 1, noShow: 0, pending: 0, unknown: 0 } }]) },
    { title: "Recruiter contacts", file: "recruiters.csv",
      csv: recruiterLeadsCsv([{ name: dangerous, companyName: "Example", stage: "NEW",
        ownerName: null, emailNorm: null, phoneNorm: null, source: null,
        inviteStatus: "NOT_SENT", lastActivityAt: null, nextFollowupAt: null,
        createdAt: now.toISOString() }]) },
    { title: "Student requests", file: "requests.csv",
      csv: toTpoRequestsPageCsv([{ id: "request-1", studentName: dangerous,
        requestType: "REVIEW", status: "PENDING", jobTitle: "Engineer",
        companyName: "Example", requestedAt: now }]) },
    { title: "Round failure report", file: "round-failures.csv",
      csv: tpoRoundFailureCsv([{ roundName: dangerous, branchName: "CS",
        failed: 1, decisions: 2, shareOfRoundPercent: 50 }]) },
    { title: "Unplaced learner report", file: "unplaced.csv",
      csv: tpoUnplacedFilteredCsv([{ displayName: dangerous, rollNumber: "R1",
        batch: "2026", branch: "CS", applications: 2, stillInDrive: false,
        lastApplied: null, lowestRecordedPercent: "70",
        undergraduatePercent: "70", marksVerified: "Yes" }]) },
  ];
  return <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10">
    <header className="space-y-2">
      <Heading level={1} className="text-2xl font-semibold">TPO CSV export quality check</Heading>
      <p className="text-sm text-body">Synthetic examples only. No live college or student data.</p>
    </header>
    <div className="grid min-w-0 gap-3 sm:grid-cols-2">
      {samples.map(sample => <section key={sample.file}
        className="min-w-0 space-y-3 rounded-xl border border-border p-4">
        <Heading level={2} className="break-words text-base font-semibold">{sample.title}</Heading>
        <p className="break-all text-xs text-muted-foreground">{sample.file}</p>
        <ButtonLink variant="secondary" className="focus-ring flex min-h-11 w-full items-center justify-center rounded-lg border border-border p-3 text-center text-sm font-semibold"
          download={sample.file}
          href={"data:text/csv;charset=utf-8," + encodeURIComponent(sample.csv)}>
          Download sample CSV
        </ButtonLink>
      </section>)}
    </div>
  </main>;
}
