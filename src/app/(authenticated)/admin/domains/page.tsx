import { getCurrentRequestContext } from "@/auth/request-context";
import {
  TenantDomainManager,
  type TenantDomainClientRow,
} from "@/components/admin/tenant-domain-manager";
import { EmptyState } from "@/components/ui/empty-state";
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

export default async function SuperAdminDomainsPage() {
  const context = await getCurrentRequestContext();
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="Tenant domains"
          description="Domain ownership and verification are managed inside a selected college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Choose a college in the Super Admin scope selector before viewing or changing tenant domains."
        />
      </div>
    );
  }

  const domains = await listTenantDomainsWithRuntime(
    context,
    collegeId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="Tenant domains"
        description="Manage verified hostnames for the selected college. Host ownership remains server-authorized."
      />
      <TenantDomainManager
        collegeId={collegeId}
        domains={serializeDomains(domains)}
      />
    </div>
  );
}
