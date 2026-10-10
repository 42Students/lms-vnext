import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { hasActiveRecruiter } from "@/modules/identity/context";

export default async function HrHomePage() {
  const context = await getCurrentRequestContext();
  if (!hasActiveRecruiter(context) || !context.recruiter) redirect("/dashboard");

  const recruiter = context.recruiter;
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Employer Recruiter"
        title="Today"
        description={"Your work with colleges as " + recruiter.companyName + "."}
      />

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">College access</h2>
        {recruiter.grants.length === 0 ? (
          <div className="mt-3 rounded-lg border border-border bg-surface-secondary p-4">
            <div className="font-medium text-foreground">No active college access</div>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask the placement cell that invited you to restore or approve access.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {recruiter.grants.map((grant) => (
              <div key={grant.id} className="rounded-lg border border-border bg-surface-secondary p-4">
                <div className="font-medium text-foreground">{grant.collegeName}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={"/hr/company?collegeId=" + encodeURIComponent(grant.collegeId)}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover"
                  >
                    Company & Team
                  </Link>
                  <Link
                    href="/hr/placements"
                    className="rounded-md border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground hover:bg-surface-secondary"
                  >
                    Hiring Workspace
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5">
        <h2 className="text-base font-semibold text-foreground">Recruiter account</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Company</dt>
            <dd className="mt-1 text-sm text-foreground">{recruiter.companyName}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Designation</dt>
            <dd className="mt-1 text-sm text-foreground">{recruiter.title ?? "Not provided"}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
