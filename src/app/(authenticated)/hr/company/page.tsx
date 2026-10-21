import {NeedsDoingChips} from "@/components/ui/needs-doing-chips";
import {getDb} from "@/db/client";
import {placementCompanies} from "@/db/schema";
import {eq} from "drizzle-orm";
import {AuthorizationError} from "@/modules/permissions/policy";
import { SummaryStrip } from "@/components/ui/summary-strip";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
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
  if (!collegeQuery.success) return <div className="min-w-0 max-w-full space-y-4 min-[768px]:space-y-6"><PageHeader title="Company & Team" />
    <ErrorState title="Invalid college selection" description="Choose a college from your authorized access list."
      action={<Link href="/hr/company" className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Choose college</Link>} /></div>;
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
  if (!teamQuery.success || !teamPage.success) return <div className="min-w-0 max-w-full space-y-4"><PageHeader title="Company & Team" />
    <ErrorState title="Invalid team filter" description="Search must be 120 characters or fewer."
      action={<Link href="/hr/company?tab=team" className="min-h-11 md:min-h-9 inline-flex items-center text-primary-text hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Clear search</Link>} /></div>;
  const result = await getRecruiterCompanyTeam(context, requestedCollegeId, tab==="team").catch(error=>{
    if(error instanceof AuthorizationError)throw error;
    return null;
  });
  if(!result)return <div className="min-w-0 space-y-4">
    <PageHeader title="Company & Team"/>
    <ErrorState title="Could not load this" description="Your recruiter college access could not be loaded."
      action={<Link href="/hr/company" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline">Retry</Link>}/>
  </div>;

  if (result.status !== "READY") {
    return (
      <div className="min-w-0 max-w-full space-y-4 min-[768px]:space-y-6">
        <PageHeader
          title="Company & Team"
          description="Choose the college whose recruiter relationship you want to view. We never guess a college when more than one access grant is active."
        />
        {result.status==="NO_ACCESS"?<EmptyState
          title="Open this on your college&apos;s placement address"
          description="Your recruiter account has no active college session. Contact the placement cell that invited you."/>:
          <section className="space-y-3 border-b border-border pb-6">
            <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Choose a college</h2>
            <NeedsDoingChips label="Authorized colleges:" items={result.choices.map(grant=>({
              key:grant.collegeId,label:grant.collegeName,
              href:"/hr/company?collegeId="+encodeURIComponent(grant.collegeId),
            }))}/>
          </section>}
      </div>
    );
  }

  let jobs: Awaited<ReturnType<typeof listOwnRecruiterPlacementJobs>>;
  try {
    jobs = await listOwnRecruiterPlacementJobs(context,result.grant.collegeId);
  } catch {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Company & Team"/>
      <ErrorState title="Could not load this"
        description="The company drive summary is unavailable. Retry to reload this college; no changes were made."
        retryHref={"/hr/company?collegeId="+encodeURIComponent(result.grant.collegeId)+(tab==="team"?"&tab=team":"")}
        retryLabel="Retry"/>
    </div>;
  }
  const overview = buildRecruiterCompanyOverview(jobs, result.grant.collegeId, result.company.relationshipId);
  let attributedDriveCounts: Record<string,number> = {};
  let teamCountsUnavailable = false;
  if (tab==="team") {
    try {
      attributedDriveCounts = await recruiterTeamAttributedDriveCounts(context,
        result.grant.collegeId,result.company.relationshipId,jobs);
    } catch { teamCountsUnavailable = true; }
  }
  // Public logo URL/industry are not present in the normalized relationship read.
  // Resolve only the already-authorized company identity; never expose the private object path.
  const [profile]=tab==="company" ? await getDb().select({
    industry:placementCompanies.industry,logoPublicUrl:placementCompanies.logoPublicUrl,
    verifiedAt:placementCompanies.verifiedAt,
  }).from(placementCompanies).where(eq(placementCompanies.id,result.company.id)).limit(1) : [null];
  const publicLogo=profile?.logoPublicUrl && /^https:\/\/[^\s]+$/i.test(profile.logoPublicUrl)?profile.logoPublicUrl:null;
  const companyDomains=result.company.primaryDomain ? ["@"+result.company.primaryDomain.replace(/^@/,"")] : [];
  if (tab==="team" && (!Array.isArray(result.team) ||
    !result.team.every(member => typeof member.userId === "string" &&
      typeof member.displayName === "string" && typeof member.isYou === "boolean"))) {
    return <div className="min-w-0 space-y-4">
      <PageHeader title="Company & Team"/>
      <ErrorState title="Team data is incomplete"
        description="Could not load this team. Your company information is unchanged."
        retryHref={"/hr/company?collegeId="+encodeURIComponent(result.grant.collegeId)+"&tab=team"}
        retryLabel="Retry team"/>
    </div>;
  }
  const matchingTeam = searchHrTeam(result.team,teamQuery.data);
  const teamPageResult = hrTeamPage(matchingTeam,teamPage.data);
  const base = "/hr/company?collegeId=" + encodeURIComponent(result.grant.collegeId);
  return (
    <div className="min-w-0 max-w-full space-y-4 min-[768px]:space-y-6">
      <PageHeader
        title="Company & Team"
        description={"Your work with "+result.grant.collegeName}
        actions={<Link href="/recruiter/profile"
          className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Your profile
        </Link>}/>

      {result.choices.length > 1 ? <NeedsDoingChips label="College access:"
        selectedKey={result.grant.collegeId}
        items={result.choices.map(grant=>({
          key:grant.collegeId,label:grant.collegeName,
          href:"/hr/company?collegeId="+encodeURIComponent(grant.collegeId)+"&tab="+tab,
        }))}/> : null}

      <div className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 md:p-[var(--lms-canvas-padding)]">
      <Tabs renderPanel={false} ariaLabel="Company and team sections" value={tab}
        items={[{value:"company",label:"Company",href:base+"&tab=company"},
          {value:"team",label:"Team",href:base+"&tab=team"},
          {value:"reports",label:"Reports",href:"/hr/company/reports?collegeId="+encodeURIComponent(result.grant.collegeId)}]}/>

      {tab === "company" ? (
        <section className="border-b border-border pb-6">
          <div className="flex min-w-0 flex-col items-start gap-3 min-[768px]:flex-row min-[768px]:justify-between">
            <div className="flex min-w-0 items-start gap-4">
              <span aria-label={"Company logo for "+result.company.name}
                className="inline-flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-[var(--lms-control-radius)] border border-border bg-muted text-2xl font-semibold text-foreground">
                {publicLogo?<img src={publicLogo} alt="" className="h-full w-full object-contain"/>:
                  result.company.name.slice(0,1).toUpperCase()}
              </span>
              <div className="min-w-0">
                <h2 className="break-words font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">{result.company.name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {profile?.verifiedAt&&result.company.trusted?<Badge tone="success">Verified</Badge>:null}
                  {companyDomains.length?<span className="break-all text-sm text-muted-foreground">{companyDomains.join(", ")}</span>:null}
                </div>
                {profile?.industry?<p className="mt-1 text-sm text-muted-foreground">{profile.industry}</p>:null}
                <p className="mt-1 text-xs text-muted-foreground">{result.grant.collegeName}</p>
              </div>
            </div>
          </div>
          <dl className="mt-4 grid min-w-0 gap-4 md:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Website</dt>
              <dd className="mt-1 text-sm text-foreground">{result.company.websiteUrl?.startsWith("https://")||result.company.websiteUrl?.startsWith("http://")
                ? <a href={result.company.websiteUrl} target="_blank" rel="noopener noreferrer" className="max-w-full break-all min-h-11 md:min-h-9 inline-flex items-center text-link underline hover:text-[var(--lms-primary-hover)] active:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">{result.company.websiteUrl}</a>
                : (result.company.websiteUrl??"Not provided")}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primary domain</dt>
              <dd className="mt-1 break-all text-sm text-foreground">{result.company.primaryDomain ? "@"+result.company.primaryDomain.replace(/^@/,"") : "Not provided"}</dd>
            </div>
          </dl>
          <p className="mt-3 max-w-prose text-sm text-muted-foreground">
            {companyDomains.length
              ? "Colleges see this profile. Colleagues who sign in with a work email at "+companyDomains.join(" or ")+" join it."
              : "Colleges see this profile. Your company comes from your work email."}
            {" "}To change the name or logo, ask the placement cell.
          </p>
          <section aria-label="Hiring footprint" className="mt-6 border-t border-border pt-6">
            <h3 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-md)] leading-[24px] min-[768px]:text-[var(--lms-font-lg)] min-[768px]:leading-[26px]">Hiring footprint with this college</h3>
            <p className="mt-1 text-sm text-body">Only published and closed jobs at this exact employer-college relationship are counted. Jobs are not attributed to individual recruiters.</p>
            {overview.recent.length ? <div className="mt-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Recent hiring drives</h4>
              <div className="divide-y divide-border border-y border-border">
              {overview.recent.map(job=><Link key={job.id} href={"/recruiter/drives/"+job.id+"?tab=overview"}
                className="flex min-h-11 min-w-0 flex-wrap items-center justify-between gap-2 py-3 text-sm transition-colors hover:bg-[var(--lms-table-hover)] md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">
                <span className="min-w-0 flex-1 break-words font-medium text-primary-text">{job.title}</span>
                <StatusBadge tone={job.status==="PUBLISHED"?"success":job.status==="DRAFT"?"warning":job.status==="CANCELLED"?"error":"neutral"}>{job.status}</StatusBadge>
              </Link>)}
              </div>
            </div> : <p className="mt-4 text-sm text-muted-foreground">No published or closed drives for this relationship.</p>}
            <SummaryStrip label="Hiring footprint with this college" className="mt-4" steps={[
              {label:"All visible drives",value:overview.total},
              {label:"Live drives",value:overview.active},
              {label:"Closed drives",value:overview.closed},
            ]}/>
          </section>
        </section>
      ) : (
        <section className="border-b border-border pb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] min-[768px]:text-[var(--lms-font-xl)] min-[768px]:leading-[28px]">Recruiter team</h2>
            <Link href={"/api/placements/recruiter/team/export?collegeId="+encodeURIComponent(result.grant.collegeId)+"&q="+encodeURIComponent(teamQuery.data)}
              className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-hover)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
              Export authorized team CSV
            </Link>
          </div>
          <p className="mt-2 text-sm text-body">
            Colleagues from your company who work with this college. To add one, ask the placement cell to invite them with their work email; the placement cell decides who gets access.
          </p>
          <form action="/hr/company" method="get" role="search" aria-label="Recruiter team search" className="mt-3 flex min-w-0 flex-col items-stretch gap-2 min-[768px]:flex-row min-[768px]:items-center">
            <Input type="hidden" name="collegeId" value={result.grant.collegeId}/>
            <Input type="hidden" name="tab" value="team"/>
            <label htmlFor="hr-team-query" className="sr-only">Search own-company team</label>
            <Input id="hr-team-query" type="search" name="q" defaultValue={teamQuery.data} maxLength={120}
              placeholder="Search name, designation or email"
              className="min-h-11 min-w-0 w-full min-[768px]:min-h-9 min-[768px]:max-w-sm min-[768px]:flex-1"/>
            <Button type="submit" variant="secondary" className="min-h-11 w-full md:min-h-9 md:w-auto">Search</Button>
          </form>
          {teamCountsUnavailable ? <p role="alert" className="mb-3 border-l-2 border-[var(--lms-warning-border)] bg-[var(--lms-warning-subtle)] p-3 text-sm text-warning-text">Could not load this team’s drive counts. Retry Team to restore counts.</p> : null}
          <p className="mt-2 text-xs text-muted-foreground">{matchingTeam.length} of {result.team.length} active teammates
            {" · Displaying "+teamPageResult.first+"–"+teamPageResult.last}
          </p>
          {teamPageResult.rows.length>0 && hrTeamRosterMessage(result.team,matchingTeam.length,teamQuery.data,teamPageResult.rows.length)?
            <p role="status" className="mt-3 text-sm text-muted-foreground leading-[1.6]">
              {hrTeamRosterMessage(result.team,matchingTeam.length,teamQuery.data,teamPageResult.rows.length)}
            </p>:null}
          {teamPageResult.rows.length===0 ? <EmptyState title={teamQuery.data?"No matching teammates":"Only you so far"} description={hrTeamRosterMessage(result.team,matchingTeam.length,teamQuery.data,teamPageResult.rows.length)??"No teammates on this page."}
            action={teamQuery.data ? <Link href={base+"&tab=team"} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Clear search</Link> : undefined}/> : (
            <div className="mt-4 min-w-0 divide-y divide-border border-y border-border">
              {teamPageResult.rows.map((member) => (
                <div key={member.userId} className="flex min-w-0 flex-col gap-2 py-3 min-[768px]:flex-row min-[768px]:items-start min-[768px]:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-muted text-sm font-semibold text-foreground">
                      {(member.displayName||member.email||"R").trim().charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="break-words font-medium text-foreground">
                      {member.displayName || member.email || "Recruiter"}
                      {member.isYou ? <Badge tone="info" className="ml-2">You</Badge> : null}
                    </div>
                      <div className="mt-1 break-all text-sm text-muted-foreground">{[member.title,member.email].filter(Boolean).join(" · ")||"Recruiter"}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{attributedDriveCounts[member.userId]??0} {attributedDriveCounts[member.userId]===1?"drive":"drives"} here</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}
          {teamPageResult.pages>1 ? <Pagination label="Team roster pages" page={teamPageResult.page} pageCount={teamPageResult.pages} hrefForPage={page=>base+"&tab=team&q="+encodeURIComponent(teamQuery.data)+"&teamPage="+page}/> : null}
        </section>
      )}
      </div>
    </div>
  );
}
