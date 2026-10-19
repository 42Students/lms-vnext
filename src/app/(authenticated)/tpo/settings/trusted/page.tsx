import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoTrustToggle } from "@/components/placements/tpo-trust-toggle";
import {TpoTrustedDomainEditor} from "@/components/tpo/tpo-trusted-domain-editor";
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
        description="Review and confirm changes to college-specific employer trust flags. Trusted email domains are explicit college-scoped entries, separate from company trust flags."
        actions={
          <Link
            href="/tpo/settings/team"
            className="inline-flex min-h-11 sm:min-h-9 items-center rounded-[var(--lms-control-radius,9px)] border border-border bg-surface px-4 text-sm font-semibold text-body hover:text-link"
          >
            Placement Team
          </Link>
        }
      />

      {!data.explicitDomainsAvailable ? (
        <section
          role="status"
          className="border-t border-border pt-5"
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
            className="border-b border-border px-1 py-4"
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

      <section className="border-t border-border">
        <div className="border-b border-border py-4">
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
          <p className="py-4 text-sm text-body">
            No active placement company relationships are
            available for this college.
          </p>
        ) : (
          <DataTable
            rows={data.companies}
            getRowKey={company=>company.relationshipId}
            caption="Company trust"
            empty={<p>No active placement company relationships are available for this college.</p>}
            columns={[
              {key:"company",header:"Company",mobilePriority:"primary",cell:company=>
                <Link href={"/tpo/companies/"+encodeURIComponent(company.companyId)}
                  className="font-semibold text-link underline">{company.name}</Link>},
              {key:"trust",header:"Trust status",mobilePriority:"secondary",cell:company=>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <StatusBadge tone={company.isTrusted?"success":"neutral"}>
                    {company.isTrusted?"Trusted":"Not trusted"}
                  </StatusBadge>
                  <TpoTrustToggle relationshipId={company.relationshipId}
                    companyName={company.name} isTrusted={company.isTrusted}/>
                </div>},
              {key:"domain",header:"Company primary domain",mobilePriority:"secondary",cell:company=>
                <div className="min-w-0 break-words text-body">
                  {company.primaryDomain??"Not recorded"}
                  {company.primaryDomain?<p className="mt-1 text-xs text-muted-foreground">
                    Company metadata; not an allowlist grant
                  </p>:null}
                </div>},
            ]}
          />
        )}
      </section>

      {data.explicitDomainsAvailable?
        <TpoTrustedDomainEditor domains={data.trustedDomains.map(entry=>entry.domain)}/>:
        <p role="status" className="border-t border-border pt-4 text-sm">
         Trusted-domain editor is unavailable until the table is registered.
        </p>}

      <p className="text-xs leading-5 text-muted-foreground">
        Explicit trusted domains are normalized and recorded by the server. Only future recruiter access decisions can use these values; prior grants are not silently expanded.
      </p>
    </div>
  );
}
