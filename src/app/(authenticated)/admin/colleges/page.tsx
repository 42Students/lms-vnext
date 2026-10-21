import {Button} from "@/components/ui/button";
import {inArray,sql} from "drizzle-orm";
import {getDb} from "@/db/client";
import {collegeMemberships} from "@/db/schema";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeCreateForm } from "@/components/admin/college-create-form";
import {CollegeBulkImport} from "@/components/admin/college-bulk-import";
import { CollegeArchiveButton } from "@/components/admin/college-archive-button";
import { CollegeEditDialog } from "@/components/admin/college-edit-dialog";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Dropdown } from "@/components/ui/dropdown";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
import { parseAdminDirectorySearchParams } from "@/modules/colleges/admin-directory-query-model";
import { Pagination } from "@/components/ui/pagination";
import { AuthorizationError, can, requirePermission } from "@/modules/permissions/policy";
import {canManageCollegeDirectoryRow} from "@/modules/colleges/admin-directory-access-model";
import { listColleges } from "@/modules/colleges/service";
import { listOrganizations } from "@/modules/organizations/service";

type CollegeRow = Awaited<ReturnType<typeof listColleges>>[number] & {canManage:boolean;organizationName:string};

const COLLEGE_SYNONYMS:Record<string,string>={
  iit:"indian institute of technology",nit:"national institute of technology",
  iiit:"international institute of information technology",
  bits:"birla institute of technology and science",vit:"vellore institute of technology",
  srm:"srm institute of science and technology",amrita:"amrita vishwa vidyapeetham",
  anna:"anna university",manipal:"manipal institute of technology",
  pes:"pes university",rvce:"rv college of engineering",
  bmsce:"bms college of engineering",msrit:"ms ramaiah institute of technology",
  dsce:"dayananda sagar college of engineering",
  sjce:"sri jayachamarajendra college of engineering",
  nie:"national institute of engineering",jss:"jss science and technology university",
  atria:"atria institute of technology",cmr:"cmr institute of technology",
  acharya:"acharya institute of technology", "new horizon":"new horizon college of engineering",
  oxford:"oxford college of engineering",presidency:"presidency university",
  christ:"christ university","mount carmel":"mount carmel college",
  "st joseph":"st joseph college",
};
function normalizedText(value:string|null|undefined):string {
  return (value??"").toLocaleLowerCase("en-IN").trim();
}
function collegeSearchFields(row:CollegeRow):string[]{
  return [row.name,row.code,row.city,row.state,row.country,
    row.addressLine1,row.addressLine2,row.landmark,
    row.organizationName==="Unavailable"?"":row.organizationName].map(normalizedText);
}
/** Legacy search rank without the separate usage counter (which is not available to this SSR directory). */
function collegeSearchScore(row:CollegeRow,query:string):number{
  if(!query)return 1;
  const terms=query in COLLEGE_SYNONYMS?[query,COLLEGE_SYNONYMS[query]]:[query];
  let best=0;
  for(const term of terms){
    for(const value of collegeSearchFields(row)){
      const score=value===term?100:value.startsWith(term)?80:
        value.includes(" "+term)?60:value.includes(term)?40:0;
      best=Math.max(best,score);
    }
  }
  return best;
}
/** Bounded Levenshtein fallback, only used when fewer than five substring results remain. */
function collegeFuzzyMatch(query:string,value:string):boolean {
  if(Math.abs(query.length-value.length)>2||!value)return false;
  let prior=Array.from({length:value.length+1},(_,i)=>i);
  for(let i=1;i<=query.length;i++){
    const next=[i];
    let minimum=i;
    for(let j=1;j<=value.length;j++){
      next[j]=Math.min(next[j-1]+1,prior[j]+1,
        prior[j-1]+(query[i-1]===value[j-1]?0:1));
      minimum=Math.min(minimum,next[j]);
    }
    if(minimum>2)return false;
    prior=next;
  }
  return prior[value.length]<=2;
}


