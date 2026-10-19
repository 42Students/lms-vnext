import Link from "next/link";
import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PersonMembershipActions } from "@/components/admin/person-membership-actions";
import { PersonOnboardDialog } from "@/components/admin/person-onboard-dialog";
import { parsePeoplePage,parsePeoplePageSize, peoplePageState } from "@/modules/admin-ui/people-pagination";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  listCollegePeopleWithRuntime,
} from "@/modules/people/runtime";
import type { PersonMembershipView } from "@/modules/people/service";

const columns: DataTableColumn<PersonMembershipView>[] = [
  {
    key: "person",
    header: "Person",
    mobilePriority: "primary",
    cell: (person) => (
      <div>
        <p className="m-0 font-semibold text-foreground">
          {person.user.displayName || "Unnamed person"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {person.user.email ||
            person.user.phoneE164 ||
            "No contact detail"}
        </p>
      </div>
    ),
  },
  {
    key: "roles",
    header: "Roles",
    cell: (person) => person.membership.roles.length ? (
      <div className="flex min-w-0 flex-wrap gap-[var(--lms-space-1)]">
        {person.membership.roles.map(role => <Badge key={role} tone="neutral">{role}</Badge>)}
      </div>
    ) : "—",
  },
  {
    key: "status",
    header: "Status",
    cell: (person) => (
      <StatusBadge
        tone={
          person.membership.status === "ACTIVE"
            ? "success"
            : person.membership.status === "SUSPENDED"
              ? "warning"
              : "neutral"
        }
      >
        {person.membership.status}
      </StatusBadge>
    ),
  },
  {
    key: "actions",
    header: <span className="sr-only">Actions</span>,
    mobilePriority: "action",
    className: "text-right",
    cell: (person) => (
      <PersonMembershipActions
        membershipId={person.membership.id}
        collegeId={person.membership.collegeId}
        displayName={person.user.displayName || "Person"}
        roles={person.membership.roles}
        status={person.membership.status}
      />
    ),
  },
];

export default async function SuperAdminPeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string|string[];q?:string|string[];role?:string|string[];status?:string|string[];pageSize?:string|string[] }>;
}) {
  const { page: pageParam,q:rawQ,role:rawRole,status:rawStatus,pageSize:rawPageSize } = await searchParams;
  // Next.js may supply repeated query keys as arrays; normalize before string operations.
  const one=(value:string|string[]|undefined)=>Array.isArray(value)?value[0]:value;
  const normalizedRole=one(rawRole),normalizedStatus=one(rawStatus);
  const q=(one(rawQ)??"").trim().slice(0,100);
  const role=["ALL","LEARNER","FACULTY","MENTOR","TPO","HR","COLLEGE_ADMIN"].includes(normalizedRole??"ALL")?normalizedRole??"ALL":"ALL";
  const status=["ALL","ACTIVE","SUSPENDED","ENDED"].includes(normalizedStatus??"ALL")?normalizedStatus??"ALL":"ALL";
  const pageSize=parsePeoplePageSize(rawPageSize);
  const base=new URLSearchParams({...q?{q}:{},...role!=="ALL"?{role}:{},...status!=="ALL"?{status}:{},...(pageSize!==10?{pageSize:String(pageSize)}:{})});
  const href=(target:number)=>"/admin/people?"+new URLSearchParams({...Object.fromEntries(base),...(target>1?{page:String(target)}:{})}).toString();
  const requestedPage = parsePeoplePage(one(pageParam));
  const context = await getCurrentRequestContext();
  if (!isSuperAdmin(context)) redirect("/dashboard");
  const collegeId = context.adminScope?.collegeId ?? null;

  if (!collegeId) {
    return (
      <div className="min-w-0 space-y-6">
        <PageHeader
          eyebrow="Super Admin"
          title="People"
          description="People administration requires a college safety scope."
        />
        <EmptyState
          title="Select a college scope"
          description="Use the Super Admin scope selector in the top bar to choose a college before viewing membership data."
        />
        <Link href="/admin/people/directory"
          className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
          Browse all permitted Users &amp; Roles without selecting a college →
        </Link>
      </div>
    );
  }

  const people = await listCollegePeopleWithRuntime(context, {
    collegeId,
    limit: pageSize,
    offset: (requestedPage - 1) * pageSize,
    q,role,status,
  });

  const pagination = peoplePageState(requestedPage, people.pagination.total,pageSize);
  if (requestedPage !== pagination.page) {
    redirect(href(pagination.page));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Super Admin"
        title="People"
        description="Canonical people and memberships inside the selected college safety scope."
        actions={<div className="flex flex-wrap items-center gap-[var(--lms-space-2)]">
          <SuperAdminPeopleCsvControl href={superAdminPeopleExportHref({q,role,membershipStatus:status})} />
          <PersonOnboardDialog collegeId={collegeId} />
        </div>}
      />
      <form method="get" className="grid min-w-0 gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] sm:grid-cols-2 xl:grid-cols-4">
       <label className="grid gap-1 text-sm font-semibold">Search contacts
        <Input name="q" defaultValue={q} maxLength={100} placeholder="Search contacts..." className="min-h-9 w-full"/>
       </label>
       <label className="grid gap-1 text-sm font-semibold">Role
        <Select name="role" defaultValue={role} className="min-h-9 w-full">
          {["ALL","LEARNER","FACULTY","MENTOR","TPO","HR","COLLEGE_ADMIN"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
       </label>
       <label className="grid gap-1 text-sm font-semibold">Status
        <Select name="status" defaultValue={status} className="min-h-9 w-full">
          {["ALL","ACTIVE","SUSPENDED","ENDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
       </label>
       <PageSizeSelect name="pageSize" defaultValue={pageSize} options={[10,20,50]} />
       <Button type="submit">Search</Button>
       <Link href="/admin/people" className="inline-flex min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>
      </form>
      <p role="status" aria-live="polite" className="text-sm text-body">{people.pagination.total} matching contacts</p>
      <Link href="/admin/people/directory" className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
        Browse platform users & roles →
      </Link>
      <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
        columns={columns}
        rows={people.items}
        getRowKey={(person) => person.membership.id}
      />
      <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages} · {pagination.total} results</p>
      <Pagination label="People pages" page={pagination.page} pageCount={pagination.pages} hrefForPage={href}/>
    </div>
  );
}
