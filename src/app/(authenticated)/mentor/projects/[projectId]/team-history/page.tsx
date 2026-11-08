import { FilterBar } from "@/components/ui/filter-bar";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getMentorTeamHistory } from "@/modules/projects/mentor-team-history-service";
import {singleValueMentorFilters} from "@/modules/projects/mentor-filter-query";
import {
  mentorTeamHistoryHref,
  mentorTeamHistoryQuerySchema,
} from "@/modules/projects/mentor-team-history-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { istDateFormatter } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";

type Raw = { view?: string | string[]; role?: string | string[]; primary?:string|string[]; order?:string|string[]; page?: string | string[] };
const formatDate = (value: Date) => istDateFormatter.format(value);

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
    <PageHeader title={"Invalid team history filters"} />
    <p className="text-sm text-body">The filter link is invalid or contains duplicate values. Clear it to stay within this project’s team history.</p>
    <TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/team-history"} className="inline-flex min-h-11 items-center">Clear invalid filters</TextLink>
  </section>;

  const context = await getCurrentRequestContext();
  const data = await getMentorTeamHistory(context, parsed.data);
  const back = "/mentor/projects/" + encodeURIComponent(projectId) + "?tab=team";
  const filtered=data.enabled && (data.query.view!=="ALL"||data.query.role!=="ALL"||data.query.primary!=="ALL"||data.query.order!=="OLDEST");
  return <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
    <PageHeader title="Team membership history"
      description={data.enabled?data.title + " · Registered team join/end records":"Projects access is disabled. Team history cannot be displayed."}
      actions={<TextLink data-unskin="" href={back}
        className="inline-flex min-h-11 items-center text-sm md:min-h-9">
        Team workspace
      </TextLink>} />
    {!data.enabled
      ? <section role="status" className="border-b border-border pb-4 text-sm text-body">
          Projects access is disabled. Team history cannot be displayed.
        </section>
      : <>
        <Tabs ariaLabel="Team membership history views" renderPanel={false} value={data.query.view} items={([["ALL","All records"],["OPEN","Open membership records"],["ENDED","Ended membership records"]] as const).map(([view,label])=>({value:view,label,href:mentorTeamHistoryHref(projectId,{view,role:data.query.role,primary:data.query.primary,order:data.query.order,page:1})}))}/>
        <FilterBar title="Filters"><form method="get" action={"/mentor/projects/"+encodeURIComponent(projectId)+"/team-history"} role="search" aria-label="Team history filters"
          className="grid min-w-0 items-end gap-[8px] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
          <Input type="hidden" name="view" value={data.query.view}/>
          <Label stack>Registered role
            <Select name="role" defaultValue={data.query.role}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All roles</option>
              <option value="MENTOR">Mentors</option><option value="LEARNER">Learners</option>
            </Select>
          </Label>
          <Label stack>Primary Mentor record
            <Select name="primary" defaultValue={data.query.primary}
              className="min-h-11 md:min-h-9">
              <option value="ALL">All team records</option><option value="PRIMARY">Recorded primary Mentors only</option>
            </Select>
          </Label>
          <Label stack>Assignment chronology
            <Select name="order" defaultValue={data.query.order}
              className="min-h-11 md:min-h-9">
              <option value="OLDEST">Earliest started first</option>
              <option value="NEWEST">Most recent started first</option>
            </Select>
          </Label>
          <Button type="submit" variant="primary" className="min-h-11 w-full md:min-h-9 xl:w-auto">
            Filter role
          </Button>
          {filtered?<TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/team-history"} className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:null}
        </form></FilterBar>

        <p className="text-sm text-body leading-[22px]">{formatNumberIN(data.total)} matching membership record{data.total === 1 ? "" : "s"}</p>
        {data.items.length === 0
          ? <EmptyState title="No team membership records"
              description="No registered membership rows match this project and filter. History from before migration may not be available." action={filtered?<TextLink href={"/mentor/projects/"+encodeURIComponent(projectId)+"/team-history"} className="inline-flex min-h-11 items-center md:min-h-9">Clear</TextLink>:<TextLink href={back} className="inline-flex min-h-11 items-center md:min-h-9">Team workspace</TextLink>} />
          : <div className="divide-y divide-[var(--lms-canvas-border)] border-y border-[var(--lms-canvas-border)]">{data.items.map(item =>
              <article key={item.id} className="py-[var(--lms-space-3)]">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Heading level={2} size="base" className="m-0 leading-6 text-[var(--lms-heading)]">{item.displayName}</Heading>
                  <StatusBadge tone={item.endedAt ? "neutral" : "success"}>{item.state}</StatusBadge>
                </div>
                <p className="mt-2 text-sm text-body leading-[22px]">
                  {item.roleLabel || item.role}
                  {item.isPrimary ? " · Primary mentor" : ""}
                </p>
                <dl className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                  <div><dt className="text-muted-foreground">Joined</dt><dd>{formatDate(item.startedAt)} IST</dd></div>
                  <div><dt className="text-muted-foreground">Ended</dt>
                    <dd>{item.endedAt ? formatDate(item.endedAt) + " IST" : "No end date recorded"}</dd>
                  </div>
                </dl>
              </article>)}</div>}
        {data.totalPages>1?<Pagination label="Team history pagination" page={data.page} pageCount={data.totalPages} hrefForPage={page=>mentorTeamHistoryHref(projectId,{view:data.query.view,role:data.query.role,primary:data.query.primary,order:data.query.order,page})}/>:null}
      </>}
    <p className="text-xs text-muted-foreground leading-[1.6]">
      Open membership rows can contain deactivated accounts; those are labeled Inactive.
      Former or inactive names are hidden. This view does not reconstruct missing historical audit events,
      grant team-edit rights, or infer membership decisions.
    </p>
  </div>;
}
