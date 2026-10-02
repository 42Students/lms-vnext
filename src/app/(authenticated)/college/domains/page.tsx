import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {
  TenantDomainManager,
  type TenantDomainClientRow,
} from "@/components/admin/tenant-domain-manager";
import { PageHeader } from "@/components/ui/page-header";
import { listTenantDomainsWithRuntime } from "@/modules/tenant-domains/runtime";

function serializeDomains(
  domains: Awaited<ReturnType<typeof listTenantDomainsWithRuntime>>,
): TenantDomainClientRow[] {
  return domains.map((domain) => ({
    id: domain.id,
    host: domain.host,
    isPrimary: domain.isPrimary,
    isVerified: domain.isVerified,
    verificationToken: domain.verificationToken,
    verifiedAt: domain.verifiedAt?.toISOString() ?? null,
    lastCheckedAt: domain.lastCheckedAt?.toISOString() ?? null,
    lastCheckResult: domain.lastCheckResult,
  }));
}

export default async function CollegeDomainsPage() {
  const context = await getCurrentRequestContext();
  const membership = context.membership;

  if (!membership) {
    redirect("/dashboard");
  }

  const domains = await listTenantDomainsWithRuntime(
    context,
    membership.collegeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin"
        title="Tenant domains"
        description="Connect and verify college hostnames without changing the canonical tenant boundary."
      />
      <TenantDomainManager
        collegeId={membership.collegeId}
        domains={serializeDomains(domains)}
      />
    </div>
  );
}
