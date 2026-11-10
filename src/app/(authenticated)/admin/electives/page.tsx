import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Alert} from "@/components/ui/alert";
import {Tabs} from "@/components/ui/tabs";
import {Table} from "@/components/ui/table";
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
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";

export const dynamic="force-dynamic";
// Server-side listing defaults to 20 rows per page.

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
  q:params["q"],status:params["status"],
  programId:params["programId"]||undefined,semesterNumber:params["semesterNumber"]||undefined,
   page:params["page"]||undefined,
 }):null;
 const pageText=params["page"]??"1";
 const pageValid=typeof pageText==="string"&&/^[1-9][0-9]{0,3}$/.test(pageText);
 const slotValid=params["slotId"]===undefined||
  (typeof params["slotId"]==="string"&&/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(params["slotId"]));
 const invalid=!parsed?.success||!pageValid||!slotValid;
 if(invalid)return <div className="min-w-0 space-y-4">
  <PageHeader title="Electives"/>
  <ErrorState title="Invalid elective filters"
   description="Use an eligible program, semester, search term and page. Remove repeated or unsupported URL filters."
   action={<TextLink href="/admin/electives" className="inline-flex min-h-11 items-center md:min-h-9">Clear filters</TextLink>}/>
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
  <Alert tone="error">Could not load elective slots. Choose Retry slots below to try again without clearing your filters.</Alert>
  <TextLink href="/admin/electives" className="inline-flex min-h-11 items-center md:min-h-9">Retry slots</TextLink>
 </div>;
 const data=dataResult.value;
 if(data.state==="CHOOSE_COLLEGE")return <div className="min-w-0 space-y-4">
  <PageHeader title="Electives"/>
  <Alert tone="warning">Select an active college in the header before viewing its elective slots.</Alert>
 </div>;
 const options=optionResult.ok?optionResult.value:null;
 // Old React key={selectedCollegeId} reset all filters on switch. A bookmark
 // with a program outside the new college must not keep a stale selection.
 const staleProgram=Boolean(data.query.programId&&
  !data.programs.some(row=>row.id===data.query.programId));
 if(staleProgram)return <div className="min-w-0 space-y-4">
  <PageHeader title="Electives"/>{academicTabs}
  <Alert tone="warning">The previous program filter is not available in this college. Choose a program again.</Alert>
  <TextLink href="/admin/electives" className="inline-flex min-h-11 items-center md:min-h-9">Clear previous college filters</TextLink>
 </div>;
 const all=data.items;
 // The directory already applies server-side LIMIT/OFFSET and total count.
 const totalPages=data.totalPages;
 const current=data.page;
 const shown=all;
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
 const selected=all.find(item=>item.id===params["slotId"])??null;
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
    <Label stack className="min-w-0">Search slots
     <Input name="q" defaultValue={data.query.q} maxLength={100}
      placeholder="Search slots" className="min-h-11 md:min-h-9"/>
    </Label>
    <Label stack>Status
     <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
      <option value="ACTIVE">Active only</option>
      <option value="ALL">Incl. archived</option>
      <option value="ARCHIVED">Archived only</option>
     </Select>
    </Label>
    <Label stack>Program
     <Select name="programId" defaultValue={data.query.programId??""} className="min-h-11 md:min-h-9">
      <option value="">Program</option>
      {data.programs.map(row=><option key={row.id} value={row.id}>{row.name}</option>)}
     </Select>
    </Label>
    <Label stack>Semester
     <Select name="semesterNumber" defaultValue={data.query.semesterNumber??""} className="min-h-11 md:min-h-9">
      <option value="">All</option>
      {Array.from({length:12},(_,i)=>i+1).map(num=>
       <option key={num} value={num}>Sem {num}</option>)}
     </Select>
    </Label>
    <Button type="submit" className="min-h-11 w-full md:min-h-9 sm:w-auto">Search</Button>
   </form>
   <TextLink href={link(current)} className="inline-flex min-h-11 items-center md:min-h-9">Refresh</TextLink>
  </div>
  <Alert tone="info">
   One elective slot is one choice for an eligible program and semester.
   Students pick from courses offered inside that slot (for example, pick 1 of 3 courses).
   Create one slot per program and semester, then manage the offerings and allocation.
  </Alert>
  <p role="status" className="text-xs text-muted-foreground">
   {data.total} matching slots · {data.active} active and {data.archived} archived on this page
  </p>
  <section aria-label="Existing elective slots" className="min-w-0">
   {all.length?<Table scrollLabel="Elective slots" className="w-full min-w-[1080px]">
    <caption className="sr-only">Active and archived elective slots for the selected college</caption>
    <thead><tr>
     <th scope="col">Slot</th><th scope="col">Program</th><th scope="col">Sem</th>
     <th scope="col">Year</th><th scope="col">Credits</th><th scope="col">Pick</th>
     <th scope="col">Offerings</th><th scope="col">Students</th><th scope="col">Status</th>
     <th scope="col"><span className="sr-only">Actions</span></th>
    </tr></thead>
    <tbody>{shown.map(item=><tr key={item.id}>
     <td className="min-w-40">
      <TextLink href={link(current,item.id)} aria-current={selected?.id===item.id?"true":undefined}>{item.name}</TextLink>
      {item.description?<p className="mt-1 max-w-xs text-xs text-muted-foreground">{item.description}</p>:null}
     </td>
     <td>{item.programName}</td><td>{item.semesterNumber}</td>
     <td>{item.academicYear??"—"}</td><td>{item.credits}</td>
     <td>{item.minPick===item.maxPick?String(item.minPick):item.minPick+"–"+item.maxPick}</td>
     <td className="tabular-nums">{item.offerings??0}</td>
     <td className="tabular-nums">{item.students??0}</td>
     <td><StatusBadge tone={item.status==="ACTIVE"?"success":"neutral"}>{legacyAcademicStatus(item.status)}</StatusBadge></td>
     <td><div className="flex flex-wrap gap-3 text-sm font-semibold">
      <TextLink href={link(current,item.id)} className="inline-flex min-h-11 items-center md:min-h-9">Open</TextLink>
      {options?<TextLink href={link(current,item.id)} className="inline-flex min-h-11 items-center md:min-h-9">Edit</TextLink>:null}
      {options&&item.status==="ACTIVE"?<CollegeElectiveLifecycleAction slotId={item.id} name={item.name}
       status={item.status} version={item.version}/>:null}
     </div></td>
    </tr>)}</tbody>
   </Table>:
    <Alert tone="info">{noFilter?
     "No elective slots yet. Create one per program × semester, e.g. Professional Elective 1.":
     "No elective slots match the selected filters. Try another program, status or search term."}</Alert>}
   {data.total>0?<nav aria-label="Elective slot pages" className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
    {current>1?<TextLink href={link(current-1)} className="min-h-11 md:min-h-9">← Previous</TextLink>:<span/>}
    <span>Showing {all.length?(current-1)*data.pageSize+1:0}–{Math.min(current*data.pageSize,data.total)} of {data.total} matching slots · Page {current} of {totalPages}</span>
    {current<totalPages?<TextLink href={link(current+1)} className="min-h-11 md:min-h-9">Next →</TextLink>:<span/>}
   </nav>:null}
  </section>
  {selected?<section id="selected-slot" aria-label={"Selected elective slot "+selected.name}
   className="scroll-mt-20 space-y-4 border-t border-border pt-5">
   <div className="flex flex-wrap items-center justify-between gap-3">
    <div><Heading level={2} size="lg" className="text-heading">{selected.name}</Heading>
     <p className="text-sm text-body">{selected.programName} · Semester {selected.semesterNumber}</p>
    </div>
    <TextLink href={link(current)} className="inline-flex min-h-11 items-center md:min-h-9">Close details</TextLink>
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
      programId:selected.programId,semesterNumber:selected.semesterNumber,
      academicYear:selected.academicYear,...(selected.hasEnrollmentHistory !== undefined ? {hasEnrollmentHistory:selected.hasEnrollmentHistory} : {}),
      credits:selected.credits,minPick:selected.minPick,maxPick:selected.maxPick,status:selected.status,
     }}/>
    </Disclosure>
    {selected.status==="ACTIVE"?<CollegeElectiveOfferingManager slotId={selected.id}/>:null}
   </div>:<Alert tone="warning">Slot editing is not available. Refresh the page and retry.</Alert>}
  </section>:null}
  <TextLink href="/admin/academics" className="inline-flex min-h-11 items-center md:min-h-9">← Academic overview</TextLink>
 </div>;
}
