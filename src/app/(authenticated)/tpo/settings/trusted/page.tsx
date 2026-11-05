import { Disclosure } from "@/components/ui/disclosure";
import { redirect } from "next/navigation";

import { getCurrentRequestContext } from "@/auth/request-context";
import { TpoSettingsNav } from "@/components/placements/tpo-settings-nav";
import { PageHeader } from "@/components/ui/page-header";
import { StatTile } from "@/components/ui/stat-tile";
import { Alert } from "@/components/ui/alert";
import { DataTable } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { hasMembershipRole } from "@/modules/identity/context";
import { TpoTrustToggle } from "@/components/placements/tpo-trust-toggle";
import {TpoTrustedDomainEditor} from "@/components/tpo/tpo-trusted-domain-editor";
import {
  getTpoTrustedCompanies,
} from "@/modules/placements/tpo-settings-people-service";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";

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
    <div className="min-w-0 space-y-6">
      <PageHeader
        title="Trusted Companies"
        description="Review and confirm changes to college-specific employer trust flags. Trusted email domains are explicit college-scoped entries, separate from company trust flags."
        actions={
          <ButtonLink variant="secondary"
            href="/tpo/settings/team"
          >
            Placement Team
          </ButtonLink>
        }
      />
      <TpoSettingsNav active="trusted" compact />

      {!data.explicitDomainsAvailable ? (
        <Alert tone="warning">
          <Heading level={2} size="base" className="leading-[26px] text-[var(--lms-heading)] md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px]">
            Trusted-domain allowlist unavailable
          </Heading>
          <p className="mt-2 text-sm leading-[22px] text-body">
            The placement trusted-domains table is not registered
            in this database. Its entries cannot be retrieved.
            The company trust flags below remain available from
            active placement company relationships. A company
            primary domain is not automatically an approved
            recruiter email domain.
          </p>
        </Alert>
      ) : null}

      <Disclosure title="Trusted company totals" className="min-w-0" contentClassName="pt-3">
      <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
          <StatTile key={label ?? ""} label={label ?? ""} value={value ?? ""} className="min-h-[104px]" />
        ))}
      </section>
      </Disclosure>

      <section className="border-t border-border">
        <div className="border-b border-border py-4">
          <Heading level={2} size="base" className="leading-[26px] text-[var(--lms-heading)] md:text-[18px] md:leading-7 lg:text-[20px] lg:leading-[30px]">
            Company trust
          </Heading>
          <p className="mt-1 text-sm leading-[22px] text-body">
            Trust is derived from the active company relationship
            belonging to this college, not from the global
            employer record.
          </p>
        </div>

        {data.companies.length === 0 ? (
          <p className="py-4 text-sm text-body leading-[22px]">
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
                <TextLink href={"/tpo/companies/"+encodeURIComponent(company.companyId)}>{company.name}</TextLink>},
              {key:"trust",header:"Trust status",mobilePriority:"secondary",cell:company=>
                <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <StatusBadge tone={company.isTrusted?"success":"neutral"}>
                    {company.isTrusted?"Trusted":"Not trusted"}
                  </StatusBadge>
                  <TpoTrustToggle relationshipId={company.relationshipId}
                    companyName={company.name} isTrusted={company.isTrusted}/>
                </div>},
              {key:"domain",header:"Company primary domain",mobilePriority:"secondary",cell:company=>
                <div className="min-w-0 break-words text-body">
                  {company.primaryDomain??"Not recorded"}
                  {company.primaryDomain?<p className="mt-1 text-xs text-muted-foreground leading-5">
                    Company metadata; not an allowlist grant
                  </p>:null}
                </div>},
            ]}
          />
        )}
      </section>

      {data.explicitDomainsAvailable?
        <TpoTrustedDomainEditor domains={data.trustedDomains.map(entry=>entry.domain)}/>:
        <Alert tone="warning">
         Trusted-domain editor is unavailable until the table is registered.
        </Alert>}

      <Disclosure title="Trusted domain policy notes" className="min-w-0" contentClassName="pt-2">
      <p className="text-xs leading-5 text-muted-foreground">
        Explicit trusted domains are normalized and recorded by the server. Only future recruiter access decisions can use these values; prior grants are not silently expanded.
      </p>
      </Disclosure>
    </div>
  );
}
