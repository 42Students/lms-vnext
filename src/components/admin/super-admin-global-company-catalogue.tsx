import Link from "next/link";
import type {RequestContext} from "@/modules/identity/context";
import {listSuperAdminGlobalCompanyCatalogue} from "@/modules/placements/admin-company-directory-service";
import type {z} from "zod";
import {adminCompaniesQuerySchema} from "@/modules/placements/admin-company-directory-model";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable,type DataTableColumn} from "@/components/ui/data-table";
import {StatusBadge} from "@/components/ui/status-badge";
import {SuperAdminCompanySearch} from "@/components/admin/super-admin-company-search";
import {SuperAdminCompanyEdit} from "@/components/admin/super-admin-company-edit";
import {SuperAdminCompanyVerification} from "@/components/admin/super-admin-company-verification";
import {SuperAdminCompanyRestore} from "@/components/admin/super-admin-company-restore";
import {SuperAdminCompanyIdentities} from "@/components/admin/super-admin-company-identities";
import {Disclosure} from "@/components/ui/disclosure";
import {ErrorState} from "@/components/ui/error-state";
import {EmptyState} from "@/components/ui/empty-state";
import {Button} from "@/components/ui/button";
import {Tabs} from "@/components/ui/tabs";

type Filters=z.infer<typeof adminCompaniesQuerySchema>;

