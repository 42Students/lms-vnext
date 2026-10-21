import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DriveDayRoster } from "@/components/placements/drive-day-roster";
import { TpoRoundDriveDayReadOnly } from "@/components/placements/tpo-round-drive-day-read-only";
import { hasMembershipRole } from "@/modules/identity/context";
import { getDriveDayRoster } from "@/modules/placements/drive-day-coordinator-service";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { getTpoRoundDriveDay } from "@/modules/placements/tpo-round-drive-day-service";

export default async function DriveDayRoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const context =
    await getCurrentRequestContext();
  if (
    !context.membership ||
    (
      !hasMembershipRole(context, "LEARNER") &&
      !hasMembershipRole(context, "TPO")
    )
  ) {
    redirect("/dashboard");
  }

  const { roundId } = await params;

  // This TPO route opens the operator workspace for TPO memberships,
  // even when that same membership also has a learner role.
  if (hasMembershipRole(context, "TPO")) {
    let data: Awaited<
      ReturnType<typeof getTpoRoundDriveDay>
    >;

    try {
      data = await getTpoRoundDriveDay(
        context,
        roundId,
      );
    } catch (error) {
      const unavailable = error instanceof PlacementsServiceError &&
        (error.code === "PLACEMENT_ROUND_NOT_FOUND" ||
         error.code === "PLACEMENT_DRIVE_DAY_ACCESS_DENIED");
      return <section role="alert" className="min-w-0 space-y-4">
        <PageHeader title="Drive day" />
        <Alert tone="error">{unavailable
          ? "This drive day isn't available to you."
          : "Could not load this drive day. Try again."}</Alert>
        <Link href={"/tpo/drive-day/" + encodeURIComponent(roundId) + "?retry=1"}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:bg-primary-subtle">
          Retry
        </Link>
      </section>;
    }

    return <TpoRoundDriveDayReadOnly data={data} />;
  }

  let roster: Awaited<
    ReturnType<typeof getDriveDayRoster>
  >;
  try {
    roster = await getDriveDayRoster(
      context,
      roundId,
    );
  } catch {
    return <section role="alert" className="min-w-0 space-y-4">
      <PageHeader title="Drive day" />
      <Alert tone="error">This drive day isn't available to you.</Alert>
      <Link href={"/tpo/drive-day/" + encodeURIComponent(roundId) + "?retry=1"}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link hover:bg-primary-subtle">
        Retry
      </Link>
    </section>;
  }

  return (
    <DriveDayRoster
      round={{
        id: roster.round.id,
        name: roster.round.name,
        status: roster.round.status,
        scheduledAt:
          roster.round.scheduledAt?.toISOString() ??
          null,
        timezone: roster.round.timezone,
        venue: roster.round.venue,
        company: roster.round.company,
        jobTitle: roster.round.jobTitle,
      }}
      students={roster.students.map(
        (student) => ({
          applicationId:
            student.applicationId,
          displayName: student.displayName,
          rollNumber: student.rollNumber,
          roleTitle: student.roleTitle,
          attendance:
            student.attendance as
              | "WAITING"
              | "PRESENT"
              | "IN_INTERVIEW"
              | "DONE"
              | "ABSENT",
          room: student.room,
        }),
      )}
    />
  );
}