const columns: DataTableColumn<CollegeRow>[] = [
  {
    key: "name",
    header: "Name",
    mobilePriority: "primary",
    cell: (college) => <span className="font-semibold text-foreground">{college.name}</span>,
  },
  {
    key: "organization",
    header: "Organization",
    cell: (college) => college.organizationName,
  },
  {
    key: "uniqueId",
    header: "Unique ID",
    cell: (college) => college.code,
  },
  {
    key: "city",
    header: "City",
    cell: (college) => college.city || "—",
  },
  {
    key: "state",
    header: "State",
    cell: (college) => college.state || "—",
  },
  {
    key: "actions",
    mobilePriority: "action",
    header: "Actions",
    className: "text-right",
    cell: (college) => (
      <div className="flex min-w-0 flex-wrap justify-start gap-2 md:justify-end">
        <Link href={`/admin/colleges/${encodeURIComponent(college.id)}`}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]">
          Manage
        </Link>
        {college.canManage?<CollegeEditDialog college={college} />:null}
        <Dropdown trigger="More" label={"More actions for "+college.name} align="end" mobileSheet triggerClassName="md:!min-h-9">
          <div className="grid min-w-0 gap-[var(--lms-space-2)]">
        <Link role="menuitem"
          href={`/admin/colleges/${encodeURIComponent(college.id)}/readiness`}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]"
        >
          Readiness
        </Link>
        <Link role="menuitem"
          href={`/admin/colleges/${encodeURIComponent(college.id)}/branding`}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-[650] text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 hover:text-[var(--lms-primary-text)]"
        >
          Branding
        </Link>
        {college.canManage ? <>
          <CollegeArchiveButton collegeId={college.id} name={college.name} />
        </> : null}
          </div>
        </Dropdown>
      </div>
    ),
  },
];

