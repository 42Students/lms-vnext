import Link from "next/link";
import {DataTable} from "@/components/ui/data-table";
import {Tabs} from "@/components/ui/tabs";
import {Alert} from "@/components/ui/alert";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {PageBackLink} from "@/components/ui/page-back-link";
import {StatusBadge} from "@/components/ui/status-badge";
import {EmptyState} from "@/components/ui/empty-state";
import {Disclosure} from "@/components/ui/disclosure";
import {Button} from "@/components/ui/button";
import {Pagination} from "@/components/ui/pagination";
import {ErrorState} from "@/components/ui/error-state";
import {PersonOnboardDialog} from "@/components/admin/person-onboard-dialog";
import {CollegeAdminLifecycleAction} from "@/components/admin/college-admin-lifecycle-action";
import {listCollegeAdminSessionTargetsPage} from "@/modules/colleges/admin-session-service";

export const dynamic="force-dynamic";
export default async function CollegeAdministratorsPage({params,searchParams}:{
 params:Promise<{collegeId:string}>;
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const collegeId=(await params).collegeId;
 const context=await getCurrentRequestContext();
 const raw=await searchParams;
 const rawPage=raw.page;
 const validPage=Object.keys(raw).every(key=>key==="page"||key==="role")&&
   (rawPage===undefined||(typeof rawPage==="string"&&/^[1-9][0-9]{0,4}$/.test(rawPage)&&Number(rawPage)<=10000));
 const role=(raw.role==="COLLEGE_ADMIN"||raw.role==="TPO")?raw.role:"ALL";
 if(raw.role!==undefined&&raw.role!=="COLLEGE_ADMIN"&&raw.role!=="TPO"&&raw.role!=="ALL")
  return <div className="min-w-0 space-y-4"><PageHeader title="College administrators"/>
   <ErrorState title="Invalid administrator role" description="Choose Admin or TPO."
    action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins"} className="text-link underline">Clear filters</Link>}/>
  </div>;
 if(!validPage)return <div className="min-w-0 space-y-[var(--lms-space-4)]">
   <PageHeader title="College administrators"/>
   <ErrorState title="Invalid administrator page"
     description="Choose a valid administrator page number."
     action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins"}
       className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
       Clear page filter
     </Link>}/>
 </div>;
 const page=typeof rawPage==="string"?Number(rawPage):1;
 const result=await listCollegeAdminSessionTargetsPage(context,collegeId,page,role).then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
 if(!result.ok)return <div className="min-w-0 space-y-4">
  <PageHeader title="College Admin and TPO accounts"/>
  <ErrorState title="Could not load administrator accounts"
   description="The selected college's roster could not be loaded. An unavailable list does not mean no accounts exist."
   action={<Link href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins"} className="inline-flex min-h-11 items-center font-semibold text-link underline">Retry</Link>}/>
 </div>;
 const data=result.value;
 const pageCount=data.pageCount;
 const pageItems=data.items;
 const baseHref="/admin/colleges/"+encodeURIComponent(collegeId)+"/admins";
 return <div className="min-w-0 space-y-[var(--lms-space-6)] md:ml-auto md:max-w-[980px]">
  <PageHeader title={data.college.name+" · Admins"}
   description="Manage college administrators and placement-cell officers in this college. New accounts use the canonical college membership workflow."
   actions={<div className="flex w-full min-w-0 flex-col items-stretch gap-[var(--lms-space-2)] md:w-auto md:flex-row md:items-center md:justify-end">
    <PageBackLink href={"/admin/colleges/"+encodeURIComponent(collegeId)} label="College setup"/>
    <div className="grid min-w-0 w-full gap-[var(--lms-space-2)] sm:grid-cols-2 md:w-auto">
      <PersonOnboardDialog collegeId={collegeId} forcedRole="COLLEGE_ADMIN"/>
      <PersonOnboardDialog collegeId={collegeId} forcedRole="TPO"/>
    </div>
   </div>}/>
  <section aria-label="Create administrator" className="min-w-0 space-y-3 rounded border border-border p-4">
   <h2 className="font-semibold">Add College Admin or TPO</h2>
   <p className="text-sm text-body">Choose the account type. New accounts are always scoped to the college shown above.</p>
   <div className="flex flex-wrap gap-3"><PersonOnboardDialog collegeId={collegeId} forcedRole="COLLEGE_ADMIN"/>
    <PersonOnboardDialog collegeId={collegeId} forcedRole="TPO"/></div>
  </section>
  <Tabs ariaLabel="Administrator roles" renderPanel={false} value={role} items={[
   {value:"ALL",label:"All",href:baseHref},
   {value:"COLLEGE_ADMIN",label:"Admin",href:baseHref+"?role=COLLEGE_ADMIN"},
   {value:"TPO",label:"TPO",href:baseHref+"?role=TPO"},
  ]}/>
  <div className="flex justify-end">
   <Link href={baseHref+(role==="ALL"?"":"?role="+role)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">↻ Reload administrators</Link>
  </div>
  <section aria-label="College administrator directory" className="min-w-0 border-t border-border pt-[var(--lms-space-4)]">
   <h2 className="mb-3 font-semibold">College Admin and TPO accounts</h2>
   <p className="mb-3 text-sm text-muted-foreground" role="status">
     Showing {pageItems.length} of {data.total} college administrators · Page {page} of {pageCount}
   </p>
   <DataTable<(typeof data.items)[number]> caption="College Admin and TPO accounts" rows={pageItems} getRowKey={item=>item.userId}
    empty={<EmptyState title={data.total===0?"No administrator accounts":"No administrators on this page"}
      description={data.total===0?"No active College Admin or TPO accounts in this college.":"Return to an earlier page to see the available administrators."}/>}
    columns={[
      {key:"name",header:"Name",mobilePriority:"primary",cell:item=><strong>{item.name}</strong>},
      {key:"roles",header:"Role",mobilePriority:"secondary",cell:item=>
       item.roles.map(role=>role==="COLLEGE_ADMIN"?"College Admin":role==="TPO"?"TPO":role).join(", ")},
      {key:"mobile",header:"Mobile",mobilePriority:"secondary",cell:()=>
        <span className="text-xs text-muted-foreground" title="Phone is not provided by the tenant-scoped admin directory service">
          Unavailable
        </span>},
      {key:"email",header:"Email",mobilePriority:"secondary",cell:item=><span className="break-all">{item.email??"Not recorded"}</span>},
      {key:"org",header:"Org",cell:()=>data.college.organizationId},
      {key:"college",header:"College",cell:()=>data.college.name},
      {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status==="ACTIVE"?"success":"warning"}>{item.status==="ACTIVE"?"Enabled":"Suspended"}</StatusBadge>},
      {key:"access",header:"Access",mobilePriority:"action",cell:item=><Disclosure title="Access" className="min-w-0" contentClassName="pt-[var(--lms-space-2)]"><CollegeAdminLifecycleAction membershipId={item.membershipId} status={item.status} hasMentorRole={item.roles.includes("MENTOR")} displayName={item.name}/></Disclosure>},
      {key:"sessions",header:"Sessions",mobilePriority:"action",cell:item=><Link title="View active devices"
        href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(item.userId)}
        className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
        Sessions
      </Link>},
      {key:"actions",header:"Actions",mobilePriority:"action",cell:item=><div className="flex min-w-0 flex-wrap items-center gap-2">
        <Link title="View administrator history"
          href={"/admin/colleges/"+encodeURIComponent(collegeId)+"/admins/"+encodeURIComponent(item.userId)+"/history"}
          className="inline-flex min-h-11 items-center text-link underline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          History
        </Link>
        <Button size="sm" variant="ghost" disabled
          title={item.status==="ACTIVE"
            ?"Suspend this administrator before reviewing deletion. Permanent deletion is not implemented."
            :"Permanent deletion is unavailable until faculty, mentoring and audit dependencies are verified."}>
          Delete
        </Button>
      </div>},
    ]}/>
  </section>
  <Pagination page={Math.min(page,pageCount)} pageCount={pageCount}
    hrefForPage={next=>baseHref+(next===1&&role==="ALL"?"":"?"+new URLSearchParams({
     ...(next>1?{page:String(next)}:{}),...(role!=="ALL"?{role}:{})
   }).toString())} label="College administrator pages"/>
  {data.total===0?<Alert tone="info">No {role==="ALL"?"College Admin or TPO":role==="TPO"?"TPO":"Admin"} accounts recorded for this college.</Alert>:null}
  {page>pageCount?<p role="alert" className="text-sm text-warning">
    Page outside the available results. Return to the first page; no other administrator data was loaded.
    <Link href={baseHref} className="ml-2 font-semibold text-primary-text underline">First page</Link>
  </p>:null}
 </div>;
}
