import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { displayDriveMetric, describeDriveMetric } from "@/modules/placements/college-drive-overview-model";
import { getCollegeDriveOverview } from "@/modules/placements/college-drive-overview-service";

export default async function CollegeDriveOverviewPage({ params }: {
  params: Promise<{ jobId: string }>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership) redirect("/dashboard");
  const { jobId } = await params;
  const { drive, counts } = await getCollegeDriveOverview(context, jobId);
  return <div className="space-y-6">
    <PageHeader eyebrow="College Admin · Placements" title={drive.title}
      description={drive.companyName + " · " + drive.seasonName}
      actions={<Link href="/college/placements/drives" className="text-primary-text underline">All drives</Link>} />
    <div className="flex flex-wrap gap-3 text-sm text-body">
      <span>Status: {drive.status}</span><span>Type: {drive.employmentType}</span>
      <span>Mode: {drive.workMode}</span><span>Openings: {drive.openings ?? "Not recorded"}</span>
    </div>
    <p className="whitespace-pre-wrap text-body">{drive.description}</p>
    <section aria-label="Drive pipeline metrics" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {(["applications","shortlisted","selected","offered"] as const).map(name=>
        <article key={name} className="rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold capitalize text-body">{name}</h2>
          <p className="mt-3 text-2xl font-semibold text-foreground">{displayDriveMetric(counts[name])}</p>
          <p className="mt-2 text-xs text-muted-foreground">{describeDriveMetric(name)}</p>
        </article>)}
    </section>
    <nav aria-label="Drive detail sections" className="flex flex-wrap gap-4 text-sm font-semibold">
      <Link href={`/college/placements/jobs/${drive.id}/applications`} className="text-primary-text underline">Applications</Link>
      <Link href={`/college/placements/jobs/${drive.id}/interviews`} className="text-primary-text underline">Interviews</Link>
      <Link href={`/college/placements/jobs/${drive.id}`} className="text-primary-text underline">Operations and settings</Link>
    </nav>
    <p className="text-xs text-muted-foreground">These are persisted operational counts, not a sequential funnel. No missing selection data is inferred.</p>
  </div>;
}
