import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { hasMembershipRole } from "@/modules/identity/context";
import { getMentorReviewQueue } from "@/modules/projects/mentor-portfolio-service";
import { mentorPortfolioHref, mentorReviewQuerySchema } from "@/modules/projects/mentor-portfolio-model";

type Params = { projectStatus?: string | string[]; search?: string | string[]; order?: string | string[]; age?: string | string[]; page?: string | string[]; pageSize?: string | string[] };
function first(v: string | string[] | undefined) { return Array.isArray(v) ? v[0] : v; }

export default async function MentorReviewsPage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const raw = await searchParams;
  const parsed = mentorReviewQuerySchema.safeParse({
    search: first(raw.search) ?? undefined,
    projectStatus: first(raw.projectStatus) ?? undefined,
    order: first(raw.order) ?? undefined,
    age: first(raw.age) ?? undefined,
    page: first(raw.page) ?? undefined,
    pageSize: first(raw.pageSize) ?? undefined,
  });
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="text-xl font-semibold">Invalid review filters</h1>
    <Link href="/mentor/reviews" className="text-primary-text underline">Clear filters</Link>
  </section>;
  const data = await getMentorReviewQueue(context, parsed.data);
  return <div className="space-y-6">
    <PageHeader eyebrow="Mentor · Projects" title="Delivery review queue"
      description="Submitted deliveries awaiting review across your currently assigned Mentor projects."
      actions={<div className="flex flex-wrap items-center gap-3">
        <Link href="/mentor/review-history"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary-text">
          Review history
        </Link>
        <Link href="/mentor/projects"
          className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-primary-text">
          Projects
        </Link>
      </div>} />
    {!data.enabled ? <div role="status" className="rounded-xl border border-border bg-surface p-5 text-sm text-body">
      Projects access is disabled. No project data was loaded.
    </div> : <>
      <form action="/mentor/reviews" method="get" className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-surface p-4">
        <label className="grid gap-1 text-sm font-semibold text-body">Search
          <input type="search" name="search" maxLength={120} defaultValue={data.query.search}
            placeholder="Project title" className="min-h-10 rounded-md border border-border bg-background px-3 text-foreground" />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Review order
          <select name="order" defaultValue={data.query.order}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="NEWEST">Newest submitted first</option>
            <option value="OLDEST">Oldest submitted first</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Submitted within
          <select name="age" defaultValue={data.query.age} className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">Any age</option><option value="LAST_7_DAYS">Last 7 days</option><option value="LAST_30_DAYS">Last 30 days</option><option value="OLDER_THAN_7_DAYS">Waiting over 7 days</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Assigned Project lifecycle
          <select name="projectStatus" defaultValue={data.query.projectStatus} className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="ALL">All current assignments</option><option value="PLANNED">Planned</option>
            <option value="ACTIVE">Active</option><option value="COMPLETED">Completed</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-body">Page size
          <select name="pageSize" defaultValue={String(data.pageSize)}
            className="min-h-10 rounded-md border border-border bg-background px-3">
            <option value="20">20</option><option value="50">50</option>
          </select>
        </label>
        <button type="submit" className="min-h-10 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
        <Link href="/mentor/reviews" className="px-3 py-2 text-sm font-semibold text-primary-text">Clear</Link>
      </form>
      <p className="text-sm text-body">{data.total} matching review item{data.total === 1 ? "" : "s"}</p>
      {data.items.length === 0 ? <EmptyState title="No deliveries awaiting review"
        description="No submitted delivery needs review in the matching projects. Reopened or already-reviewed work is not treated as a new submission." />
        : <div className="grid gap-3">{data.items.map(item =>
          <Link key={item.key} href={item.href} className="block rounded-xl border border-border bg-surface p-4 hover:border-primary">
            <p className="font-semibold text-primary-text">{item.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">Submitted: {new Intl.DateTimeFormat("en-IN",{
              dateStyle:"medium",timeStyle:"short",timeZone:"Asia/Kolkata",
            }).format(new Date(item.occurredAt))} IST</p>
            <p className="mt-2 text-sm font-semibold text-primary-text">Open delivery review →</p>
          </Link>)}</div>}
      <nav aria-label="Review queue pagination" className="flex items-center justify-between gap-3">
        <span className="text-sm text-body">Page {data.page} of {data.totalPages}</span>
        <div className="flex gap-3">
          {data.page > 1 && <Link href={mentorPortfolioHref("reviews",{...data.query,page:data.page-1})}
            className="text-sm font-semibold text-primary-text">Previous</Link>}
          {data.page < data.totalPages && <Link href={mentorPortfolioHref("reviews",{...data.query,page:data.page+1})}
            className="text-sm font-semibold text-primary-text">Next</Link>}
        </div>
      </nav>
    </>}
    <p className="text-xs text-muted-foreground">
      Review actions remain in each assigned project&apos;s existing authorized Delivery workspace.
    </p>
  </div>;
}