export default async function CollegesPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
  const context = await getCurrentRequestContext();
  requirePermission(context, "admin-scope.select");
  const raw=await searchParams;
  // Extra legacy search facets are validated before they can narrow the authorized list.
  // A numeric legacy organization ID cannot be matched against vNext UUIDs.
  const rawDirectory=Object.fromEntries(Object.entries(raw).filter(([key])=>
    !["state","city","orgId"].includes(key)));
  // The old directory showed ten records initially, with a size changer.
  const filters=parseAdminDirectorySearchParams({pageSize:"10",...rawDirectory});
  const validFacet=(value:unknown,max:number)=>value===undefined||
    (typeof value==="string"&&value.length<=max);
  const validOrg=raw.orgId===undefined||
    (typeof raw.orgId==="string"&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(raw.orgId));
  if (!filters||!validFacet(raw.state,80)||!validFacet(raw.city,100)||!validOrg) return <div className="min-w-0 space-y-[var(--lms-space-6)]">
    <PageHeader title="Colleges"/>
    <ErrorState title="Invalid college directory filters"
      description="Search text must be 100 characters or less; choose a valid page and page size. Remove repeated or unsupported filters."
      action={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 underline-offset-4 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>}/>
  </div>;
  const [collegesResult,organizationsResult]=await Promise.all([
    listColleges(context).then(value=>({ok:true as const,value}))
      .catch(error=>{
        if(error instanceof AuthorizationError)throw error;
        return {ok:false as const,value:[]};
      }),
    listOrganizations(context).then(value=>({ok:true as const,value}))
      .catch(error=>{
        if(error instanceof AuthorizationError)throw error;
        return {ok:false as const,value:[]};
      }),
  ]);
  if(!collegesResult.ok)return <div className="min-w-0 space-y-6">
    <PageHeader title="Colleges"/>
    <ErrorState title="Colleges could not be loaded"
      description="The authorized college directory could not be loaded. No tenant records were changed."
      action={<Link href="/admin/colleges" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">Retry colleges</Link>}/>
  </div>;
  const colleges=collegesResult.value;
  const organizations=organizationsResult.value;
  const organizationNames=new Map(organizations.map(x=>[x.id,x.name]));
  const rows:CollegeRow[] = colleges.map(college=>({
    ...college,
    organizationName:organizationNames.get(college.organizationId)??("Org #"+college.organizationId.slice(0,8)),
    canManage:organizationsResult.ok&&canManageCollegeDirectoryRow(context,college),
  }));
  // Legacy popularity favored colleges with meaningful activity rather than
  // alphabetical ties. vNext does not retain search-click analytics; use
  // the registered membership population ONLY for the already-authorized
  // list of colleges. Failed stats reads must not blank the directory.
  const popularityRead=rows.length?await getDb().select({
   collegeId:collegeMemberships.collegeId,
   total:sql<number>`count(*)::integer`,
  }).from(collegeMemberships)
   .where(inArray(collegeMemberships.collegeId,rows.map(row=>row.id)))
   .groupBy(collegeMemberships.collegeId)
   .then(value=>({ok:true as const,value}))
   .catch(()=>({ok:false as const,value:[]})):({ok:true as const,value:[]});
  const popularity=new Map(popularityRead.value.map(item=>[item.collegeId,item.total]));
  const {q,pageSize}=filters;
  const state=typeof raw.state==="string"?raw.state.trim():"";
  const city=typeof raw.city==="string"?raw.city.trim():"";
  const orgId=typeof raw.orgId==="string"?raw.orgId:"";
  const normalized=normalizedText(q);
  const scopeRows=rows.filter(item=>
    (!state||normalizedText(item.state)===normalizedText(state))&&
    (!city||normalizedText(item.city)===normalizedText(city))&&
    (!orgId||item.organizationId===orgId));
  const ranked=scopeRows.map(item=>({item,score:collegeSearchScore(item,normalized)}));
  const primary=ranked.filter(entry=>entry.score>0);
  if(normalized.length>=3&&primary.length<5){
    for(const entry of ranked){
      if(entry.score>0)continue;
      if(collegeFuzzyMatch(normalized,normalizedText(entry.item.name)))
        primary.push({...entry,score:20});
    }
  }
  const matches=primary.sort((a,b)=>b.score-a.score||
    (popularity.get(b.item.id)??0)-(popularity.get(a.item.id)??0)||
    a.item.name.localeCompare(b.item.name,"en-IN")||a.item.id.localeCompare(b.item.id))
    .map(entry=>entry.item);
  const pages=Math.max(1,Math.ceil(matches.length/pageSize));
  const requestedPage=filters.page;
  const page=Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(pages,requestedPage)):1;
  const visible=matches.slice((page-1)*pageSize,page*pageSize);
  const href=(n:number)=>"/admin/colleges?"+new URLSearchParams({
   ...(q?{q}:{}),...(state?{state}:{}),...(city?{city}:{}),
   ...(orgId?{orgId}:{}),page:String(n),pageSize:String(pageSize),
  }).toString();
  const creatableOrganizations = organizationsResult.ok?organizations.filter(
    (organization) =>
      can(context, "college.manage", {
        organizationId: organization.id,
      }),
  ):[];

  return (
    <div className="min-w-0 space-y-[var(--lms-space-6)]">
      <PageHeader
        title="Colleges"
        description="Active colleges are constrained by the selected Super Admin safety scope."
        actions={<Link href="/admin/tenants" className="inline-flex min-h-11 items-center font-semibold text-primary-text underline underline-offset-4 hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] min-[768px]:min-h-9">Search tenant directory →</Link>}
      />
      {!organizationsResult.ok?<Banner tone="warning" role="status"
        action={<Link href={href(page)}
          className="inline-flex min-h-11 items-center font-semibold text-primary-text underline md:min-h-9">
          Retry organizations
        </Link>}>
        Organizations could not be loaded. College create, import, edit and archive actions
        are disabled until the authorized organization directory is available.
      </Banner>:null}

      <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <section aria-label="Create New College" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm md:p-5">
       <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Create New College</h2>
      {creatableOrganizations.length > 0 ? (
        <div className="min-w-0 space-y-3">
        <CollegeCreateForm
          organizations={creatableOrganizations.map(
            (organization) => ({
              id: organization.id,
              name: organization.name,
            }),
          )}
        />
        </div>
      ) : organizationsResult.ok&&organizations.length === 0 ? (
        <EmptyState
          title="Create an organization first"
          description="Every college belongs to an organization, so the organization is the required first tenant boundary."
        />
      ) : !organizationsResult.ok?<p role="status" className="text-sm text-muted-foreground">Organization options are unavailable. Retry organizations above.</p>:<p className="text-sm text-muted-foreground">Your role cannot create colleges in this scope.</p>}
      </section>
      <section aria-label="Existing Colleges" className="min-w-0 space-y-4 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 shadow-sm md:p-5">
       <h2 className="text-lg font-semibold text-[var(--lms-heading)]">Existing Colleges</h2>
      <form role="search" aria-label="Search colleges" className="grid min-w-0 items-end gap-[8px] border-y border-border py-[var(--lms-space-4)] md:grid-cols-[minmax(0,1fr)_auto_auto] lg:grid-cols-[minmax(0,1fr)_auto_auto_auto_auto]" method="get">
       <label className="flex min-w-0 w-full flex-1 flex-col gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)] md:min-w-48">Search colleges
        <Input type="search" name="q" defaultValue={q} maxLength={100} placeholder="Search colleges..." />
       </label>
       <label className="flex flex-col gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">State
        <Input name="state" defaultValue={state} maxLength={80} placeholder="All states"/>
       </label>
       <label className="flex flex-col gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">City
        <Input name="city" defaultValue={city} maxLength={100} placeholder="All cities"/>
       </label>
       {organizationsResult.ok?<label className="flex flex-col gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Organization
        <Select name="orgId" defaultValue={orgId}>
          <option value="">All authorized organizations</option>
          {organizations.map(org=><option key={org.id} value={org.id}>{org.name}</option>)}
        </Select>
       </label>:orgId?<Input type="hidden" name="orgId" value={orgId}/>:null}
       <label className="flex flex-col gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
        <Select name="pageSize" defaultValue={String(pageSize)}>
         {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
        </Select>
       </label>
       <Button type="submit" className="w-full md:w-auto">Search</Button>
       <Link href="/admin/colleges" className="inline-flex min-h-11 items-center text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 underline-offset-4">Clear search</Link>
       <Link href={href(page)} className="inline-flex min-h-11 items-center text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 underline-offset-4">Refresh directory</Link>
      </form>
      <p role="status" className="text-sm text-muted-foreground tabular-nums">{q||state||city||orgId?matches.length+" of "+rows.length:rows.length} colleges · Page {page} of {pages}</p>
      <p className="text-xs text-muted-foreground">{popularityRead.ok
       ?"Search ranks exact/prefix, synonym and bounded fuzzy matches first, then authorized membership activity. Historic click popularity is not retained."
       :"Membership popularity is temporarily unavailable; exact, synonym and fuzzy ranking remain available."}</p>
      <DataTable columns={columns} rows={visible} getRowKey={college=>college.id}
        caption="Colleges"
        empty={<EmptyState title={q||state||city||orgId ? "No colleges match your search" : "No active colleges in this scope"}
          description="No college records are visible under the selected Super Admin safety scope. Clear or change the scope to search elsewhere; no tenants were modified."/>}/>
      <Pagination page={page} pageCount={pages} hrefForPage={href} label="College directory pages"/>
      {creatableOrganizations.length>0?<CollegeBulkImport organizations={creatableOrganizations.map(x=>({id:x.id,name:x.name}))}/>:null}
      </section>
      </div>
    </div>
  );
}
