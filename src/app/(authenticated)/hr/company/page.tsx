import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";
import { getRecruiterCompanyTeam } from "@/modules/placements/recruiter-company-team-service";

type PageProps = {
  searchParams: Promise<{
    collegeId?: string | string[];
    tab?: string | string[];
  }>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function HrCompanyPage({ searchParams }: PageProps) {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context)) redirect("/dashboard");

  const query = await searchParams;
  const requestedCollegeId = one(query.collegeId) ?? null;
  const requestedTab = one(query.tab);
  const tab = requestedTab === "team" ? "team" : "company";
  const result = await getRecruiterCompanyTeam(context, requestedCollegeId);

  if (result.status !== "READY") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Employer Recruiter"
          title="Company & Team"
          description="Choose the college whose recruiter relationship you want to view. We never guess a college when more than one access grant is active."
        />
        <section className="rounded-xl border border-border bg-surface p-5">
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
                  className="rounded-lg border border-border bg-surface-secondary p-4 hover:border-primary"
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

  const base = "/hr/company?collegeId=" + encodeURIComponent(result.grant.collegeId);
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer Recruiter"
        title="Company & Team"
        description={result.grant.collegeName + " · " + result.company.name}
      />

      {result.choices.length > 1 ? (
        <div className="flex flex-wrap gap-2" aria-label="College access">
          {result.choices.map((grant) => (
            <Link
              key={grant.id}
              href={"/hr/company?collegeId=" + encodeURIComponent(grant.collegeId) + "&tab=" + tab}
              className={grant.collegeId === result.grant.collegeId
                ? "rounded-full bg-primary px-3 py-1.5 text-sm font-medium text-on-primary"
                : "rounded-full border border-border bg-surface px-3 py-1.5 text-sm text-foreground"}
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
            ? "border-b-2 border-primary px-3 py-2 text-sm font-semibold text-foreground"
            : "px-3 py-2 text-sm text-muted-foreground"}
        >
          Company
        </Link>
        <Link
          href={base + "&tab=team"}
          className={tab === "team"
            ? "border-b-2 border-primary px-3 py-2 text-sm font-semibold text-foreground"
            : "px-3 py-2 text-sm text-muted-foreground"}
        >
          Team
        </Link>
      </nav>

      {tab === "company" ? (
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">{result.company.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{result.grant.collegeName}</p>
            </div>
            <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              {result.company.trusted ? "Trusted relationship" : "Standard relationship"}
            </span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Website</dt>
              <dd className="mt-1 text-sm text-foreground">{result.company.websiteUrl ?? "Not provided"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primary domain</dt>
              <dd className="mt-1 text-sm text-foreground">{result.company.primaryDomain ?? "Not provided"}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-5">
          <h2 className="text-base font-semibold text-foreground">Recruiter team</h2>
          {result.team.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Only you so far.</p>
          ) : (
            <div className="mt-4 divide-y divide-border">
              {result.team.map((member) => (
                <div key={member.userId} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div>
                    <div className="font-medium text-foreground">
                      {member.displayName || member.email || "Recruiter"}
                      {member.isYou ? <span className="ml-2 text-xs text-primary">You</span> : null}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{member.email ?? "Email not available"}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{member.title ?? "Recruiter"}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
