import { Pagination } from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { buildRecruiterCompanyOverview } from "@/modules/placements/recruiter-company-overview-model";
import { listOwnRecruiterPlacementJobs } from "@/modules/placements/recruiter-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getRecruiterCompanyTeam } from "@/modules/placements/recruiter-company-team-service";
import { recruiterTeamAttributedDriveCounts } from "@/modules/placements/recruiter-team-drive-count-service";
import { hrTeamSearchSchema, searchHrTeam } from "@/modules/placements/hr-team-search-model";
import {hrTeamRosterMessage} from "@/modules/placements/hr-team-roster-message-model";
import {hrTeamPageSchema,hrTeamPage} from "@/modules/placements/hr-team-pagination-model";

type PageProps = {
  searchParams: Promise<{
    collegeId?: string | string[];
    tab?: string | string[];
    q?: string | string[];
    teamPage?: string | string[];
  }>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HrCompanyPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || context.recruiter?.userId !== context.user.id) redirect("/dashboard");

  const query = await searchParams;
  // A repeated filter cannot be treated as the first college or first search
  // value. Keep the existing recoverable invalid-college state on ambiguity.
  const repeated=Object.values(query).some(Array.isArray);
  const collegeQuery = z.string().uuid().optional().safeParse(repeated?null:one(query.collegeId));
  if (!collegeQuery.success) return <div className="min-w-0 max-w-full space-y-5"><PageHeader eyebrow="Recruiter" title="Company & Team" />
    <ErrorState title="Invalid college selection" description="Choose a college from your authorized access list."
      action={<Link href="/hr/company" className="text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Choose college</Link>} /></div>;
  const requestedCollegeId = collegeQuery.data ?? null;
  const requestedTab = one(query.tab);
  const teamQuery = hrTeamSearchSchema.safeParse(one(query.q));
  const teamPage = hrTeamPageSchema.safeParse(one(query.teamPage));

  if (requestedTab === "reports") {
    redirect(
      "/hr/company/reports" +
        (requestedCollegeId
          ? "?collegeId=" + encodeURIComponent(requestedCollegeId)
          : ""),
    );
  }

  const tab = requestedTab === "team" ? "team" : "company";
  if (!teamQuery.success || !teamPage.success) return <div className="min-w-0 max-w-full space-y-4"><PageHeader eyebrow="Recruiter" title="Company & Team" />
    <ErrorState title="Invalid team filter" description="Search must be 120 characters or fewer."
      action={<Link href="/hr/company?tab=team" className="text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">Clear search</Link>} /></div>;
  const result = await getRecruiterCompanyTeam(context, requestedCollegeId);

  if (result.status !== "READY") {
    return (
      <div className="min-w-0 max-w-full space-y-6">
        <PageHeader
          eyebrow="Recruiter"
          title="Company & Team"
          description="Choose the college whose recruiter relationship you want to view. We never guess a college when more than one access grant is active."
        />
        <section className="border-b border-border pb-5">
          <h2 className="text-base font-semibold text-foreground">
            {result.status === "NO_ACCESS" ? "No active college access" : "Choose a college"}
          </h2>
          {result.status === "NO_ACCESS" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Your recruiter account has no active college access. Contact the placement cell that invited you.
            </p>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {result.choices.map((grant) => (
                <Link
                  key={grant.id}
                  href={"/hr/company?collegeId=" + encodeURIComponent(grant.collegeId)}
                  className="rounded-[var(--lms-control-radius)] border border-border bg-muted p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                >
                  <div className="font-medium text-foreground">{grant.collegeName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">Open Company & Team</div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  }

  const jobs = await listOwnRecruiterPlacementJobs(context,result.grant.collegeId);
  const overview = buildRecruiterCompanyOverview(jobs, result.grant.collegeId, result.company.relationshipId);
  const attributedDriveCounts=await recruiterTeamAttributedDriveCounts(context,result.grant.collegeId,result.company.relationshipId,jobs);
  const matchingTeam = searchHrTeam(result.team,teamQuery.data);
  const teamPageResult = hrTeamPage(matchingTeam,teamPage.data);
  const base = "/hr/company?collegeId=" + encodeURIComponent(result.grant.collegeId);
  return (
    <div className="min-w-0 max-w-full space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader
          eyebrow="Recruiter"
          title="Company & Team"
          description={"Your work with " + result.grant.collegeName}
        />
        <Link
          href="/hr/profile"
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
        >
          Your profile
        </Link>
      </div>

      {result.choices.length > 1 ? (
        <div className="flex flex-wrap gap-2" aria-label="College access">
          {result.choices.map((grant) => (
            <Link
              key={grant.id}
              href={"/hr/company?collegeId=" + encodeURIComponent(grant.collegeId) + "&tab=" + tab}
              aria-current={grant.collegeId === result.grant.collegeId ? "page" : undefined}
              className={grant.collegeId === result.grant.collegeId
                ? "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] bg-primary px-3 py-1.5 text-sm font-semibold text-on-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
                : "inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 py-1.5 text-sm text-foreground hover:border-primary hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}
            >
              {grant.collegeName}
            </Link>
          ))}
        </div>
      ) : null}

      <nav className="flex gap-2 border-b border-border" aria-label="Company and team sections">
        <Link
          href={base + "&tab=company"}
          className={tab === "company"
            ? "inline-flex min-h-9 items-center border-b-[3px] border-primary px-3 py-2 text-[13px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}
        >
          Company
        </Link>
        <Link
          href={base + "&tab=team"}
          className={tab === "team"
            ? "inline-flex min-h-9 items-center border-b-[3px] border-primary px-3 py-2 text-[13px] font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
            : "inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-muted-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"}
        >
          Team
        </Link>
        <Link
          href={"/hr/company/reports?collegeId=" + encodeURIComponent(result.grant.collegeId)}
          className="inline-flex min-h-9 items-center border-b-[3px] border-transparent px-3 py-2 text-[13px] text-muted-foreground hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]"
        >
          Reports
        </Link>
      </nav>

      {tab === "company" ? (
        <section className="border-b border-border pb-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span aria-hidden="true" className="inline-flex size-11 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-muted font-bold text-foreground">
                  {result.company.name.trim().charAt(0).toUpperCase()}
                </span>
                <h2 className="text-lg font-semibold text-foreground">{result.company.name}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{result.grant.collegeName}</p>
            </div>
            <Badge  tone="neutral">Linked by the placement cell</Badge>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Website</dt>
              <dd className="mt-1 text-sm text-foreground">{result.company.websiteUrl?.startsWith("https://")||result.company.websiteUrl?.startsWith("http://")
                ? <a href={result.company.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-link underline">{result.company.websiteUrl}</a>
                : "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primary domain</dt>
              <dd className="mt-1 text-sm text-foreground">{result.company.primaryDomain ? "@"+result.company.primaryDomain.replace(/^@/,"") : "Not provided"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-sm text-body">Industry not set</p>
          <p className="mt-2 text-xs text-muted-foreground">One company for everyone at it. The placement cell manages the verified company relationship.</p>
          <section aria-label="Hiring footprint" className="mt-6 border-t border-border pt-5">
            <h3 className="text-base font-semibold text-foreground">Hiring footprint with this college</h3>
            <p className="mt-1 text-sm text-body">Only published and closed jobs at this exact employer-college relationship are counted. Jobs are not attributed to individual recruiters.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                {label: "All visible drives", value: overview.total},
                {label: "Live drives", value: overview.active},
                {label: "Closed drives", value: overview.closed},
              ].map(item=><div key={item.label} className="rounded-[var(--lms-control-radius)] border border-border bg-muted p-3">
                <span className="block text-xs text-muted-foreground">{item.label}</span>
                <span className="mt-1 block text-xl font-bold tabular-nums text-foreground">{item.value}</span>
              </div>)}
            </div>
            {overview.recent.length ? <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Recent hiring drives</h4>
              {overview.recent.map(job=><Link key={job.id} href={"/recruiter/drives/"+job.id+"?tab=overview"}
                className="flex flex-wrap justify-between gap-2 rounded-[var(--lms-control-radius)] border border-border p-3 text-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)] min-h-9">
                <span className="font-medium text-primary-text">{job.title}</span>
                <span className="text-muted-foreground">{job.status}</span>
              </Link>)}
            </div> : <p className="mt-4 text-sm text-muted-foreground">No published or closed drives for this relationship.</p>}
          </section>
        </section>
      ) : (
        <section className="border-b border-border pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-foreground">Recruiter team</h2>
            <Link href={"/api/placements/recruiter/team/export?collegeId="+encodeURIComponent(result.grant.collegeId)+"&q="+encodeURIComponent(teamQuery.data)}
              className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
              Export authorized team CSV
            </Link>
          </div>
          <p className="mt-2 text-sm text-body">
            Colleagues from your company who work with this college. To add one, ask the placement cell to invite them with their work email; the placement cell decides who gets access.
          </p>
          <form action="/hr/company" method="get" className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="collegeId" value={result.grant.collegeId}/>
            <input type="hidden" name="tab" value="team"/>
            <label htmlFor="hr-team-query" className="sr-only">Search own-company team</label>
            <Input id="hr-team-query" name="q" defaultValue={teamQuery.data} maxLength={120}
              placeholder="Search name, designation or email"
              className="min-w-48 flex-1"/>
            <Button type="submit" variant="secondary">Search</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">{matchingTeam.length} of {result.team.length} active teammates
            {" · Displaying "+teamPageResult.first+"–"+teamPageResult.last}
          </p>
          {hrTeamRosterMessage(result.team,matchingTeam.length,teamQuery.data,teamPageResult.rows.length)?
            <p role="status" className="mt-3 text-sm text-muted-foreground">
              {hrTeamRosterMessage(result.team,matchingTeam.length,teamQuery.data,teamPageResult.rows.length)}
            </p>:null}
          {teamPageResult.rows.length===0 ? null : (
            <div className="mt-4 divide-y divide-border">
              {teamPageResult.rows.map((member) => (
                <div key={member.userId} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start gap-3">
                    <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-sm font-semibold text-foreground">
                      {(member.displayName||member.email||"R").trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="font-medium text-foreground">
                      {member.displayName || member.email || "Recruiter"}
                      {member.isYou ? <span className="ml-2 text-xs text-primary">You</span> : null}
                    </div>
                      <div className="mt-1 text-sm text-muted-foreground">{member.email ?? "Email not available"}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{attributedDriveCounts[member.userId]??0} drive(s) here</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">{member.title ?? "Recruiter"}</div>
                </div>
              ))}
            </div>
          )}
          <Pagination label="Team roster pages" page={teamPageResult.page} pageCount={teamPageResult.pages} hrefForPage={page=>base+"&tab=team&q="+encodeURIComponent(teamQuery.data)+"&teamPage="+page}/>
        </section>
      )}
    </div>
  );
}
