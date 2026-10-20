import Link from "next/link";
import { SuperAdminPeopleCsvControl } from "@/components/admin/super-admin-people-csv-control";
import { superAdminPeopleExportHref } from "@/modules/people/admin-users-export-model";
import { getCurrentRequestContext } from "@/auth/request-context";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Tabs } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/ui/status-badge";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES, USER_PLATFORM_STATUSES } from "@/modules/identity/constants";
import { adminUsersQuerySchema, adminUsersHref, adminPeopleSearchState } from "@/modules/people/admin-user-directory-model";
import { listSuperAdminUsers } from "@/modules/people/admin-user-directory-service";
export default async function SuperAdminUserDirectory({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))redirect("/dashboard");
 const raw=await searchParams;
 const validKeys=new Set(["tab","q","role","membershipStatus","platformStatus","page"]);
 const validShape=Object.keys(raw).every(key=>validKeys.has(key))&&
  Object.values(raw).every(value=>!Array.isArray(value));
 const query=adminUsersQuerySchema.safeParse(validShape?{
  tab:raw.tab,q:raw.q,role:raw.role,membershipStatus:raw.membershipStatus,
  platformStatus:raw.platformStatus,page:raw.page,
 }:{invalid:true});
 if(!query.success) return <div className="space-y-4"><PageHeader eyebrow="Super Admin" title="People Directory"/>
  <ErrorState title="Invalid directory filters" description="Review search, roles, statuses, or page."
   action={<Link href="/admin/people/directory" className="font-semibold text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Clear filters</Link>}/>
 </div>;
 const loaded=await listSuperAdminUsers(context,query.data)
  .then(value=>({ok:true as const,value}))
  .catch(error=>({ok:false as const,denied:error instanceof AuthorizationError}));
 if(!loaded.ok) return <div className="min-w-0 space-y-4">
  <PageHeader eyebrow="Super Admin" title="People Directory"/>
  <ErrorState
   title={loaded.denied?"Directory access denied":"People Directory unavailable"}
   description={loaded.denied
    ?"Your account can no longer view these membership records."
    :"These membership records could not be loaded. Your filters were preserved."}
   action={<Link href={loaded.denied?"/dashboard":adminUsersHref(query.data)}
    className="font-semibold text-primary-text underline">
    {loaded.denied?"Back to dashboard":"Retry loading users"}
   </Link>}/>
 </div>;
 const data=loaded.value;
 const tabs=[{id:"ALL",label:"All contacts"},{id:"FACULTY",label:"Faculty"},{id:"STUDENT",label:"Students"}] as const;
 const roleOptions = ["ALL", ...MEMBERSHIP_ROLES] as const;
 const membershipOptions = ["ALL", ...MEMBERSHIP_STATUSES] as const;
 const platformOptions = ["ALL", ...USER_PLATFORM_STATUSES] as const;
 const tabForm=adminPeopleSearchState(data.query);
 return <div className="min-w-0 space-y-5">
  <PageHeader eyebrow="Super Admin · People" title="People Directory"
   description="Read-only membership directory within the active organization/college scope. Global mode lists membership records, not unrelated personal data."
   actions={<SuperAdminPeopleCsvControl href={superAdminPeopleExportHref(data.query)} />}/>
  {!context.adminScope?.organizationId && !context.adminScope?.collegeId ?
   <Link href="/admin/people/unassigned" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Users without college memberships →</Link> : null}
  <Tabs ariaLabel="People directory tabs" value={data.query.tab} renderPanel={false}
   items={tabs.map(tab=>({value:tab.id,label:tab.label,
    href:adminUsersHref({...data.query,tab:tab.id,role:"ALL",page:1})}))}/>
  <nav aria-label="Related people views" className="flex flex-wrap items-center gap-3 border-b border-[var(--lms-canvas-border)] pb-3 text-sm">
   <Link href="/admin/students" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Student accounts</Link>
   <Link href="/admin/faculty" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Faculty accounts</Link>
   <Link href="/admin/faculty-assignment" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Teaching assignments</Link>
  </nav>
  <p className="text-xs text-muted-foreground">
   {data.query.tab==="STUDENT"?"Learner memberships":data.query.tab==="FACULTY"?"Faculty memberships":"All permitted memberships"} ·
   {" "}
   {data.contactVisible?"Contact shown within the explicitly selected college.":"Email and phone are masked outside a selected college."}
  </p>
  <form method="get" className="grid gap-3 md:grid-cols-2 min-[1366px]:grid-cols-5">
   <Input type="hidden" name="tab" value={tabForm.hiddenTab} />
   <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Name or college
    <Input type="search" name="q" maxLength={100} defaultValue={query.data.q}
     className="min-h-11 w-full md:min-h-9"/>
   </label>
   <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Role
    <Select name="role" disabled={!tabForm.showExplicitRoleFilter} defaultValue={query.data.role} className="min-h-11 w-full md:min-h-9">
     {roleOptions.map(x=><option key={x} value={x}>{x}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Membership
    <Select name="membershipStatus" defaultValue={query.data.membershipStatus}
     className="min-h-11 w-full md:min-h-9">
     {membershipOptions.map(x=><option key={x} value={x}>{x}</option>)}
    </Select>
   </label>
   <label className="grid gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Platform
    <Select name="platformStatus" defaultValue={query.data.platformStatus}
     className="min-h-11 w-full md:min-h-9">
     {platformOptions.map(x=><option key={x} value={x}>{x}</option>)}
    </Select>
   </label>
   <Button type="submit" className="min-h-11 self-end md:min-h-9">Filter</Button>
  </form>
  <p className="text-xs text-muted-foreground">{data.total} matching memberships · page {data.query.page} of {data.totalPages} · 30 per page</p>
  {data.items.length?<div className="grid gap-3 md:grid-cols-2">
   {data.items.map(row=><article key={row.membershipId} className="min-w-0 border-b border-border py-4">
    <h2 className="m-0 break-words font-semibold text-[var(--lms-heading)]">{row.displayName||"Unnamed user"}</h2>
    <p className="mt-1 text-sm text-body">{row.collegeName}</p>
    <p className="mt-1 break-all text-xs text-muted-foreground">
     {data.contactVisible?(row.email??"No email recorded"):"Email masked"} ·
     {" "}{data.contactVisible?(row.phoneE164??"No phone recorded"):"Phone masked"}
    </p>
    <div className="mt-3 flex flex-wrap gap-2">
     <StatusBadge tone={row.platformStatus==="ACTIVE"?"success":"neutral"}>Platform {row.platformStatus}</StatusBadge>
     <StatusBadge tone={row.membershipStatus==="ACTIVE"?"success":"neutral"}>Membership {row.membershipStatus}</StatusBadge>
     {row.roles.map(role=><StatusBadge key={role}>{role}</StatusBadge>)}
    </div>
    <Link href={`/admin/people/directory/${encodeURIComponent(row.membershipId)}`}
     className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
     View membership →
    </Link>
    <p className="mt-2 text-xs text-muted-foreground">Membership updated {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(row.updatedAt)} IST</p>
   </article>)}
  </div>:<EmptyState title="No matching users" description="No memberships match these filters within the current safety scope."/>}
  <Pagination label="Users pages" page={data.query.page} pageCount={data.totalPages}
    hrefForPage={page=>adminUsersHref({...data.query,page})}/>
  <Link href="/admin/people" className="inline-flex min-h-11 items-center font-semibold text-primary-text md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">← Membership management</Link>
 </div>;
}
