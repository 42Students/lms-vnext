import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { adminUnassignedUsersHref, adminUnassignedUsersQuerySchema, unassignedIdentityScopeAllowed } from "@/modules/people/admin-unassigned-user-model";
import { listSuperAdminUnassignedUsers } from "@/modules/people/admin-unassigned-user-service";
export default async function UnassignedIdentityDirectory({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  if (!unassignedIdentityScopeAllowed(context.adminScope)) return <div className="space-y-4">
    <PageHeader eyebrow="Super Admin" title="Users without college memberships" />
    <EmptyState title="Clear the admin scope" description="These users have no college membership. Clear the organization and college selection in the header to inspect global identities." />
    <Link href="/admin/people/directory" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">← Users & Roles</Link>
  </div>;
  const raw = await searchParams;
  const parsed = adminUnassignedUsersQuerySchema.safeParse({ q: raw.q, platformStatus: raw.platformStatus, role: raw.role, page: raw.page });
  if (!parsed.success) return <ErrorState title="Invalid user filters" description="Review search, status, role and page."
    action={<Link href="/admin/people/unassigned">Clear filters</Link>} />;
  const data = await listSuperAdminUnassignedUsers(context, parsed.data);
  const statuses = ["ALL", "ACTIVE", "DISABLED"] as const;
  const roles = ["ALL", "SUPER_ADMIN", "NONE"] as const;
  return <div className="min-w-0 space-y-5">
    <PageHeader eyebrow="Super Admin · Global identities" title="Users without college memberships"
      description="Read-only identities with no college membership. Users with active, suspended or ended memberships are excluded. Personal contact and session information are excluded." />
    <Link href="/admin/people/directory" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-teal-deep)]">← Users & Roles</Link>
    <form method="get" className="grid min-w-0 grid-cols-1 gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-4">
      <label className="grid gap-1 text-sm font-semibold text-body">Name<Input type="search" name="q" maxLength={100}
        defaultValue={data.query.q} className="min-w-0 text-base" /></label>
      <label className="grid gap-1 text-sm font-semibold text-body">Platform status<Select name="platformStatus" defaultValue={data.query.platformStatus}
        className="min-w-0 text-base">{statuses.map(status => <option key={status}>{status}</option>)}</Select></label>
      <label className="grid gap-1 text-sm font-semibold text-body">System role<Select name="role" defaultValue={data.query.role}
        className="min-w-0 text-base">{roles.map(role => <option key={role}>{role}</option>)}</Select></label>
      <Button type="submit" variant="primary" className="self-end">Filter</Button>
    </form>
    <p className="text-xs text-muted-foreground">{data.total} matching users · page {data.page} of {data.totalPages} · 30 per page</p>
    {data.items.length ? <div className="grid gap-3 md:grid-cols-2">{data.items.map(row => <article key={row.id}
      className="min-w-0 rounded-xl border border-border bg-surface p-4">
      <h2 className="break-words text-base font-semibold text-foreground">{row.displayName ?? "Unnamed user"}</h2>
      <div className="flex flex-wrap gap-2"><StatusBadge tone={row.platformStatus === "ACTIVE" ? "success" : "neutral"}>{row.platformStatus}</StatusBadge>
        {row.roles.length ? row.roles.map(role => <StatusBadge key={role}>{role}</StatusBadge>) : <StatusBadge>No system role</StatusBadge>}</div>
      <p className="mt-3 text-xs text-muted-foreground">Created {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(row.createdAt)} IST</p>
      <p className="text-xs text-muted-foreground">Updated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(row.updatedAt)} IST</p>
    </article>)}</div> : <EmptyState title="No matching users" description="No users without college memberships match these filters." />}
    <Pagination page={data.page} pageCount={data.totalPages}
      hrefForPage={page=>adminUnassignedUsersHref({...data.query,page})} label="Unassigned user pages"/>
  </div>;
}
