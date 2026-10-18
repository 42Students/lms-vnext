import Link from "next/link";
import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
import { redirect } from "next/navigation";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PersonMembershipActions } from "@/components/admin/person-membership-actions";
import { PersonOnboardDialog } from "@/components/admin/person-onboard-dialog";
import { PeoplePagination } from "@/components/admin/people-pagination";
import { parsePeoplePage, peoplePageState, PEOPLE_PAGE_SIZE } from "@/modules/admin-ui/people-pagination";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
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
    cell: (person) =>
      person.membership.roles.join(", ") || "—",
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
  searchParams: Promise<{ page?: string;q?:string;role?:string;status?:string;pageSize?:string }>;
}) {
  const { page: pageParam,q:rawQ,role:rawRole,status:rawStatus,pageSize:rawPageSize } = await searchParams;
  const q=(rawQ??"").trim().slice(0,100);
  const role=["ALL","LEARNER","FACULTY","MENTOR","TPO","HR","COLLEGE_ADMIN"].includes(rawRole??"ALL")?rawRole??"ALL":"ALL";
  const status=["ALL","ACTIVE","SUSPENDED","ENDED"].includes(rawStatus??"ALL")?rawStatus??"ALL":"ALL";
  const pageSize=[10,20,50].includes(Number(rawPageSize))?Number(rawPageSize):10;
  const base=new URLSearchParams({...q?{q}:{},...role!=="ALL"?{role}:{},...status!=="ALL"?{status}:{},...(pageSize!==10?{pageSize:String(pageSize)}:{})});
  const href=(target:number)=>"/admin/people?"+new URLSearchParams({...Object.fromEntries(base),...(target>1?{page:String(target)}:{})}).toString();
  const requestedPage = parsePeoplePage(pageParam);
  const context = await getCurrentRequestContext();
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
          className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">
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
        actions={<PersonOnboardDialog collegeId={collegeId} />}
      />
      <SuperAdminPeopleCsvControl href={superAdminPeopleExportHref({q,role,membershipStatus:status})} />
      <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-4">
       <label className="grid gap-1 text-sm font-semibold">Search contacts
        <Input name="q" defaultValue={q} maxLength={100} placeholder="Search contacts..." className="min-h-11 rounded border border-border bg-background px-3"/>
       </label>
       <label className="grid gap-1 text-sm font-semibold">Role
        <Select name="role" defaultValue={role} className="min-h-11 rounded border border-border bg-background px-2">
          {["ALL","LEARNER","FACULTY","MENTOR","TPO","HR","COLLEGE_ADMIN"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
       </label>
       <label className="grid gap-1 text-sm font-semibold">Status
        <Select name="status" defaultValue={status} className="min-h-11 rounded border border-border bg-background px-2">
          {["ALL","ACTIVE","SUSPENDED","ENDED"].map(s=><option key={s} value={s}>{s}</option>)}
        </Select>
       </label>
       <label className="grid gap-1 text-sm font-semibold">Rows per page
        <Select name="pageSize" defaultValue={pageSize} className="min-h-11 rounded border border-border bg-background px-2">
          {[10,20,50].map(n=><option key={n} value={n}>{n}</option>)}
        </Select>
       </label>
       <Button type="submit">Search</Button>
       <Link href="/admin/people" className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-teal-deep)]">Clear filters</Link>
      </form>
      <p role="status" aria-live="polite" className="text-sm text-body">{people.pagination.total} matching contacts</p>
      <Link href="/admin/people/directory" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-[var(--lms-teal-deep)]">
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
