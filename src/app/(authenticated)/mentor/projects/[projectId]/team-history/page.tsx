import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { getMentorTeamHistory } from "@/modules/projects/mentor-team-history-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {
  mentorTeamHistoryHref,
  mentorTeamHistoryQuerySchema,
} from "@/modules/projects/mentor-team-history-model";

type Raw = { view?: string | string[]; role?: string | string[]; primary?:string|string[]; order?:string|string[]; page?: string | string[] };
const formatDate = (value: Date) => new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium", timeZone: "Asia/Kolkata",
}).format(value);

export default async function MentorTeamHistoryPage({
  params, searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Raw>;
}) {
  const [{ projectId }, raw] = await Promise.all([params, searchParams]);
  const normalized = singleValueMentorFilters({
    view: raw.view,role:raw.role,primary:raw.primary,
    order:raw.order,page:raw.page,
  });
  const parsed = mentorTeamHistoryQuerySchema.safeParse(
    normalized ? {projectId,...normalized} : null,
  );
  if (!parsed.success) return <section role="alert" className="space-y-3">
    <PageHeader title="Invalid team history filters" />
    <Link href="/mentor/projects" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Back to projects</Link>
  </section>;

  const context = await getCurrentRequestContext();
  const data = await getMentorTeamHistory(context, parsed.data);
  const back = "/mentor/projects/" + encodeURIComponent(projectId) + "?tab=team";
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Project Team" title="Team membership history"
      description={data.enabled?data.title + " · Registered team join/end records":"Projects access is disabled. Team history cannot be displayed."}
      actions={<Link href={back}
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Team workspace
      </Link>} />
    {!data.enabled
      ? <section role="status" className="border-b border-border pb-4 text-sm text-body">
          Projects access is disabled. Team history cannot be displayed.
        </section>
      : <>
        <form method="get" action={"/mentor/projects/"+encodeURIComponent(projectId)+"/team-history"}
          className="flex flex-wrap items-end gap-3 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
          <Input type="hidden" name="view" value={data.query.view}/>
          <label className="grid gap-1 text-sm font-semibold text-body">Registered role
            <Select name="role" defaultValue={data.query.role}
              className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
              <option value="ALL">All roles</option>
              <option value="MENTOR">Mentors</option><option value="LEARNER">Learners</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Primary Mentor record
            <Select name="primary" defaultValue={data.query.primary}
              className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
              <option value="ALL">All team records</option><option value="PRIMARY">Recorded primary Mentors only</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Assignment chronology
            <Select name="order" defaultValue={data.query.order}
              className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
              <option value="OLDEST">Earliest started first</option>
              <option value="NEWEST">Most recent started first</option>
            </Select>
          </label>
          <Button type="submit" variant="primary">
            Filter role
          </Button>
        </form>
        <Tabs ariaLabel="Team membership history views" renderPanel={false} value={data.query.view} items={([["ALL","All records"],["OPEN","Open membership records"],["ENDED","Ended membership records"]] as const).map(([view,label])=>({value:view,label,href:mentorTeamHistoryHref(projectId,{view,role:data.query.role,primary:data.query.primary,order:data.query.order,page:1})}))}/>
        <p className="text-sm text-body">{data.total} matching membership record{data.total === 1 ? "" : "s"}</p>
        {data.items.length === 0
          ? <EmptyState title="No team membership records"
              description="No registered membership rows match this project and filter. History from before migration may not be available." />
          : <div className="divide-y divide-border">{data.items.map(item =>
              <article key={item.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-semibold text-foreground">{item.displayName}</h2>
                  <span className="text-xs font-semibold text-body">{item.state}</span>
                </div>
                <p className="mt-2 text-sm text-body">
                  {item.roleLabel || item.role}
                  {item.isPrimary ? " · Primary mentor" : ""}
                </p>
                <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                  <div><dt className="text-muted-foreground">Joined</dt><dd>{formatDate(item.startedAt)} IST</dd></div>
                  <div><dt className="text-muted-foreground">Ended</dt>
                    <dd>{item.endedAt ? formatDate(item.endedAt) + " IST" : "No end date recorded"}</dd>
                  </div>
                </dl>
              </article>)}</div>}
        <nav aria-label="Team history pagination" className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
          <div className="flex gap-3">
            {data.page > 1 ? <Link href={mentorTeamHistoryHref(projectId,{view:data.query.view,role:data.query.role,primary:data.query.primary,order:data.query.order,page:data.page-1})}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link> : null}
            {data.page < data.totalPages ? <Link href={mentorTeamHistoryHref(projectId,{view:data.query.view,role:data.query.role,primary:data.query.primary,order:data.query.order,page:data.page+1})}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link> : null}
          </div>
        </nav>
      </>}
    <p className="text-xs leading-5 text-muted-foreground">
      Open membership rows can contain deactivated accounts; those are labeled Inactive.
      Former or inactive names are hidden. This view does not reconstruct missing historical audit events,
      grant team-edit rights, or infer membership decisions.
    </p>
  </div>;
}
