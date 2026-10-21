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
import { Alert } from "@/components/ui/alert";
import { listColleges } from "@/modules/colleges/service";
import { MEMBERSHIP_ROLES, MEMBERSHIP_STATUSES, USER_PLATFORM_STATUSES } from "@/modules/identity/constants";
import { adminUsersQuerySchema, adminUsersHref, adminPeopleSearchState } from "@/modules/people/admin-user-directory-model";
import { listSuperAdminUsers } from "@/modules/people/admin-user-directory-service";
export default async function SuperAdminUserDirectory({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}) {
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))redirect("/dashboard");
 const raw=await searchParams;
 const validKeys=new Set(["tab","view","q","role","membershipStatus","platformStatus","page","pageSize"]);
 const requestedPage=typeof raw.page==="string"&&/^[1-9][0-9]{0,4}$/.test(raw.page)?Number(raw.page):1;
 const size=typeof raw.pageSize==="string"&&["10","20","50"].includes(raw.pageSize)
  ?Number(raw.pageSize):10;
 const firstOffset=(requestedPage-1)*size;
 const firstBackendPage=Math.floor(firstOffset/30)+1;
 const rawTab=typeof raw.tab==="string"?raw.tab:
  raw.view==="faculty"?"FACULTY":raw.view==="students"?"STUDENT":"ALL";
 const validShape=Object.keys(raw).every(key=>validKeys.has(key))&&
  Object.values(raw).every(value=>!Array.isArray(value))&&
  (raw.page===undefined||typeof raw.page==="string"&&/^[1-9][0-9]{0,4}$/.test(raw.page))&&
  (raw.pageSize===undefined||typeof raw.pageSize==="string"&&["10","20","50"].includes(raw.pageSize));
 const query=adminUsersQuerySchema.safeParse(validShape?{
  tab:rawTab,q:raw.q,role:raw.role,membershipStatus:raw.membershipStatus,
  platformStatus:raw.platformStatus,page:firstBackendPage,
 }:{invalid:true});
 if(!query.success) return <div className="space-y-4"><PageHeader title="People Directory"/>
  <ErrorState title="Invalid directory filters" description="Review search, roles, statuses, or page."
   action={<Link href="/admin/people/directory" className="font-[650] text-primary-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lms-primary-text)] hover:text-[var(--lms-primary-text)] hover:underline w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4 min-h-11 md:min-h-9">Clear filters</Link>}/>
 </div>;
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="People Directory"
   description="A read-only contact lookup for the selected college. Use the management pages for registration, profile changes, access, suspension or teaching allocation."/>
  <Alert tone="warning">Select a college to browse contacts</Alert>
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
 // Backend pages remain 30 rows. Stitch at most three already-authorized
 // pages to restore the legacy 10/20/50 selection without changing the
 // shared directory read contract or leaking another tenant's scope.
 const firstIndex=firstOffset%30;
 const serverPagesNeeded=Math.ceil((firstIndex+size)/30);
 const extra=await Promise.all(Array.from({length:serverPagesNeeded-1},(_,i)=>
  listSuperAdminUsers(context,{...query.data,page:firstBackendPage+i+1})));
 const combined=[...data.items,...extra.flatMap(page=>page.items)];
 const displayed=combined.slice(firstIndex,firstIndex+size);
 const totalPages=Math.max(1,Math.ceil(data.total/size));
 const visiblePage=Math.min(requestedPage,totalPages);
 const href=(page:number,nextSize=size)=>{
  const base=new URL(adminUsersHref({...data.query,page:1}),"https://lms.invalid");
  if(page>1)base.searchParams.set("page",String(page));
  base.searchParams.set("pageSize",String(nextSize));
  return base.pathname+base.search;
 };
 const collegeRows=await listColleges(context).catch(()=>[]);
 const college=collegeRows.find(row=>row.id===context.adminScope?.collegeId);
 const tabs=[{id:"ALL",label:"All contacts"},{id:"FACULTY",label:"Faculty"},{id:"STUDENT",label:"Students"}] as const;
 const roleOptions = ["ALL", ...MEMBERSHIP_ROLES] as const;
 const membershipOptions = ["ALL", ...MEMBERSHIP_STATUSES] as const;
 const platformOptions = ["ALL", ...USER_PLATFORM_STATUSES] as const;
 const tabForm=adminPeopleSearchState(data.query);
 return <div className="min-w-0 space-y-[var(--lms-space-4)] md:space-y-[var(--lms-space-6)]">
  <PageHeader title="People Directory"
   eyebrow="People"
   description="A read-only contact lookup for the selected college. Use the management pages for registration, profile changes, access, suspension or teaching allocation."
   actions={<div className="flex min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] sm:flex-row sm:items-start">
    <Link href="/admin/people" className="inline-flex min-h-11 items-center justify-center font-semibold text-primary-text underline underline-offset-4 md:min-h-9 hover:text-[var(--lms-primary-text)]">← Membership management</Link>
    <SuperAdminPeopleCsvControl href={superAdminPeopleExportHref(data.query)} />
   </div>}/>
  <Tabs ariaLabel="People directory tabs" value={data.query.tab} renderPanel={false}
   items={tabs.map(tab=>({value:tab.id,label:tab.label,
    href:(()=>{
      const url=new URL(href(1),"https://lms.invalid");
      if(tab.id==="ALL")url.searchParams.delete("tab");
      else url.searchParams.set("tab",tab.id);
      url.searchParams.delete("role");
      return url.pathname+url.search;
    })()}))}/>
  <nav aria-label="People management shortcuts" className="flex flex-wrap gap-2 rounded border border-border p-3">
   {[
    {href:"/admin/students",label:"Student accounts"},
    {href:"/admin/faculty",label:"Faculty accounts"},
    {href:"/admin/faculty-assignment",label:"Teaching assignments"},
   ].map(item=><Link key={item.href} href={item.href}
     className="inline-flex min-h-11 items-center justify-center rounded border border-border bg-surface px-3 text-sm font-semibold text-link hover:border-primary md:min-h-9">{item.label}</Link>)}
  </nav>
  {college?<p className="text-xs text-body">Selected college: {college.name}
   {college.city?", "+college.city:""}{college.state?", "+college.state:""}</p>:null}

  <p className="text-xs text-muted-foreground">
   {data.query.tab==="STUDENT"?"Learner memberships":data.query.tab==="FACULTY"?"Faculty memberships":"All permitted memberships"} ·
   {" "}
   {data.contactVisible?"Contact shown within the explicitly selected college.":"Email and phone are masked outside a selected college."}
  </p>
  <form method="get" className="min-w-0 space-y-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)]">
   <Input type="hidden" name="tab" value={tabForm.hiddenTab} />
   <Input type="hidden" name="pageSize" value={size} />
   <div className="grid min-w-0 grid-cols-1 items-end gap-[var(--lms-space-3)] sm:grid-cols-2 md:grid-cols-[minmax(0,1fr)_minmax(0,13rem)_auto]">
    <label className="grid min-w-0 gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] text-[13px]">Search contacts
     <Input type="search" name="q" maxLength={100} placeholder="Search contacts..." defaultValue={query.data.q} className="min-h-11 w-full md:min-h-9"/>
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
  <div className="flex flex-wrap items-end justify-between gap-3">
   <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
    {data.total.toLocaleString("en-IN")} matching memberships · page {visiblePage} of {totalPages} · {size} per page
   </p>
   <form method="get" action="/admin/people/directory" className="flex items-end gap-2">
    {data.query.tab!=="ALL"?<input type="hidden" name="tab" value={data.query.tab}/>:null}
    {data.query.q?<input type="hidden" name="q" value={data.query.q}/>:null}
    {data.query.role!=="ALL"?<input type="hidden" name="role" value={data.query.role}/>:null}
    <label className="grid gap-1 text-sm font-semibold">Rows per page
     <Select name="pageSize" defaultValue={String(size)}>
      {[10,20,50].map(value=><option key={value} value={value}>{value}</option>)}
     </Select>
    </label>
    <Button type="submit" variant="secondary">Apply</Button>
   </form>
  </div>
  {displayed.length ? <DataTable<(typeof data.items)[number]>
   caption="People directory memberships"
   rows={displayed}
   getRowKey={row=>row.membershipId}
   empty={<EmptyState title="No contacts found" description="Your contacts will appear here once available."/>}
   columns={[
    {key:"name",header:"Name",mobilePriority:"primary",cell:row=>{
     const label=row.displayName||"Unnamed user";
     const palette=["bg-cyan-50 text-cyan-800","bg-indigo-50 text-indigo-800",
      "bg-amber-50 text-amber-800","bg-emerald-50 text-emerald-800",
      "bg-rose-50 text-rose-800","bg-violet-50 text-violet-800",
      "bg-sky-50 text-sky-800","bg-orange-50 text-orange-800"];
     const ix=[...row.membershipId].reduce((sum,c)=>sum+c.charCodeAt(0),0)%palette.length;
     const initials=label.trim().split(/\s+/).slice(0,2).map(x=>x.slice(0,1).toUpperCase()).join("");
     return <div className="flex min-w-0 items-center gap-3">
      <span aria-hidden="true" className={"inline-flex size-9 shrink-0 items-center justify-center rounded-full font-semibold "+palette[ix]}>{initials}</span>
      <div className="min-w-0"><p className="break-words font-semibold text-heading">{label}</p>
       <p className="text-xs text-muted-foreground">{row.collegeName}</p>
       <Link href={"/admin/people/directory/"+encodeURIComponent(row.membershipId)}
        className="inline-flex min-h-9 items-center text-xs font-semibold text-link underline">View membership</Link>
      </div></div>;
    }},
    {key:"email",header:"Email",mobilePriority:"secondary",cell:row=>
     <span className="break-all">{data.contactVisible?row.email??"—":"Email masked"}</span>},
    {key:"contact",header:"Contact",mobilePriority:"secondary",cell:row=>
     <span>{data.contactVisible?row.phoneE164??"—":"Phone masked"}</span>},
    ...(data.query.tab==="ALL"?[{
     key:"role",header:"Role",mobilePriority:"secondary" as const,
     cell:(row:(typeof data.items)[number])=><div className="flex flex-wrap gap-1">
      {row.roles.map(role=><StatusBadge key={role}>{role}</StatusBadge>)}
     </div>,
    }]:[]),
   ]}/>
   :<EmptyState title={data.query.q?"No matching contacts":"No contacts found"}
     description={data.query.q?"No contacts match this search. Try a different name.":"Your contacts will appear here once available."}/>}
  <div className="min-w-0 border-t border-border pt-3"><Pagination label="Contacts pages" page={visiblePage} pageCount={totalPages}
    hrefForPage={page=>href(page)}/></div>

 </div>;
}
