import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import {isSuperAdmin} from "@/modules/identity/context";
import {
  TenantDomainManager,
  type TenantDomainClientRow,
} from "@/components/admin/tenant-domain-manager";
import { PageHeader } from "@/components/ui/page-header";
import { Alert } from "@/components/ui/alert";
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

  if(!isSuperAdmin(context))return <section className="min-w-0 space-y-3">
    <PageHeader title="Tenant domains" description="Tenant domains and sign-in host changes are managed by a Super Admin."/>
    <Alert tone="info">Ask a Super Admin to connect or verify a college hostname.</Alert>
   </section>;

  const domains = await listTenantDomainsWithRuntime(
    context,
    membership.collegeId,
  );

  return (
    <div className="min-w-0 overflow-x-clip space-y-6">
      <PageHeader
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
