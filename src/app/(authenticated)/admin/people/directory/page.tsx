import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES, USER_PLATFORM_STATUSES } from "@/modules/identity/constants";
import { adminUsersQuerySchema, adminUsersHref } from "@/modules/people/admin-user-directory-model";
import { listSuperAdminUsers } from "@/modules/people/admin-user-directory-service";
export default async function SuperAdminUserDirectory({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const raw=await searchParams;
 const query=adminUsersQuerySchema.safeParse({tab:raw.tab,q:raw.q,role:raw.role,
  membershipStatus:raw.membershipStatus,platformStatus:raw.platformStatus,page:raw.page});
 if(!query.success) return <div className="space-y-4"><PageHeader eyebrow="Super Admin" title="Users & Roles"/>
  <ErrorState title="Invalid directory filters" description="Review search, roles, statuses, or page."
   action={<Link href="/admin/people/directory" className="font-semibold text-primary-text">Clear filters</Link>}/>
 </div>;
 const data=await listSuperAdminUsers(await getCurrentRequestContext(),query.data);
 const tabs=[{id:"ALL",label:"All"},{id:"FACULTY",label:"Faculty"},{id:"STUDENT",label:"Students"}] as const;
 const roleOptions = ["ALL", ...MEMBERSHIP_ROLES] as const;
 const membershipOptions = ["ALL", ...MEMBERSHIP_STATUSES] as const;
 const platformOptions = ["ALL", ...USER_PLATFORM_STATUSES] as const;
 return <div className="space-y-5">
  <PageHeader eyebrow="Super Admin · People" title="Users & Roles"
   description="Read-only membership directory within the active organization/college scope. Global mode lists membership records, not unrelated personal data."/>
  <nav aria-label="People directory tabs" className="flex flex-wrap gap-2">
   {tabs.map(tab=><Link key={tab.id} href={adminUsersHref({...data.query,tab:tab.id,role:"ALL",page:1})}
    aria-current={data.query.tab===tab.id?"page":undefined}
    className={"inline-flex min-h-11 items-center rounded-md border px-4 font-semibold "+
     (data.query.tab===tab.id?"border-primary bg-primary-subtle text-primary-text":"border-border text-body")}>{tab.label}</Link>)}
  </nav>
  <p className="text-xs text-muted-foreground">
   {data.contactVisible?"Contact shown within the explicitly selected college.":"Email and phone are masked outside a selected college."}
  </p>
  <form method="get" className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 xl:grid-cols-5">
   <label className="grid gap-1 text-sm font-semibold text-body">Name or college
    <input type="search" name="q" maxLength={100} defaultValue={query.data.q}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Role
    <select name="role" disabled={query.data.tab!=="ALL"} defaultValue={query.data.role} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     {roleOptions.map(x=><option key={x} value={x}>{x}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Membership
    <select name="membershipStatus" defaultValue={query.data.membershipStatus}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     {membershipOptions.map(x=><option key={x} value={x}>{x}</option>)}
    </select>
   </label>
   <label className="grid gap-1 text-sm font-semibold text-body">Platform
    <select name="platformStatus" defaultValue={query.data.platformStatus}
     className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
     {platformOptions.map(x=><option key={x} value={x}>{x}</option>)}
    </select>
   </label>
   <button type="submit" className="min-h-11 self-end rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
  </form>
  <p className="text-xs text-muted-foreground">{data.total} matching memberships · page {data.query.page} of {data.totalPages} · 30 per page</p>
  {data.items.length?<div className="grid gap-3 md:grid-cols-2">
   {data.items.map(row=><article key={row.membershipId} className="min-w-0 rounded-xl border border-border bg-surface p-4">
    <h2 className="m-0 break-words font-semibold text-foreground">{row.displayName||"Unnamed user"}</h2>
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
    <p className="mt-2 text-xs text-muted-foreground">Membership updated {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium",timeZone:"Asia/Kolkata"}).format(row.updatedAt)} IST</p>
   </article>)}
  </div>:<EmptyState title="No matching users" description="No memberships match these filters within the current safety scope."/>}
  <nav aria-label="Users pages" className="flex flex-wrap gap-3 text-sm">
   {data.query.page>1?<Link href={adminUsersHref({...data.query,page:data.query.page-1})} className="font-semibold text-primary-text">Previous</Link>:null}
   {data.query.page<data.totalPages?<Link href={adminUsersHref({...data.query,page:data.query.page+1})} className="font-semibold text-primary-text">Next</Link>:null}
  </nav>
  <Link href="/admin/people" className="inline-flex min-h-10 items-center font-semibold text-primary-text">← Membership management</Link>
 </div>;
}
