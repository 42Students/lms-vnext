import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import {
  getTpoTrustedCompanies,
} from "@/modules/placements/tpo-settings-people-service";

export default async function TpoTrustedCompaniesPage() {
  const context = await getCurrentRequestContext();

  if (
    !context.membership ||
    !hasMembershipRole(context, "TPO")
  ) {
    redirect("/dashboard");
  }

  const data = await getTpoTrustedCompanies(
    context,
    context.membership.collegeId,
  );

  return (
    <div className="space-y-6">
      <TpoSettingsNav active="trusted" />
      <PageHeader
        eyebrow="TPO · Settings"
        title="Trusted Companies"
        description="Review college-specific employer trust flags and explicitly persisted recruiter-domain allowlist entries. This page does not modify company trust."
        actions={
          <Link
            href="/tpo/settings/team"
            className="inline-flex min-h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-primary-text"
          >
            Placement Team
          </Link>
        }
      />

      {!data.explicitDomainsAvailable ? (
        <section
          role="status"
          className="rounded-xl border border-border bg-surface p-5"
        >
          <h2 className="font-semibold text-foreground">
            Trusted-domain allowlist unavailable
          </h2>
          <p className="mt-2 text-sm leading-6 text-body">
            The placement trusted-domains table is not registered
            in this database. Its entries cannot be retrieved.
            The company trust flags below remain available from
            active placement company relationships. A company
            primary domain is not automatically an approved
            recruiter email domain.
          </p>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Linked companies",
            String(data.summary.totalCompanies),
          ],
          [
            "Trusted companies",
            String(data.summary.trustedCompanies),
          ],
          [
            "Not trusted",
            String(data.summary.notTrustedCompanies),
          ],
          [
            "Explicit trusted domains",
            data.summary.trustedDomainCount === null
              ? "Unavailable"
              : String(data.summary.trustedDomainCount),
          ],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-surface p-4"
          >
            <p className="text-xs font-semibold text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-2xl font-bold tabular-nums text-foreground">
              {value}
            </p>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Company trust
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Trust is derived from the active company relationship
            belonging to this college, not from the global
            employer record.
          </p>
        </div>

        {data.companies.length === 0 ? (
          <p className="p-6 text-sm text-body">
            No active placement company relationships are
            available for this college.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[38rem] text-left text-sm">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th scope="col" className="px-4 py-3">
                    Company
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Trust status
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Company primary domain
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.companies.map((company) => (
                  <tr
                    key={company.relationshipId}
                    className="border-t border-border"
                  >
                    <td className="px-4 py-4">
                      <Link
                        href={`/tpo/companies/${encodeURIComponent(
                          company.companyId,
                        )}`}
                        className="font-semibold text-primary-text hover:underline"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        tone={
                          company.isTrusted
                            ? "success"
                            : "neutral"
                        }
                      >
                        {company.isTrusted
                          ? "Trusted"
                          : "Not trusted"}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-body">
                      {company.primaryDomain ?? "Not recorded"}
                      {company.primaryDomain ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Company metadata; not an allowlist grant
                        </p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-semibold text-foreground">
            Explicit trusted email domains
          </h2>
          <p className="mt-1 text-sm leading-6 text-body">
            Only domains stored in the placement-specific
            trusted-domains table appear here. College login
            domains are intentionally excluded.
          </p>
        </div>

        {!data.explicitDomainsAvailable ? (
          <p className="p-6 text-sm text-body">
            Explicit trusted-domain data is unavailable;
            the source table has not been registered.
          </p>
        ) : data.trustedDomains.length === 0 ? (
          <p className="p-6 text-sm text-body">
            No explicit trusted domains are recorded for
            this college.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.trustedDomains.map((entry) => (
              <li
                key={entry.domain}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
              >
                <span className="font-medium text-foreground">
                  {entry.domain}
                </span>
                <StatusBadge tone="success">
                  Explicitly trusted
                </StatusBadge>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs leading-5 text-muted-foreground">
        This view does not create, normalize, approve or remove
        trusted domains. It does not infer request-approval
        consequences from trust flags or email-domain metadata.
        Legacy trust-management actions and browser verification
        remain open.
      </p>
    </div>
  );
}
