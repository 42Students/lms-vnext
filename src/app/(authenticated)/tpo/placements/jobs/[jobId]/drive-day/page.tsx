import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { hasMembershipRole } from "@/modules/identity/context";
import { getPlacementDriveDay } from "@/modules/placements/drive-day-service";
import { PlacementDriveDayOverview } from "@/components/placements/placement-drive-day-overview";
import { PageHeader } from "@/components/ui/page-header";

export default async function DriveDayForOneDrive({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const { jobId } = await params;
  const drive = await getPlacementDriveDay(context, jobId);
  const root = "/tpo/placements/jobs/" + encodeURIComponent(jobId);
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="TPO · Drive day" title={drive.job.title + " · Drive day"}
      description="The campus-day rounds, attendance and result readiness for this drive."
      actions={<Link href="/tpo/drive-day"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-primary px-4 text-sm font-semibold text-[var(--lms-teal-deep)] md:min-h-9">
        Open drive day / attendance
      </Link>} />
    {drive.rounds.length ? (
      <section aria-label="Drive day rounds" className="grid gap-3 sm:grid-cols-2">
        {drive.rounds.map((round) => {
          const done = round.status === "COMPLETED" || round.status === "CANCELLED";
          return <article key={round.id} className="border-b border-border py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold text-foreground">{round.name}</h2>
              <Badge  tone="neutral">
                {done ? "Done" : round.status}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-body">{round.mode} · {round.scheduledAt
              ? new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", dateStyle: "medium", timeStyle: "short" }).format(round.scheduledAt) + " IST"
              : "Date to be confirmed"}</p>
            <p className="mt-1 text-sm text-body">{round.venue || "Venue to be told"}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm font-semibold">
              <Link className="text-link underline"
                href={root + "/rounds/" + encodeURIComponent(round.id) + "/results"}>See attendance and results</Link>
              <Link className="text-link underline" href="/tpo/drive-day">Open drive day</Link>
            </div>
          </article>;
        })}
      </section>
    ) : <p className="text-sm text-body rounded-[var(--lms-control-radius)] border border-border bg-muted p-3">No rounds planned for this drive day yet.</p>}
    <PlacementDriveDayOverview driveDay={drive} />
  </div>;
}