const formatLast=(date:Date|null)=>date?new Intl.DateTimeFormat("en-IN",{
 timeZone:"Asia/Kolkata",day:"2-digit",month:"short",year:"numeric",
}).format(date):"Never posted";
function safeHttps(raw:string|null){
 if(!raw)return null;
 try{const u=new URL(raw);return u.protocol==="https:"&&!u.username&&!u.password?u.toString():null;}
 catch{return null;}
}
function Logo({name,url}:{name:string;url:string|null}){
 const safe=safeHttps(url);
 return <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-[var(--lms-control-radius)] border border-border bg-[var(--lms-primary-subtle)] text-xs font-semibold text-primary-text">
  {safe?<img width={32} height={32} loading="lazy" alt="" src={safe} className="size-8 object-contain"/>:
   name.split(/\s+/).slice(0,2).map(word=>word[0]?.toUpperCase()??"").join("")}
 </span>;
}
function csvValue(value:string|number|null){
 const raw=String(value??"");
 return '"'+(/^[\s]*[=+@\-]/.test(raw)?"'"+raw:raw).replaceAll('"','""')+'"';
}
export async function SuperAdminGlobalCompanyCatalogue({context,filters}:{
 context:RequestContext;filters:Filters;
}){
 const load=await listSuperAdminGlobalCompanyCatalogue(context,filters)
  .then(value=>({ok:true as const,value})).catch(()=>({ok:false as const}));
 const tabs=<Tabs ariaLabel="Company directory tabs" renderPanel={false} value="GLOBAL" items={[
  {value:"GLOBAL",label:"42's curated company list",href:"/admin/companies?view=GLOBAL"},
 ]}/>;
 if(!load.ok)return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Companies" description="42's curated company list"/>
  {tabs}
  <ErrorState title="Couldn't load companies" description="The global company catalogue could not be read. No stale results or private company relationships are shown."
   action={<Link href="/admin/companies?view=GLOBAL" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry</Link>}/>
 </div>;
 const data=load.value;
 const columns:DataTableColumn<(typeof data.rows)[number]>[]=[
  {key:"name",header:"Company",mobilePriority:"primary",cell:row=><div className="flex min-w-0 gap-3">
   <Logo name={row.name} url={row.logoPublicUrl}/>
   <div className="min-w-0 space-y-1">
    <div className="font-semibold text-[var(--lms-heading)]">{row.name}</div>
    {row.website?<div className="break-all text-xs text-muted-foreground">{row.website}</div>:null}
    {row.aliases.length?<div className="break-words text-xs text-muted-foreground">Also known as {row.aliases.join(", ")}</div>:null}
    <StatusBadge tone={row.verifiedAt?"success":"neutral"}>{row.verifiedAt?"Verified by 42":"Not verified"}</StatusBadge>
   </div>
  </div>},
  {key:"domains",header:"Domains",mobilePriority:"secondary",cell:row=><span className="break-all">{row.domains.length?row.domains.join(", "):"None"}</span>},
  {key:"added",header:"Added by",cell:row=><span>{row.companyCollegeCount?"college":"-"}</span>},
  {key:"drives",header:"Drives",cell:row=><span className="tabular-nums">{row.driveCount}</span>},
  {key:"last",header:"Last active",cell:row=><span>{formatLast(row.lastActiveAt)}</span>},
  {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><div className="flex flex-wrap items-center gap-2">
    {row.companyStatus==="ARCHIVED"?<SuperAdminCompanyRestore id={row.companyId} name={row.name}/>:<>
     <SuperAdminCompanyVerification companyId={row.companyId} name={row.name} verified={Boolean(row.verifiedAt)}/>
     <SuperAdminCompanyEdit company={{id:row.companyId,name:row.name,website:row.website,industry:row.industry??null,
      about:row.about??null,logoPublicUrl:row.logoPublicUrl??null,updatedAt:row.updatedAt.toISOString()}}/>
     <Disclosure title="Domains · Other names" className="min-w-0">
      <SuperAdminCompanyIdentities companyId={row.companyId} name={row.name}
       domains={row.domains} aliases={row.aliases}/>
     </Disclosure>
    </>}
    <Link href={"/admin/companies/"+encodeURIComponent(row.companyId)+"/drives"}
     target="_blank" rel="noopener noreferrer"
     className="inline-flex min-h-9 items-center font-semibold text-primary-text underline">History</Link>
    <p className="text-xs text-muted-foreground">Select a college to merge</p>
   </div>},
 ];
 const csv=["Company,Website,Domains,Other names,Verified,Drives,Last active",
  ...data.rows.map(row=>[row.name,row.website??"",row.domains.join("; "),row.aliases.join("; "),
   row.verifiedAt?"Verified by 42":"Not verified",row.driveCount,formatLast(row.lastActiveAt)]
   .map(csvValue).join(","))].join("\r\n");
 const pageUrl=(page:number)=>"/admin/companies?"+new URLSearchParams({
  view:"GLOBAL",q:data.query.q,page:String(page),status:data.query.status,
  companyStatus:data.query.companyStatus,verified:data.query.verified,sort:data.query.sort,
  searchField:data.query.searchField,website:data.query.website,changedWithin:data.query.changedWithin,
 }).toString();
 return <div className="min-w-0 space-y-[var(--lms-space-4)]">
  <PageHeader title="Companies" description="42's curated company list"/>
  {tabs}
  <p className="text-sm leading-6 text-body">Every company on 42LMS is listed once per real company, identified by email and web domains. Curate and verify identities before merging any company relationship.</p>
  <SuperAdminCompanySearch key={"GLOBAL:"+data.query.q+":"+data.query.verified}
   mode="GLOBAL" initialQuery={data.query.q} initialVerified={data.query.verified==="NOT_VERIFIED"}/>
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
   <p role="status" className="text-sm text-body">Showing {data.rows.length.toLocaleString("en-IN")} of {data.total.toLocaleString("en-IN")} companies{data.query.q?" matching your search":""} · page {data.query.page} of {data.totalPages}</p>
   {data.rows.length?<a download="companies.csv" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(csv)}
    className="inline-flex min-h-9 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text hover:bg-[var(--lms-primary-subtle)]">↓ Export CSV</a>:
    <Button type="button" variant="secondary" disabled>Export CSV</Button>}
  </div>
  <DataTable caption="42's curated company list" rows={data.rows} columns={columns}
   getRowKey={row=>row.companyId} empty={<EmptyState title="No companies" description="No global company identities match your search."/>}/>
  <nav aria-label="Company catalogue pages" className="flex min-w-0 flex-wrap gap-4 text-sm font-semibold">
   {data.query.page>1?<Link href={pageUrl(data.query.page-1)} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Previous</Link>:null}
   {data.query.page<data.totalPages?<Link href={pageUrl(data.query.page+1)} className="inline-flex min-h-11 items-center text-primary-text underline md:min-h-9">Next</Link>:null}
  </nav>
  <p className="text-xs text-muted-foreground">Only this page of up to 50 authorized global companies is exported. Select a college scope before reviewing a merge; private college CRM details are not included.</p>
  <Link href="/admin/placements" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">← Placement operations</Link>
 </div>;
}
