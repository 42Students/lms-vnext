import Link from "next/link";
import SuperAdminTenantSetup from "./setup/page";
import TenantDirectory from "./directory/page";

/** Preserve filtered directory deep links and keep the domain management
 * route discoverable from the consolidated tenant landing page.
 */
export default async function SuperAdminTenantLanding({searchParams}:{
  searchParams: Promise<Record<string,string|string[]|undefined>>;
}) {
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
