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
import { DataTable } from "@/components/ui/data-table";
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
 if(!query.success) return <div className="space-y-4"><PageHeader title="People Directory"/>
  <ErrorState title="Invalid directory filters" description="Review search, roles, statuses, or page."
   action={<Link href="/admin/people/directory" className="font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] hover:underline w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4 min-h-11 md:min-h-9">Clear filters</Link>}/>
 </div>;
 const loaded=await listSuperAdminUsers(context,query.data)
  .then(value=>({ok:true as const,value}))
  .catch(error=>({ok:false as const,denied:error instanceof AuthorizationError}));
 if(!loaded.ok) return <div className="min-w-0 space-y-4">
  <PageHeader title="People Directory"/>
  <ErrorState
   title={loaded.denied?"Directory access denied":"Couldn\'t load contacts"}
   description={loaded.denied
    ?"Your account can no longer view these membership records."
    : "Something went wrong on our end. Please try again. Your filters were preserved."}
   action={<Link href={loaded.denied?"/dashboard":adminUsersHref(query.data)}
    className="font-[650] text-primary-text underline hover:text-[var(--lms-primary-text)] underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4 min-h-11 md:min-h-9">
    {loaded.denied?"Back to dashboard":"Retry loading users"}
   </Link>}/>
 </div>;
 const data=loaded.value;
 const tabs=[{id:"ALL",label:"All contacts"},{id:"FACULTY",label:"Faculty"},{id:"STUDENT",label:"Students"}] as const;
 const roleOptions = ["ALL", ...MEMBERSHIP_ROLES] as const;
 const membershipOptions = ["ALL", ...MEMBERSHIP_STATUSES] as const;
 const platformOptions = ["ALL", ...USER_PLATFORM_STATUSES] as const;
 const tabForm=adminPeopleSearchState(data.query);
 return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  <PageHeader title="People Directory"
   description="Read-only membership directory within the active organization/college scope. Global mode lists membership records, not unrelated personal data."
   actions={<div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-start">
    <Link href="/admin/people" className="inline-flex min-h-11 items-center justify-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)]">← Membership management</Link>
    <SuperAdminPeopleCsvControl href={superAdminPeopleExportHref(data.query)} />
   </div>}/>
  <Tabs ariaLabel="People directory tabs" value={data.query.tab} renderPanel={false}
   items={tabs.map(tab=>({value:tab.id,label:tab.label,
    href:adminUsersHref({...data.query,tab:tab.id,role:"ALL",page:1})}))}/>
  <details className="min-w-0 border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)]">
   <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Related people views</summary>
     {!context.adminScope?.organizationId && !context.adminScope?.collegeId ?
   <Link href="/admin/people/unassigned" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)]">Users without college memberships →</Link> : null}
  <nav aria-label="Related people views" className="flex min-w-0 flex-col items-start gap-[var(--lms-space-2)] pt-[var(--lms-space-2)] text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-[var(--lms-space-4)]">
   <Link href="/admin/students" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] underline-offset-4">Student accounts</Link>
   <Link href="/admin/faculty" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] underline-offset-4">Faculty accounts</Link>
   <Link href="/admin/faculty-assignment" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] underline-offset-4">Teaching assignments</Link>
  </nav>

  </details>
  <p className="text-xs text-muted-foreground">
   {data.query.tab==="STUDENT"?"Learner memberships":data.query.tab==="FACULTY"?"Faculty memberships":"All permitted memberships"} ·
   {" "}
   {data.contactVisible?"Contact shown within the explicitly selected college.":"Email and phone are masked outside a selected college."}
  </p>
  <form method="get" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
   <Input type="hidden" name="tab" value={tabForm.hiddenTab} />
   <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Name or college
     <Input type="search" name="q" maxLength={100} defaultValue={query.data.q} className="min-h-11 w-full md:min-h-9"/>
    </label>
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Role
     <Select name="role" disabled={!tabForm.showExplicitRoleFilter} defaultValue={query.data.role} className="min-h-11 w-full md:min-h-9">
      {roleOptions.map(x=><option key={x} value={x}>{x}</option>)}
     </Select>
    </label>
    <Button type="submit" className="min-h-11 w-full sm:col-span-2 md:col-span-1 md:min-h-9 md:w-auto">Filter</Button>
   </div>
   <details className="min-w-0" open={query.data.membershipStatus!=="ALL" || query.data.platformStatus!=="ALL"}>
    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Filters</summary>
    <div className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] pt-[var(--lms-space-2)] sm:grid-cols-2">
     <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Membership
      <Select name="membershipStatus" defaultValue={query.data.membershipStatus} className="min-h-11 w-full md:min-h-9">
       {membershipOptions.map(x=><option key={x} value={x}>{x}</option>)}
      </Select>
     </label>
     <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Platform
      <Select name="platformStatus" defaultValue={query.data.platformStatus} className="min-h-11 w-full md:min-h-9">
       {platformOptions.map(x=><option key={x} value={x}>{x}</option>)}
      </Select>
     </label>
    </div>
   </details>
   <Link href="/admin/people/directory" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">Clear filters</Link>
  </form>
  <p className="text-xs text-muted-foreground">{data.total.toLocaleString("en-IN")} matching memberships · page {data.query.page} of {data.totalPages} · 30 per page</p>
  {data.items.length ? <DataTable<(typeof data.items)[number]>
   caption="People directory memberships"
   rows={data.items}
   getRowKey={row=>row.membershipId}
   empty={<EmptyState title="No matching users" description="No memberships match these filters within the current safety scope."/>}
   columns={[
    {key:"name",header:"Person",mobilePriority:"primary",cell:row=>
     <div className="min-w-0">
      <p className="break-words font-semibold text-[var(--lms-heading)]">{row.displayName||"Unnamed user"}</p>
      <p className="mt-1 break-all text-xs text-muted-foreground">
       {data.contactVisible?(row.email??"No email recorded"):"Email masked"} ·
       {" "}{data.contactVisible?(row.phoneE164??"No phone recorded"):"Phone masked"}
      </p>
     </div>},
    {key:"college",header:"College",mobilePriority:"secondary",cell:row=><span className="break-words">{row.collegeName}</span>},
    {key:"platform",header:"Platform",mobilePriority:"secondary",cell:row=>
     <StatusBadge tone={row.platformStatus==="ACTIVE"?"success":"neutral"}>{row.platformStatus}</StatusBadge>},
    {key:"membership",header:"Membership",mobilePriority:"secondary",cell:row=>
     <StatusBadge tone={row.membershipStatus==="ACTIVE"?"success":"neutral"}>{row.membershipStatus}</StatusBadge>},
    {key:"roles",header:"Roles",mobilePriority:"secondary",cell:row=>
     <div className="flex flex-wrap gap-2">{row.roles.map(role=><StatusBadge key={role}>{role}</StatusBadge>)}</div>},
    {key:"updated",header:"Updated",mobilePriority:"secondary",cell:row=>
     <span className="whitespace-nowrap text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(row.updatedAt)} IST</span>},
    {key:"action",header:"Actions",mobilePriority:"action",cell:row=>
     <Link href={`/admin/people/directory/${encodeURIComponent(row.membershipId)}`}
      className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">View membership →</Link>},
   ]}/>
   :<EmptyState title="No matching users" description="No memberships match these filters within the current safety scope."/>}
  <div className="min-w-0 border-t border-border pt-[var(--lms-space-3)]"><Pagination label="Users pages" page={data.query.page} pageCount={data.totalPages}
    hrefForPage={page=>adminUsersHref({...data.query,page})}/></div>

 </div>;
}
