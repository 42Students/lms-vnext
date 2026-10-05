import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { listMyDriveDayRounds } from "@/modules/placements/drive-day-coordinator-service";

function formatWhen(
  value: Date | null,
  timezone: string | null,
) {
  if (!value) return "Time not scheduled";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone:
      timezone ?? "Asia/Kolkata",
  }).format(value);
}

export default async function DriveDayPage() {
  const context =
    await getCurrentRequestContext();
  if (
    !context.membership ||
    !hasMembershipRole(context, "LEARNER")
  ) {
    redirect("/dashboard");
  }

  const rounds =
    await listMyDriveDayRounds(context);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student coordinator"
        title="Drive day"
        description="Your assigned rounds for today, optimized for quick on-site attendance."
      />

      {rounds.length === 0 ? (
        <section className="rounded-xl border border-border bg-surface p-6">
          <h2 className="m-0 text-base font-semibold text-foreground">
            There is no drive day for you today.
          </h2>
          <p className="mt-2 text-sm text-body">
            This workspace appears only for dates when the placement cell assigns you as a student coordinator.
          </p>
        </section>
      ) : (
        <div className="grid gap-4">
          {rounds.map((round) => (
            <article
              key={round.roundId}
              className="rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-primary-text">
                    Assigned round
                  </p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    {round.company} ·{" "}
                    {round.jobTitle}
                  </h2>
                  <p className="mt-1 text-sm text-body">
                    {round.roundName} ·{" "}
                    {formatWhen(
                      round.startsAt,
                      round.timezone,
                    )}
                    {round.venue
                      ? " · " + round.venue
                      : ""}
                  </p>
                  <div className="mt-3">
                    <StatusBadge tone="info">
                      {round.roundStatus}
                    </StatusBadge>
                  </div>
                </div>
                <Link
                  href={
                    "/tpo/drive-day/" +
                    round.roundId
                  }
                  className="inline-flex min-h-9 items-center justify-center rounded-md border border-primary bg-primary px-3 text-sm font-semibold text-on-primary transition hover:border-primary-hover hover:bg-primary-hover"
                >
                  Open round
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
