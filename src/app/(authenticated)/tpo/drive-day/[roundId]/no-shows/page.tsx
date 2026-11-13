import {DataTable} from "@/components/ui/data-table";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import { buildTpoNoShowReport } from "@/modules/placements/tpo-no-show-model";
import { getTpoRoundDriveDay } from "@/modules/placements/tpo-round-drive-day-service";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { requirePlacementManageScope } from "@/modules/placements/scope";
import { placementRoundIdSchema } from "@/modules/placements/validation";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Disclosure } from "@/components/ui/disclosure";
import { TextLink } from "@/components/ui/text-link";
import { istDateTimeFormatter } from "@/lib/format-date";

import { ROLE } from "@/modules/identity/roles";
export default async function TpoNoShowReportPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, ROLE.TPO)) {
    redirect("/dashboard");
  }

  const collegeId = context.membership.collegeId;
  if (!can(context, "placements.manage", { collegeId })) {
    throw new AuthorizationError("placements.manage");
  }
  requirePermission(context, "placements.manage", { collegeId });
  await requirePlacementManageScope(context, collegeId);

  const { roundId } = await params;
  const parsed = placementRoundIdSchema.safeParse(roundId);
  if (!parsed.success) notFound();

  let data: Awaited<ReturnType<typeof getTpoRoundDriveDay>>;
  try {
    data = await getTpoRoundDriveDay(context, parsed.data);
  } catch (error) {
    if (error instanceof PlacementsServiceError &&
        error.code === "PLACEMENT_ROUND_NOT_FOUND") notFound();
    throw error;
  }
  const report = buildTpoNoShowReport(data.rows);
  const roundHref = "/tpo/drive-day/" + encodeURIComponent(data.round.id);
  const formatTime = istDateTimeFormatter;

  return (
    <div className="min-w-0 space-y-[var(--lms-space-6)]">
      <PageHeader
        eyebrow="TPO · Drive Day"
        title={data.companyName + " · No-show report"}
        description={data.job.title + " · " + data.round.name +
          " · Only explicitly marked ABSENT attendance is counted as no-show."}
        actions={
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            <ButtonLink variant="primary"
              href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/no-shows/export"}
            >
              Export explicit no-shows CSV
            </ButtonLink>
            <Disclosure title="Attendance export" className="min-w-0 sm:relative">
              <div className="mt-2 bg-surface sm:absolute sm:right-0 sm:z-(--lms-z-sticky-inline) sm:w-64 sm:rounded-[var(--lms-control-radius)] sm:border sm:border-border sm:p-2 sm:shadow-sm">
                <ButtonLink variant="secondary" href={"/api/placements/drive-day/" + encodeURIComponent(data.round.id) + "/attendance/export"}
                  className="w-full">
                  Export complete attendance CSV
                </ButtonLink>
              </div>
            </Disclosure>
            <TextLink href={roundHref}
              className="inline-flex min-h-11 items-center justify-center px-2 text-sm md:min-h-9">
              ← Back to round overview
            </TextLink>
          </div>
        }
      />
      <section className="grid min-w-0 grid-cols-1 md:grid-cols-2 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-border bg-surface lg:grid-cols-4" aria-label="Attendance reconciliation">
        {[
          ["Current round roster", report.totalRoster],
          ["Explicit no-shows", report.explicitlyAbsentCount],
          ["Awaiting attendance mark", report.awaitingMarkCount],
          ["Unrecognized statuses", report.unknownCount],
        ].map(([name, value], index) => (
          <div key={String(name)} className={"min-w-0 px-3 py-4 sm:px-4 " +
            (index < 2 ? "border-b border-border lg:border-b-0 " : "") +
            (index % 2 === 0 ? "border-r border-border " : "") +
            (index === 1 ? "lg:border-r " : "") +
            (index === 2 ? "lg:border-r " : "")}>
            <p className="text-xs font-medium leading-5 text-body">{name}</p>
            <p className="mt-1 text-2xl font-semibold leading-8 tabular-nums text-foreground">{value}</p>
          </div>
        ))}
      </section>
      {data.round.status !== "COMPLETED" ? (
        <Alert tone="warning">
          This round is {data.round.status.replaceAll("_", " ")}. The report is a current
          snapshot, not a finalized attendance register.
        </Alert>
      ) : null}
      {report.awaitingMarkCount > 0 || report.unknownCount > 0 ? (
        <Alert tone="warning">
          {report.awaitingMarkCount} waiting/unmarked and {report.unknownCount} unknown
          attendance entries are excluded from no-show totals. No absence is inferred.
        </Alert>
      ) : null}
      <section className="min-w-0">
        <div className="border-b border-[var(--lms-canvas-border)] py-[var(--lms-space-4)]">
          <Heading level={2} size="lg" className="leading-[1.4] text-[var(--lms-heading)]">Explicitly absent learners</Heading>
          <p className="mt-1 text-sm text-body">
            Based on persisted ABSENT marks among current, progression-eligible round applicants.
          </p>
        </div>
        <DataTable
          caption="Explicitly absent learners"
          rows={report.explicitAbsences}
          getRowKey={(item) => item.applicationId}
          empty={<EmptyState title="No learner is currently marked ABSENT in this round." description="This does not mean all learners attended; check the waiting/unmarked count above."
            action={<TextLink href={roundHref} className="inline-flex min-h-11 items-center md:min-h-9">← Back to round overview</TextLink>} />}
          columns={[
            {key:"learner",header:"Learner",mobileLabel:"Learner",mobilePriority:"primary",cell:(item)=>item.displayName},
            {key:"roll",header:"Roll number",mobileLabel:"Roll number",mobilePriority:"secondary",cell:(item)=>item.rollNumber??"Not recorded"},
            {key:"status",header:"Application status",mobileLabel:"Application status",mobilePriority:"secondary",cell:(item)=>item.applicationStatus},
          ]}
        />
      </section>
      <Disclosure title="Round report notes" className="min-w-0">
        <p className="max-w-3xl pb-2">
          Round status: {data.round.status}. Scheduled: {" "}
          {data.round.scheduledAt ? formatTime.format(data.round.scheduledAt) + " IST" : "Not scheduled"}.
          This report does not infer absences from failed interviews, missing marks, or
          external attendance sources.
        </p>
      </Disclosure>
    </div>
  );
}
