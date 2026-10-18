import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import { PlacementsServiceError } from "@/modules/placements/errors";
import { tpoShortlistQuerySchema } from "@/modules/placements/tpo-shortlist-model";
import { getTpoDriveShortlist } from "@/modules/placements/tpo-shortlist-service";

type SearchParams = { page?: string | string[] };
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
const dateLabel = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
});

export default async function TpoDriveShortlistPage({
  params, searchParams,
}: {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const context = await getCurrentRequestContext();
  if (!context.membership || !hasMembershipRole(context, "TPO")) redirect("/dashboard");
  const [{ jobId }, query] = await Promise.all([params, searchParams]);
  const validated = tpoShortlistQuerySchema.safeParse({
    jobId,
    ...(first(query.page) ? { page: first(query.page) } : {}),
  });
  if (!validated.success) notFound();
  let data: Awaited<ReturnType<typeof getTpoDriveShortlist>>;
  try {
    data = await getTpoDriveShortlist(context, validated.data);
  } catch (error) {
    if (error instanceof PlacementsServiceError &&
      error.code === "PLACEMENT_JOB_NOT_FOUND") notFound();
    throw error;
  }

  const pathname = "/tpo/placements/jobs/" + encodeURIComponent(data.job.id) + "/shortlist";
  return (
    <div className="min-w-0 space-y-6">
      <Link href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id)}
        className="text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline">
        ← Drive workspace
      </Link>
      <PageHeader
        eyebrow="TPO · Applicants"
        title={data.job.title + " · Current shortlist"}
        description="Current SHORTLISTED screening decisions for submitted applications belonging to active college learners."
        actions={
          <a href={"/api/placements/jobs/" + encodeURIComponent(data.job.id) + "/shortlist/export"}
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
            Export shortlist CSV
          </a>
        }
      />
      <Link
        href={"/tpo/placements/jobs/" + encodeURIComponent(data.job.id) + "/share-preview"}
        className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)] hover:underline"
      >
        Recruiter-visible shortlist report →
      </Link>
      <p className="text-sm text-body">
        {data.total} shortlisted application(s). This is an application-level count:
        one learner may have multiple role-option applications. Withdrawn or
        subsequently rejected applications are not counted. Private screening
        comments are not exported.
      </p>
      {data.rows.length === 0 ? (
        <p role="status" className="rounded-xl border border-border bg-surface p-6 text-sm text-body">
          No currently shortlisted submitted applications appear on this page.
          A previously shortlisted learner may have withdrawn or changed screening state.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-surface">
          <table className="w-full min-w-[38rem] text-left text-sm">
            <thead className="bg-surface-secondary text-muted-foreground">
              <tr>
                {["Learner", "Roll number", "Role option", "Shortlisted at (IST)"].map((heading) => (
                  <th key={heading} scope="col" className="px-4 py-3 font-semibold">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.rows.map((item) => (
                <tr key={item.applicationId}>
                  <td className="px-4 py-3 font-semibold text-foreground">{item.displayName}</td>
                  <td className="px-4 py-3 text-body">{item.rollNumber ?? "Not recorded"}</td>
                  <td className="px-4 py-3 text-body">{item.roleTitle}</td>
                  <td className="px-4 py-3 text-body">
                    {item.shortlistedAtIso
                      ? dateLabel.format(new Date(item.shortlistedAtIso)) + " IST"
                      : "Decision timestamp unavailable"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <nav aria-label="Shortlist pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-4">
          {data.page > 1 ? (
            <Link href={pathname + "?page=" + (data.page - 1)}
              className="font-semibold text-[var(--lms-teal-deep)] hover:underline">← Previous</Link>
          ) : null}
          {data.page < data.totalPages ? (
            <Link href={pathname + "?page=" + (data.page + 1)}
              className="font-semibold text-[var(--lms-teal-deep)] hover:underline">Next →</Link>
          ) : null}
        </div>
      </nav>
    </div>
  );
}
