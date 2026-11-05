import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable} from "@/components/ui/data-table";
import {Tabs} from "@/components/ui/tabs";
import {Disclosure} from "@/components/ui/disclosure";
import {EmptyState} from "@/components/ui/empty-state";
import {ErrorState} from "@/components/ui/error-state";
import {Alert} from "@/components/ui/alert";
import {StatusBadge} from "@/components/ui/status-badge";
import { legacyAcademicStatus } from "@/modules/academics/legacy-academic-status";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeCohortCreateForm, CollegeCohortRowActions } from "@/components/academics/college-cohort-management";
import { listCollegeBatches } from "@/modules/academics/college-academic-directory-service";
import { listAcademicPeriods } from "@/modules/academics/period-service";
import { collegeBatchDirectorySchema, academicDirectoryHref } from "@/modules/academics/college-academic-directory-model";
import { Heading } from "@/components/ui/heading";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { ButtonLink } from "@/components/ui/button-link";
import { istDateFormatter } from "@/lib/format-date";
import { formatNumberIN } from "@/lib/safe-format";

const statuses = ["ALL", "ACTIVE", "INACTIVE", "COMPLETED", "PLANNED", "ARCHIVED"] as const;
const pageUrl = (query: Parameters<typeof academicDirectoryHref>[1]) => academicDirectoryHref("BATCHES", query).replace("/college/batches", "/admin/batches");
type Params = Record<string, string | string[] | undefined>;
export default async function SuperAdminBatchesPage({ searchParams }: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  const raw = await searchParams;
  const selected = context.adminScope?.collegeId;
  const controls = collegeBatchDirectorySchema.safeParse({
    q: raw.q, programId: raw.programId || undefined, status: raw.status, page: raw.page, pageSize: raw.pageSize ?? "25",
  });
  const data = selected && controls.success
    ? await listCollegeBatches(context, controls.data).catch(()=>null)
    : null;
  const periodRows = selected && data
    ? await listAcademicPeriods(context, selected).catch(()=>[])
    : [];
  const periods = periodRows.filter(row => row.status !== "CLOSED")
    .map(row => ({ id: row.id, name: row.name, code: row.code, startDate:row.startDate, endDate:row.endDate }));
  const exportQuery=new URLSearchParams();
  // Server export ignores arbitrary page/college overrides and rechecks
  // selected scope; keep the page's verified filters.
  if(data?.query.q)exportQuery.set("q",data.query.q);
  if(data?.query.programId)exportQuery.set("programId",data.query.programId);
  if(data?.query.status&&data.query.status!=="ALL")exportQuery.set("status",data.query.status);
  const exportHref="/api/admin/batches/export"+(exportQuery.size?"?"+exportQuery.toString():"");
  return <div className="min-w-0 space-y-4 md:space-y-6">
    <PageHeader title="Batches" description="Manage cohorts, their academic year and current semester before creating sections or promoting students."/>
      {data ? <AcademicSetupSteps step={5} /> : null}
    {!selected ? <Alert tone="warning"><span className="font-semibold">Select a college to manage Batches</span><p>Batches belong to a specific college. Choose one in the header.</p></Alert> : null}
    {selected&&!controls.success?<ErrorState title="Invalid batch filters" description="Choose a valid program, status, page and page size." action={<TextLink href="/admin/batches">Clear filters</TextLink>}/>:null}
    {selected&&controls.success&&!data?<ErrorState title="Could not load batches" description="The batch directory could not refresh. No records were changed." action={<TextLink href="/admin/batches">Retry</TextLink>}/>:null}
    {data ? <>
      <Tabs ariaLabel="Batch lifecycle views" value={data.query.status} renderPanel={false} items={([
        ["ALL","All batches"],["ACTIVE","Active batches"],["INACTIVE","Show inactive"],["COMPLETED","Show completed"],
      ] as const).map(([value,label])=>({value,label,href:pageUrl({...data.query,status:value,page:1})}))}/>
      <div className="grid min-w-0 items-start gap-[var(--lms-space-4)] lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
       <div className="min-w-0">
      <CollegeCohortCreateForm programs={data.programs.filter(row => row.status === "ACTIVE")} periods={periods} academicSetupHref="/admin/academics" />
       </div>
       <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <section aria-label="Filter managed batches" className="border-b border-border pb-4">
        <form action="/admin/batches" method="get" role="search" aria-label="Batch filters" className="grid min-w-0 items-end gap-[8px] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto]">
          <Label stack className="min-w-0 w-full">
            Program
            <Select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 md:min-h-9">
              <option value="">All programs</option>
              {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </Select>
          </Label>
          <Label stack className="min-w-0 w-full">
            Search batches
            <Input type="search" name="q" defaultValue={data.query.q}
              placeholder="Search batch, year, program or status"
              className="min-h-11 md:min-h-9"/>
          </Label>
          <Disclosure title="More filters" defaultOpen={data.query.status!=="ALL" || data.query.pageSize!==25}
            className="order-last min-w-0 md:col-span-4" contentClassName="grid min-w-0 gap-[var(--lms-space-3)] pb-[var(--lms-space-3)] md:grid-cols-2">
          <Label stack className="min-w-0 w-full md:min-w-36">
            Status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 md:min-h-9">
              {statuses.map(status => <option key={status} value={status}>{status === "INACTIVE" ? "Inactive (planned / archived)" : legacyAcademicStatus(status, true)}</option>)}
            </Select>
          </Label>
          <Label stack className="min-w-0 w-full md:min-w-32">Rows per page
            <Select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 md:min-h-9">
              {[10,25,50,100].map(n=><option value={n} key={n}>{n}</option>)}
            </Select>
          </Label>
          </Disclosure>
          <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Filter</Button>
          <Button variant="secondary" type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto">Refresh</Button>
          {data.query.q||data.query.programId||data.query.status!=="ALL"||data.query.pageSize!==25?<TextLink href="/admin/batches" className="inline-flex min-h-11 items-center justify-center md:min-h-9">Clear filters</TextLink>:null}
        </form>
      </section>

      <section aria-label="Manage batches" className="min-w-0 space-y-[var(--lms-space-3)] pt-[var(--lms-space-2)]">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <Heading level={2} className="text-[var(--lms-heading)] text-[var(--lms-font-lg)] leading-[26px] md:text-[var(--lms-font-xl)] md:leading-[28px]">Existing Batches</Heading>
          <ButtonLink variant="secondary" href={exportHref}>
            Export batches.csv
          </ButtonLink>
        </div>
        <p className="text-xs text-muted-foreground">
          Exports matching selected-college batches across pages, up to 1,000 rows.
          The CSV includes an explicit truncated notice when additional records remain.
        </p>
        <p className="text-sm text-muted-foreground">Only planned batches without dependents can be edited or removed.</p>
        <DataTable<(typeof data.items)[number]> caption="Manage batches" rows={data.items} getRowKey={row=>row.id}
          empty={<EmptyState title={data.query.q||data.query.programId||data.query.status!=="ALL"?"No batches match the search or filters.":"No batches yet. Create a program first."} />}
          columns={[
            {key:"batch",header:"Batch",mobilePriority:"primary",cell:row=><div className="min-w-0">
              <span className="font-semibold">{row.name} ({row.code})</span>
              <TextLink href={`/admin/batches/${encodeURIComponent(row.id)}/students`} aria-label={`Manage students in ${row.name}`} className="mt-1 inline-flex min-h-11 items-center md:min-h-9">Manage students →</TextLink>
            </div>},
            {key:"program",header:"Program",mobilePriority:"secondary",cell:row=>row.programName},
            {key:"years",header:"Years",mobilePriority:"secondary",cell:row=>row.startDate||row.endDate?`${row.startDate?.slice(0,4)??"?"} – ${row.endDate?.slice(0,4)??"?"}`:"—"},
            {key:"academicYear",header:"Academic Year",mobilePriority:"secondary",cell:row=>row.academicYear??(row.currentAcademicYearStart?`${row.currentAcademicYearStart}–${row.currentAcademicYearStart+1}`:"Not recorded")},
            {key:"semester",header:"Current Semester",mobilePriority:"secondary",cell:row=><StatusBadge tone="info">Semester {row.currentTermNumber??1}</StatusBadge>},
            {key:"classes",header:"Classes",mobilePriority:"secondary",cell:row=>row.activeSections},
            {key:"students",header:"Students",mobilePriority:"secondary",cell:row=>row.activeEnrolledLearners},
            {key:"status",header:"Status",mobilePriority:"secondary",cell:row=><>
              <StatusBadge tone={row.status==="ACTIVE"?"success":row.status==="PLANNED"?"info":"neutral"}>{legacyAcademicStatus(row.status,true)}</StatusBadge>
              {row.inactiveAt?<span className="block text-xs text-muted-foreground">Inactive since {istDateFormatter.format(new Date(row.inactiveAt))}</span>:null}
            </>},
            {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><CollegeCohortRowActions row={row} periods={periods}/>},
          ]} />
        <nav aria-label="Batch pages" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <span role="status" aria-live="polite">{data.total===0?0:(data.query.page-1)*data.query.pageSize+1}-{Math.min(data.total,data.query.page*data.query.pageSize)} of {formatNumberIN(data.total)} · Page {data.query.page} of {data.totalPages}</span>
          <div className="flex flex-wrap gap-2">
            {data.query.page>1?<ButtonLink variant="secondary" href={pageUrl({...data.query,page:data.query.page-1})}>Previous</ButtonLink>:null}
            {data.query.page<data.totalPages?<ButtonLink variant="secondary" href={pageUrl({...data.query,page:data.query.page+1})}>Next</ButtonLink>:null}
          </div>
        </nav>
        <TextLink href="/admin/batch-promotion" className="inline-flex min-h-11 items-center md:min-h-9">
          Batch Promotion →
        </TextLink>
      </section>
       </div>
      </div>
    </> : null}
  </div>;
}
