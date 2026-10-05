import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { DriveDayRoster } from "@/components/placements/drive-day-roster";
import { hasMembershipRole } from "@/modules/identity/context";
import { getDriveDayRoster } from "@/modules/placements/drive-day-coordinator-service";

export default async function DriveDayRoundPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const context =
    await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    redirect("/dashboard");
  }

  const { roundId } = await params;
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
