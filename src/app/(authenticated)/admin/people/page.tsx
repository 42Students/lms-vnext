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
        <p className="mt-1 break-all text-xs text-muted-foreground">
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
      <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
        <PageHeader
          title="People"
          description="People administration requires a college safety scope."
        />
        <EmptyState
          title="Select a college to continue"
          description="Choose a college in the header above to see its people directory."
        />
        <Link href="/admin/people/directory"
          className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-primary-text hover:border-[var(--lms-primary)] hover:bg-[var(--lms-primary)] hover:text-white active:border-[var(--lms-primary-hover)] active:bg-[var(--lms-primary-hover)] active:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary)]">
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
    <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
      <PageHeader
        title="People"
        description="Canonical people and memberships inside the selected college safety scope."
        actions={<div className="flex min-w-0 flex-col-reverse items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-start">
          <SuperAdminPeopleCsvControl href={superAdminPeopleExportHref({q,role,membershipStatus:status})} />
          <PersonOnboardDialog collegeId={collegeId} />
        </div>}
      />
      <form method="get" role="search" aria-label="Search people" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
       <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,12rem)_auto]">
        <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search contacts
         <Input type="search" name="q" defaultValue={q} maxLength={100} placeholder="Search contacts..." className="min-h-11 w-full md:min-h-9"/>
        </label>
        <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role
         <Select name="role" defaultValue={role} className="min-h-11 w-full md:min-h-9">
          {["ALL","LEARNER","FACULTY","MENTOR","TPO","HR","COLLEGE_ADMIN"].map(s=><option key={s} value={s}>{s}</option>)}
         </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Search</Button>
       </div>
       <details className="min-w-0" open={status!=="ALL" || pageSize!==10}>
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
        <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2">
         <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select name="status" defaultValue={status} className="min-h-11 w-full md:min-h-9">
           {["ALL","ACTIVE","SUSPENDED","ENDED"].map(s=><option key={s} value={s}>{s}</option>)}
          </Select>
         </label>
         <PageSizeSelect name="pageSize" defaultValue={pageSize} options={[10,20,50]} />
        </div>
       </details>
       <Link href="/admin/people" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Clear filters</Link>
      </form>
      <p role="status" aria-live="polite" className="text-sm text-body">{people.pagination.total} matching contacts</p>
      <Link href="/admin/people/directory" className="inline-flex min-h-11 w-full items-center justify-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] sm:w-auto md:min-h-9">Browse platform users & roles →</Link>
      <DataTable empty={<EmptyState title="No matching contacts" description="No college memberships match the current filters." />}
        columns={columns}
        rows={people.items}
        getRowKey={(person) => person.membership.id}
      />
      <div className="flex min-w-0 flex-col gap-[var(--lms-space-3)] border-t border-border pt-[var(--lms-space-3)] md:flex-row md:items-center md:justify-between">
       <p className="text-sm text-muted-foreground">Page {pagination.page} of {pagination.pages} · {pagination.total} results</p>
       <Pagination label="People pages" page={pagination.page} pageCount={pagination.pages} hrefForPage={href}/>
      </div>
    </div>
  );
}
