import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Alert} from "@/components/ui/alert";
import {Tabs} from "@/components/ui/tabs";
import {Table} from "@/components/ui/table";
import Link from "next/link";
import {legacyAcademicStatus} from "@/modules/academics/legacy-academic-status";
import {CollegeSlotManager} from "@/components/electives/college-slot-manager";
import {CollegeElectiveOfferingManager} from "@/components/electives/college-elective-offering-manager";
import {CollegeElectiveLifecycleAction} from "@/components/electives/college-elective-lifecycle-action";
import {listCollegeElectiveSlotOptions} from "@/modules/electives/college-slot-mutation-service";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {StatusBadge} from "@/components/ui/status-badge";
import {Disclosure} from "@/components/ui/disclosure";
import {adminElectiveQuerySchema} from "@/modules/electives/admin-directory-model";
import {listSuperAdminElectives} from "@/modules/electives/admin-directory-service";
import {AuthorizationError} from "@/modules/permissions/policy";

export const dynamic="force-dynamic";
const PAGE_SIZE=20;

/** Only a selected college shows the old Academic Setup strip. The explicit
 * UUID in the signed admin scope, never a query-string collegeId, controls
 * all elective queries and mutations. */
export default async function SuperAdminElectivesPage({
 searchParams,
}: {searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const params=await searchParams;
 const known=new Set(["q","status","programId","semesterNumber","page","slotId"]);
 const valid=Object.entries(params).every(([key,value])=>
  known.has(key)&&!Array.isArray(value));
 const parsed=valid?adminElectiveQuerySchema.safeParse({
  q:params.q,status:params.status,
  programId:params.programId||undefined,semesterNumber:params.semesterNumber||undefined,
 }):null;
 const pageText=params.page??"1";
 const pageValid=typeof pageText==="string"&&/^[1-9][0-9]{0,3}$/.test(pageText);
 const slotValid=params.slotId===undefined||
  (typeof params.slotId==="string"&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(params.slotId));
 const invalid=!parsed?.success||!pageValid||!slotValid;
 if(invalid)return <div className="min-w-0 space-y-4">
  <PageHeader title="Electives"/>
  <ErrorState title="Invalid elective filters"
   description="Use an eligible program, semester, search term and page. Remove repeated or unsupported URL filters."
   action={<Link href="/admin/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear filters</Link>}/>
 </div>;
 const context=await getCurrentRequestContext();
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <Alert tone="warning">Select a college from the header to manage elective slots.</Alert>
  <p className="text-sm text-body">Choose a college in the header above to see its electives.</p>
 </div>;
 const [dataResult,optionResult]=await Promise.all([
  listSuperAdminElectives(context,parsed.data).then(value=>({ok:true as const,value}))
   .catch(error=>{if(error instanceof AuthorizationError)throw error;
    return {ok:false as const,error};}),
  listCollegeElectiveSlotOptions(context).then(value=>({ok:true as const,value}))
   .catch(error=>{if(error instanceof AuthorizationError)throw error;
    return {ok:false as const,error};}),
 ]);
 const academicTabs=<Tabs ariaLabel="Academic Setup" renderPanel={false}
  value="/admin/electives" items={[
   {value:"/admin/academics",label:"Academic Setup",href:"/admin/academics"},
   {value:"/admin/programs",label:"Programs",href:"/admin/programs"},
   {value:"/admin/batches",label:"Batches",href:"/admin/batches"},
   {value:"/admin/electives",label:"Electives",href:"/admin/electives"},
  ]}/>;
 if(!dataResult.ok)return <div className="min-w-0 space-y-4">
  <PageHeader title="Electives"/>
  {academicTabs}
  <Alert tone="error">Could not load elective slots; use Retry above.</Alert>
  <Link href="/admin/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Retry slots</Link>
 </div>;
 const data=dataResult.value;
 const options=optionResult.ok?optionResult.value:null;
 // Old React key={selectedCollegeId} reset all filters on switch. A bookmark
 // with a program outside the new college must not keep a stale selection.
 const staleProgram=Boolean(data.query.programId&&
  !data.programs.some(row=>row.id===data.query.programId));
 if(staleProgram)return <div className="min-w-0 space-y-4">
  <PageHeader title="Electives"/>{academicTabs}
  <Alert tone="warning">The previous program filter is not available in this college. Choose a program again.</Alert>
  <Link href="/admin/electives" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Clear previous college filters</Link>
 </div>;
 const all=data.items;
 const requested=Number(pageText);
 const totalPages=Math.max(1,Math.ceil(all.length/PAGE_SIZE));
 const current=Math.min(requested,totalPages);
 const shown=all.slice((current-1)*PAGE_SIZE,current*PAGE_SIZE);
 const filterParams=new URLSearchParams({
  ...(data.query.q?{q:data.query.q}:{}),
  status:data.query.status,
  ...(data.query.programId?{programId:data.query.programId}:{}),
  ...(data.query.semesterNumber?{semesterNumber:String(data.query.semesterNumber)}:{}),
 });
 const link=(page:number,slotId?:string)=>{
  const next=new URLSearchParams(filterParams);
  next.set("page",String(page));
  if(slotId)next.set("slotId",slotId);
  return "/admin/electives?"+next.toString()+(slotId?"#selected-slot":"");
 };
 const selected=all.find(item=>item.id===params.slotId)??null;
 const noFilter=!data.query.q&&!data.query.programId&&!data.query.semesterNumber&&data.query.status==="ACTIVE";
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Electives" description="Manage elective slots and their offerings for this college."/>
  {academicTabs}
  <div className="flex min-w-0 flex-wrap items-end gap-3">
   <div className="min-w-0 grow">
    <Disclosure title="New slot" className="min-w-0" contentClassName="space-y-3 pt-3 pb-3">
     {options?<CollegeSlotManager options={options}/>:
      <Alert tone="warning">Slot editor unavailable. Refresh to reload creation options.</Alert>}
    </Disclosure>
   </div>
   <form method="get" action="/admin/electives" aria-label="Filter elective slots"
    className="grid w-full min-w-0 items-end gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(120px,1fr)_150px_180px_110px_auto]">
    <label className="grid min-w-0 gap-1 text-sm font-semibold">Search slots
     <Input name="q" defaultValue={data.query.q} maxLength={100}
      placeholder="Search slots" className="min-h-11 md:min-h-9"/>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Status
     <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
      <option value="ACTIVE">Active only</option>
      <option value="ALL">Incl. archived</option>
      <option value="ARCHIVED">Archived only</option>
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Program
     <Select name="programId" defaultValue={data.query.programId??""} className="min-h-11 md:min-h-9">
      <option value="">Program</option>
      {data.programs.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </label>
    <label className="grid gap-1 text-sm font-semibold">Semester
     <Select name="semesterNumber" defaultValue={data.query.semesterNumber??""} className="min-h-11 md:min-h-9">
      <option value="">All</option>
      {Array.from({length:12},(_,i)=>i+1).map(num=>
       <option key={num} value={num}>Sem {num}</option>)}
     </Select>
    </label>
    <Button type="submit" className="min-h-11 w-full md:min-h-9 sm:w-auto">Search</Button>
   </form>
   <Link href={link(current)} className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">Refresh</Link>
  </div>
  <Alert tone="info">
   One elective slot is one choice for an eligible program and semester.
   Students pick from courses offered inside that slot (for example, pick 1 of 3 courses).
   Create one slot per program and semester, then manage the offerings and allocation.
  </Alert>
  <p role="status" className="text-xs text-muted-foreground">
   {data.total} returned slots · {data.active} active · {data.archived} archived
   {data.truncated?" · More than 200 match. Narrow filters to see other records.":""}
  </p>
  <section aria-label="Existing elective slots" className="min-w-0">
   {all.length?<Table scrollLabel="Elective slots" className="w-full min-w-[760px]">
    <caption className="sr-only">Active and archived elective slots for the selected college</caption>
    <thead><tr>
     <th scope="col">Slot</th><th scope="col">Program</th><th scope="col">Semester</th>
     <th scope="col">Credits</th><th scope="col">Pick</th><th scope="col">Status</th>
     <th scope="col">Actions</th>
    </tr></thead>
    <tbody>{shown.map(item=><tr key={item.id}>
     <td className="min-w-40">
      <Link href={link(current,item.id)} aria-current={selected?.id===item.id?"true":undefined}
       className="font-semibold text-link underline">{item.name}</Link>
      {item.description?<p className="mt-1 max-w-xs text-xs text-muted-foreground">{item.description}</p>:null}
     </td>
     <td>{item.programName}</td><td>Sem {item.semesterNumber}</td><td>{item.credits}</td>
     <td>{item.minPick===item.maxPick?String(item.minPick):item.minPick+"–"+item.maxPick}</td>
     <td><StatusBadge tone={item.status==="ACTIVE"?"success":"neutral"}>{legacyAcademicStatus(item.status)}</StatusBadge></td>
     <td><div className="flex flex-wrap gap-3 text-sm font-semibold">
      <Link href={link(current,item.id)} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Open</Link>
      {options?<Link href={link(current,item.id)} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Edit</Link>:null}
      {options&&item.status==="ACTIVE"?<CollegeElectiveLifecycleAction slotId={item.id} name={item.name}
       status={item.status} version={item.version}/>:null}
     </div></td>
    </tr>)}</tbody>
   </Table>:
    <Alert tone="info">{noFilter?
     "No elective slots yet. Create one per program × semester, e.g. Professional Elective 1.":
     "No elective slots match the selected filters. Try another program, status or search term."}</Alert>}
   {all.length?<nav aria-label="Elective slot pages" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
    {current>1?<Link href={link(current-1)} className="min-h-11 font-semibold text-link underline md:min-h-9">← Previous</Link>:<span/>}
    <span>Showing {(current-1)*PAGE_SIZE+1}–{Math.min(current*PAGE_SIZE,all.length)} of {all.length}{data.truncated?" returned":""} slots · Page {current} of {totalPages}</span>
    {current<totalPages?<Link href={link(current+1)} className="min-h-11 font-semibold text-link underline md:min-h-9">Next →</Link>:<span/>}
   </nav>:null}
  </section>
  {selected?<section id="selected-slot" aria-label={"Selected elective slot "+selected.name}
   className="scroll-mt-20 space-y-4 border-t border-border pt-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><h2 className="text-lg font-semibold text-heading">{selected.name}</h2>
     <p className="text-sm text-body">{selected.programName} · Semester {selected.semesterNumber}</p>
    </div>
    <Link href={link(current)} className="inline-flex min-h-11 items-center text-link underline md:min-h-9">Close details</Link>
   </div>
   <dl className="grid gap-3 border-y border-border py-3 text-sm sm:grid-cols-3">
    <div><dt>Credits</dt><dd className="font-semibold">{selected.credits}</dd></div>
    <div><dt>Pick</dt><dd className="font-semibold">{selected.minPick===selected.maxPick?selected.minPick:selected.minPick+"–"+selected.maxPick}</dd></div>
    <div><dt>Academic year</dt><dd className="font-semibold">{selected.academicYear??"Not linked"}</dd></div>
   </dl>
   {options?<div className="space-y-4">
    <Disclosure title="Edit slot" contentClassName="py-3">
     <CollegeSlotManager options={options} row={{
      id:selected.id,name:selected.name,description:selected.description??null,version:selected.version,
      credits:selected.credits,minPick:selected.minPick,maxPick:selected.maxPick,status:selected.status,
     }}/>
    </Disclosure>
    {selected.status==="ACTIVE"?<CollegeElectiveOfferingManager slotId={selected.id}/>:null}
   </div>:<Alert tone="warning">Slot editing is not available. Refresh the page and retry.</Alert>}
  </section>:null}
  <Link href="/admin/academics" className="inline-flex min-h-11 items-center font-semibold text-link underline md:min-h-9">← Academic overview</Link>
 </div>;
}
