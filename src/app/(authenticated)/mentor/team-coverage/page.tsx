import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  mentorTeamCoverageHref, mentorTeamCoverageQuerySchema,
} from "@/modules/projects/mentor-team-coverage-model";
import { getMentorTeamCoverage } from "@/modules/projects/mentor-team-coverage-service";

type Params = {
  filter?: string | string[];
  status?: string | string[];
  assignment?: string | string[];
  order?: string | string[];
  search?: string | string[];
  page?: string | string[];
};
function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function MentorTeamCoveragePage({
  searchParams,
}: { searchParams: Promise<Params> }) {
  const raw = await searchParams;
  const duplicated=Object.values(raw).some(value=>Array.isArray(value)&&value.length!==1);
  const parsed = mentorTeamCoverageQuerySchema.safeParse({
    filter:first(raw.filter) ?? undefined,
    status:first(raw.status) ?? undefined,
    assignment:first(raw.assignment) ?? undefined,
    order:first(raw.order) ?? undefined,
    search:first(raw.search) ?? undefined,
    page:first(raw.page) ?? undefined,
  });
  if (duplicated || !parsed.success) return <section role="alert" className="space-y-3">
    <h1 className="font-semibold text-[30px] font-semibold leading-[1.35] tracking-[-0.02em] text-[var(--lms-heading)]">Invalid team coverage filters</h1>
    <Link href="/mentor/team-coverage" className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Clear filters</Link>
  </section>;

  const context = await getCurrentRequestContext();
  if (!hasMembershipRole(context,"MENTOR")) redirect("/dashboard");
  const data = await getMentorTeamCoverage(context,parsed.data);
  return <div className="min-w-0 max-w-full space-y-6">
    <PageHeader eyebrow="Mentor · Projects" title="Team coverage"
      description="Active team composition across your currently assigned, non-archived projects."
      actions={<Link href="/mentor/projects"
        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        Projects
      </Link>} />
    {!data.enabled
      ? <section role="status" className="border-b border-border pb-4 text-sm text-body">
          Projects access is disabled for this membership. No team records were loaded.
        </section>
      : <>
        <form method="get" action="/mentor/team-coverage"
          className="flex flex-wrap items-end gap-3 border-b border-border pb-4">
          <label className="grid gap-1 text-sm font-semibold text-body">Project search
            <Input type="search" name="search" maxLength={120} defaultValue={data.query.search}
              className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground"
              placeholder="Project name" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Team coverage
            <Select name="filter" defaultValue={data.query.filter}
              className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3 text-foreground">
              <option value="ALL">All projects</option>
              <option value="NO_LEARNERS">No active learners</option>
              <option value="NO_PRIMARY_MENTOR">No active primary Mentor</option>
              <option value="HAS_LEARNERS">Has active learners</option>
              <option value="HAS_PRIMARY_MENTOR">Has active primary Mentor</option>
              <option value="MULTIPLE_MENTORS">Multiple active Mentors</option>
              <option value="FIVE_PLUS_LEARNERS">Five or more active learners</option>
              <option value="NO_LEARNERS_NO_PRIMARY">No learners and no primary Mentor</option>
              <option value="SINGLE_MENTOR">Exactly one active Mentor</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Project state
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
              <option value="ALL">All current assignments</option>
              <option value="PLANNED">Planned</option><option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">My Mentor assignment
            <Select name="assignment" defaultValue={data.query.assignment} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
              <option value="ALL">All assignments</option><option value="PRIMARY">Primary Mentor</option><option value="SUPPORTING">Supporting Mentor</option>
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">Team-size order
            <Select name="order" defaultValue={data.query.order} className="min-h-11 sm:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-3">
              <option value="TITLE">Project title A–Z</option><option value="FEWEST_LEARNERS">Fewest learners first</option><option value="MOST_LEARNERS">Most learners first</option><option value="MOST_MENTORS">Most Mentors first</option><option value="FEWEST_MENTORS">Fewest Mentors first</option>
            </Select>
          </label>
          <Button type="submit" variant="primary">Filter</Button>
          <Link href="/mentor/team-coverage" className="inline-flex min-h-11 items-center px-3 py-2 text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary lms-inline-link">Clear</Link>
        </form>
        <section aria-label="Registered team coverage summary"
          className="grid gap-3 sm:grid-cols-3">
          {([
            ["Current assigned projects",data.projectCount],
            ["Projects with no active learners",data.summary.zeroLearnerProjects],
            ["Projects without primary Mentor",data.summary.withoutPrimaryMentor],
          ] as const).map(([label,value])=>
            <div key={label} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-xs font-semibold text-muted-foreground">{label}</p>
              <p className="mt-2 text-xl font-semibold tabular-nums">{value}</p>
            </div>)}
        </section>
        <p className="text-sm text-body">
          {data.total} matching project{data.total === 1 ? "" : "s"}
        </p>
        {data.items.length === 0
          ? data.projectCount===0
            ? <EmptyState title="No currently assigned active projects"
                description="There are no current non-archived project assignments for this Mentor. No historical team or staffing status is inferred." />
            : <EmptyState title="No projects match these filters"
                description="Your registered assigned projects do not match this search or coverage filter. Clear filters to review all active assignments." />
          : <div className="divide-y divide-border">{data.items.map(item =>
            <article key={item.projectId} className="py-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-semibold text-foreground">{item.title}</h2>
                <span className="text-xs font-semibold text-body">{item.status}</span>
              </div>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Active learners</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{item.learners}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Active Mentors</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums">{item.mentors}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold text-muted-foreground">Active primary Mentor</dt>
                  <dd className="mt-1 text-sm font-semibold text-foreground">
                    {item.hasPrimaryMentor ? "Recorded" : "Not recorded"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 flex flex-wrap gap-4">
                <Link href={"/mentor/projects/" + encodeURIComponent(item.projectId) + "?tab=team"}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Team workspace →
                </Link>
                <Link href={"/mentor/projects/" + encodeURIComponent(item.projectId) + "/team-history"}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Membership history →
                </Link>
                <Link href={"/mentor/projects/" + encodeURIComponent(item.projectId) + "/team-meetings"}
                  className="inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Team meeting log →
                </Link>
              </div>
            </article>)}</div>}
        <nav aria-label="Team coverage pagination"
          className="flex items-center justify-between gap-3">
          <span className="text-sm text-muted-foreground">
            Page {data.page} of {data.totalPages}
          </span>
          <div className="flex gap-3">
            {data.page > 1 && <Link href={mentorTeamCoverageHref({...data.query,page:data.page-1})}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Previous</Link>}
            {data.page < data.totalPages && <Link href={mentorTeamCoverageHref({...data.query,page:data.page+1})}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-link focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Next</Link>}
          </div>
        </nav>
      </>}
    <p className="text-xs leading-5 text-muted-foreground">
      Counts include currently active project memberships backed by active college
      accounts only. Historic team changes, staffing adequacy and mentor workload
      are not inferred from these counts. Team changes remain in authorized project controls.
    </p>
  </div>;
}
