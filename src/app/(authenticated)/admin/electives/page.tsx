import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import Link from "next/link";
import { legacyAcademicStatus } from "@/modules/academics/legacy-academic-status";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import { CollegeElectiveOfferingManager } from "@/components/electives/college-elective-offering-manager";
import { CollegeElectiveLifecycleAction } from "@/components/electives/college-elective-lifecycle-action";
import { listCollegeElectiveSlotOptions } from "@/modules/electives/college-slot-mutation-service";
import { getCurrentRequestContext } from "@/auth/request-context";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/ui/error-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
import { adminElectiveQuerySchema } from "@/modules/electives/admin-directory-model";
import { listSuperAdminElectives } from "@/modules/electives/admin-directory-service";

export default async function SuperAdminElectivesPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const parsed = adminElectiveQuerySchema.safeParse({ q: params.q, status: params.status,
    programId: params.programId || undefined, semesterNumber: params.semesterNumber || undefined,
    page:params.page||undefined,pageSize:params.pageSize||undefined });
  if (!parsed.success) return <div className="min-w-0 space-y-4">
    <PageHeader title="Electives" />
    <ErrorState title="Invalid elective filters" description="Search and status must use supported values."
      action={<Link href="/admin/electives" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Clear filters</Link>} />
  </div>;
  const context = await getCurrentRequestContext();
  const [data, optionsRead] = await Promise.all([
    listSuperAdminElectives(context, parsed.data),
    (context.adminScope?.collegeId ? listCollegeElectiveSlotOptions(context) : Promise.resolve(null))
      .then(value=>({ok:true as const,value}))
      .catch(()=>({ok:false as const,value:null})),
  ]);
  const options=optionsRead.value;
  return <div className="min-w-0 space-y-5">
    <PageHeader title="Electives"
      description="Manage elective slots and their offerings for this college." />
    {data.state === "CHOOSE_COLLEGE" ? <EmptyState title="Select a college to continue"
      description="Choose a college in the header above to see its electives." /> :
    <>
      {!optionsRead.ok ? <ErrorState title="Elective editor options unavailable"
        description="Some program, course, faculty, class or batch lookup options could not be loaded. The slot directory remains available; retry before editing."
        action={<Link href="/admin/electives" className="font-semibold text-primary-text underline">Retry lookups</Link>} /> : null}
      {options ? <CollegeSlotManager options={options} /> : null}
      <form aria-label="Filter elective slots" className="grid min-w-0 gap-[8px] border-b border-border pb-4 sm:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search
          <Input name="q" defaultValue={data.query.q} placeholder="Slot or program"
            className="min-h-11 md:min-h-9" />
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
          <Select name="status" defaultValue={data.query.status}
            className="min-h-11 md:min-h-9">
            <option value="ACTIVE">Active</option><option value="ARCHIVED">Archived</option><option value="ALL">All</option>
          </Select>
        </label>
        <Disclosure title="More filters" className="min-w-0 sm:col-span-2 xl:col-span-1" contentClassName="grid min-w-0 gap-3 pb-3 pt-2 sm:grid-cols-2 xl:grid-cols-1">
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Select name="programId" defaultValue={data.query.programId ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All programs</option>
            {data.programs.map(program=><option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
        </label>
        <label className="grid gap-[6px] text-[var(--lms-font-sm)] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester
          <Select name="semesterNumber" defaultValue={data.query.semesterNumber ?? ""}
            className="min-h-11 md:min-h-9">
            <option value="">All semesters</option>
            {Array.from({length:12},(_,i)=>i+1).map(n=><option key={n} value={n}>{n}</option>)}
          </Select>
        </label>
        </Disclosure>
        <label className="grid gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Per page
          <Select name="pageSize" defaultValue={String(data.query.pageSize)}>
            <option value="20">20</option><option value="50">50</option><option value="100">100</option>
          </Select>
        </label>
        <Button type="submit" className="min-h-11 w-full justify-center self-end sm:w-auto md:min-h-9">Filter</Button>
      </form>
      <form method="get" action="/admin/electives" aria-label="Refresh elective directory">
        {data.query.q ? <Input type="hidden" name="q" value={data.query.q} /> : null}
        <Input type="hidden" name="status" value={data.query.status} />
        {data.query.programId?<Input type="hidden" name="programId" value={data.query.programId}/>:null}
        {data.query.semesterNumber?<Input type="hidden" name="semesterNumber" value={data.query.semesterNumber}/>:null}
        <Input type="hidden" name="pageSize" value={String(data.query.pageSize)} />
        <Button variant="secondary" type="submit" className="inline-flex min-h-11 md:min-h-9 items-center px-4">Refresh</Button>
      </form>
      <p role="status" aria-live="polite" className="text-xs text-muted-foreground">
        {data.total} matching slots · {data.items.length} on this page · {data.active} active · {data.archived} archived
      </p>
      <DataTable caption="Elective slots" rows={data.items} getRowKey={item=>item.id}
        empty={<EmptyState title="No elective slots" description="No persisted elective slots match the current college and filters." />}
        columns={[
          {key:"slot",header:"Slot",mobilePriority:"primary",cell:item=>
            <Disclosure title={item.name} className="min-w-0" contentClassName="space-y-2 pb-2 pt-2">
              <p className="text-sm text-body">{item.description??"No description recorded."}</p>
              <p className="text-xs text-muted-foreground">Minimum {item.minPick}; maximum {item.maxPick} picks</p>
            </Disclosure>},
          {key:"program",header:"Program",mobilePriority:"secondary",cell:item=>item.programName},
          {key:"semester",header:"Sem",mobilePriority:"secondary",cell:item=>item.semesterNumber},
          {key:"year",header:"Year",mobilePriority:"secondary",cell:item=>item.academicYear??"—"},
          {key:"credits",header:"Credits",mobilePriority:"secondary",cell:item=>item.credits},
          {key:"pick",header:"Pick",mobilePriority:"secondary",cell:item=>item.minPick+"–"+item.maxPick},
          {key:"offerings",header:"Offerings",mobilePriority:"secondary",cell:item=>item.offerings??0},
          {key:"students",header:"Students",mobilePriority:"secondary",cell:item=>item.students??0},
          {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
            <StatusBadge tone={item.status==="ACTIVE"?"success":"neutral"}>{legacyAcademicStatus(item.status)}</StatusBadge>},
          {key:"actions",header:"Actions",mobilePriority:"action",cell:item=>options?
            <Disclosure title="Manage" className="min-w-0" contentClassName="space-y-3 py-2">
              <CollegeSlotManager options={options} row={{
                id:item.id,name:item.name,description:item.description??null,
                version:item.version,credits:item.credits,minPick:item.minPick,
                maxPick:item.maxPick,status:item.status,
                programId:item.programId,academicPeriodId:item.academicPeriodId,
                semesterNumber:item.semesterNumber,academicYear:item.academicYear,
                hasEnrollmentHistory:item.hasEnrollmentHistory,
              }}/>
              <CollegeElectiveLifecycleAction slotId={item.id} name={item.name}
                status={item.status} version={item.version}/>
              {item.status==="ACTIVE"?<CollegeElectiveOfferingManager slotId={item.id}/>:null}
            </Disclosure>:<span className="text-muted-foreground">Read only</span>},
        ]}/>
      <Pagination label="Elective slot pages" page={data.query.page} pageCount={data.totalPages}
        hrefForPage={page=>"/admin/electives?"+new URLSearchParams({
          ...(data.query.q?{q:data.query.q}:{}),
          status:data.query.status,
          ...(data.query.programId?{programId:data.query.programId}:{}),
          ...(data.query.semesterNumber?{semesterNumber:String(data.query.semesterNumber)}:{}),
          page:String(page),pageSize:String(data.query.pageSize),
        }).toString()}/>
      <p className="text-xs text-muted-foreground">Results are paged across the full scoped catalogue, including archived slots when selected.</p>
    </>}
    <Link href="/admin/academics" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">← Academic overview</Link>
  </div>;
}
