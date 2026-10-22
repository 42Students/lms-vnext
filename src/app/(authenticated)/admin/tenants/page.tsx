import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { can } from "@/modules/permissions/policy";
import { isSuperAdmin } from "@/modules/identity/context";
import { ErrorState } from "@/components/ui/error-state";
import SuperAdminTenantSetup from "./setup/page";
import TenantDirectory from "./directory/page";

/** Preserve filtered directory deep links and keep the domain management
 * route discoverable from the consolidated tenant landing page.
 */
export default async function SuperAdminTenantLanding({searchParams}:{
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context) || !can(context,"admin-scope.select")) {
    return <ErrorState title="Tenant setup access denied" description="Your account cannot view platform tenant records." />;
  }
  const raw = await searchParams;
  const directoryRequest = Object.keys(raw).some(key =>
    ["q","status","organizationId","page"].includes(key)) ||
    raw.tab === "directory";
  return (
    <div className="min-w-0 space-y-4">
      {directoryRequest
        ? <TenantDirectory searchParams={Promise.resolve(raw)} />
        : <SuperAdminTenantSetup searchParams={Promise.resolve(raw)} />}
      <nav aria-label="Tenant management related pages">
        <Link href="/admin/domains" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current">
          Manage domains
        </Link>
      </nav>
    </div>
  );
}
