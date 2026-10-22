import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { adminUnassignedUsersHref, adminUnassignedUsersQuerySchema, unassignedIdentityScopeAllowed } from "@/modules/people/admin-unassigned-user-model";
import { listSuperAdminUnassignedUsers } from "@/modules/people/admin-unassigned-user-service";
export default async function UnassignedIdentityDirectory({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  if (!unassignedIdentityScopeAllowed(context.adminScope)) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Users without college memberships" />
    <EmptyState title="Clear the admin scope" description="These users have no college membership. Clear the organization and college selection in the header to inspect global identities." />
    <Link href="/admin/people/directory" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary)] underline-offset-4">← Users & Roles</Link>
  </div>;
  const raw = await searchParams;
  const validKeys=new Set(["q","platformStatus","role","page"]);
  const validShape=Object.keys(raw).every(key=>validKeys.has(key))&&
    Object.values(raw).every(value=>!Array.isArray(value));
  const parsed = adminUnassignedUsersQuerySchema.safeParse(validShape
    ?{q:raw["q"],platformStatus:raw["platformStatus"],role:raw["role"],page:raw["page"]}
    :{invalid:true});
  if (!parsed.success) return <div className="min-w-0 space-y-[var(--lms-space-4)]">
    <PageHeader title="Users without college memberships" />
    <ErrorState title="Invalid user filters" description="Review search, status, role and page."
    action={<Link href="/admin/people/unassigned" className="inline-flex min-h-11 md:min-h-9 items-center font-[650] text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  const loaded = await listSuperAdminUnassignedUsers(context, parsed.data)
    .then(value => ({ok:true as const,value}))
    .catch(error => ({ok:false as const,denied:error instanceof AuthorizationError}));
  if (!loaded.ok) return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Users without college memberships" />
    <ErrorState
      title={loaded.denied ? "Directory access denied" : "Unassigned users unavailable"}
      description={loaded.denied
        ? "Your account can no longer view global identities."
        : "These users could not be loaded. Your validated filters were preserved."}
      action={<Link href={loaded.denied ? "/dashboard" : adminUnassignedUsersHref(parsed.data)}
        className="inline-flex min-h-11 items-center font-[650] text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">
        {loaded.denied ? "Back to dashboard" : "Retry loading users"}
      </Link>}
    />
  </div>;
  const data = loaded.value;
  const statuses = ["ALL", "ACTIVE", "DISABLED"] as const;
  const roles = ["ALL", "SUPER_ADMIN", "NONE"] as const;
  const date = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });
  const columns: DataTableColumn<(typeof data.items)[number]>[] = [
    { key: "user", header: "User", mobilePriority: "primary",
      cell: row => <span className="font-semibold text-[var(--lms-heading)]">{row.displayName ?? "Unnamed user"}</span> },
    { key: "status", header: "Platform status", mobilePriority: "secondary",
      cell: row => <StatusBadge tone={row.platformStatus === "ACTIVE" ? "success" : "neutral"}>{row.platformStatus}</StatusBadge> },
    { key: "role", header: "System role", mobilePriority: "secondary",
      cell: row => <span className="flex flex-wrap gap-2">{row.roles.length ? row.roles.map(role => <StatusBadge key={role}>{role}</StatusBadge>) : <StatusBadge>No system role</StatusBadge>}</span> },
    { key: "created", header: "Created", mobilePriority: "secondary",
      cell: row => <time dateTime={row.createdAt.toISOString()}>{date.format(row.createdAt)} IST</time> },
    { key: "updated", header: "Updated", mobilePriority: "secondary",
      cell: row => <time dateTime={row.updatedAt.toISOString()}>{date.format(row.updatedAt)} IST</time> },
  ];
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Users without college memberships"
      description="Read-only identities with no college membership. Users with active, suspended or ended memberships are excluded. Personal contact and session information are excluded." actions={<Link href="/admin/people/directory" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)]">← Users & Roles</Link>} />

    <form method="get" className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_minmax(0,13rem)_auto]">
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name<Input type="search" name="q" maxLength={100}
        defaultValue={data.query.q} className="min-h-11 min-w-0 text-base md:min-h-9 md:text-sm" /></label>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Platform status<Select name="platformStatus" defaultValue={data.query.platformStatus}
        className="min-h-11 min-w-0 text-base md:min-h-9 md:text-sm">{statuses.map(status => <option key={status}>{status}</option>)}</Select></label>
      <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">System role<Select name="role" defaultValue={data.query.role}
        className="min-h-11 min-w-0 text-base md:min-h-9 md:text-sm">{roles.map(role => <option key={role}>{role}</option>)}</Select></label>
      <Button type="submit" variant="primary" className="min-h-11 w-full self-end sm:col-span-2 lg:col-span-1 lg:min-h-9 lg:w-auto">Filter</Button>
    </form>
    <p role="status" className="text-xs text-muted-foreground">{data.total.toLocaleString("en-IN")} matching users · page {data.page} of {data.totalPages} · 30 per page</p>
    <DataTable caption="Users without college memberships" columns={columns}
      rows={data.items} getRowKey={row=>row.id} mobileMode="scroll"
      empty={<EmptyState title="No matching users" description="No users without college memberships match these filters."/>}/>
    <div className="border-t border-border pt-[var(--lms-space-3)]"><Pagination page={data.page} pageCount={data.totalPages}
      hrefForPage={page=>adminUnassignedUsersHref({...data.query,page})} label="Unassigned user pages"/></div>
  </div>;
}
