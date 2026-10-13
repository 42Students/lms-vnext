import { notFound, redirect } from "next/navigation";
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

  // Preserve the existing learner-coordinator route for
  // learner memberships, including mixed-role memberships.
  // A TPO-only membership receives the new read-only view.
  if (
    hasMembershipRole(context, "TPO") &&
    !hasMembershipRole(context, "LEARNER")
  ) {
    let data: Awaited<
      ReturnType<typeof getTpoRoundDriveDay>
    >;

    try {
      data = await getTpoRoundDriveDay(
        context,
        roundId,
      );
    } catch (error) {
      if (
        error instanceof PlacementsServiceError &&
        error.code === "PLACEMENT_ROUND_NOT_FOUND"
      ) {
        notFound();
      }
      throw error;
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
    redirect("/tpo/drive-day");
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
