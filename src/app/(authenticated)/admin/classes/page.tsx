import {Button} from "@/components/ui/button";
import {Select} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import { AcademicSetupSteps } from "@/components/admin/academic-setup-steps";
import Link from "next/link";
import {PageHeader} from "@/components/ui/page-header";
import {DataTable} from "@/components/ui/data-table";
import { getCurrentRequestContext } from "@/auth/request-context";
import { CollegeClassCreate, CollegeClassRowActions } from "@/components/academics/college-section-management";
import { listCollegeClasses } from "@/modules/academics/college-structure-directory-service";
import { listCollegeSectionOptions } from "@/modules/academics/college-section-mutation-service";
import { collegeClassQuerySchema, collegeStructureHref, type CollegeClassQuery } from "@/modules/academics/college-structure-directory-model";

const statuses = ["ALL", "ACTIVE", "ARCHIVED"] as const;
const pageUrl = (query: CollegeClassQuery) => collegeStructureHref("CLASSES", query).replace("/college/classes", "/admin/classes");
type Params = Record<string, string | string[] | undefined>;
export default async function SuperAdminClassesPage({ searchParams }: {
  searchParams: Promise<Params>;
}) {
  const context = await getCurrentRequestContext();
  const raw = await searchParams;
  const selected = context.adminScope?.collegeId;
  const filter = collegeClassQuerySchema.safeParse({
    q: raw.q, programId: raw.programId || undefined, cohortCode: raw.cohortCode || undefined, status: raw.status, page: raw.page, pageSize: raw.pageSize,
  });
  const [data, options] = selected && filter.success
    ? await Promise.all([
        listCollegeClasses(context, filter.data),
        listCollegeSectionOptions(context),
      ])
    : [null, null];
  return <div className="min-w-0 space-y-6">
    <PageHeader eyebrow="Super Admin · Academic Setup" title="Classes"/>
      {data ? <AcademicSetupSteps step={6} /> : null}
    {!selected ? <p role="status" className="text-sm text-body">Select a college to continue. Choose a college in the header above to see its classes.</p> : null}
    {data && options ? <>
      <CollegeClassCreate cohorts={options.cohorts} periods={options.periods} />
      <section aria-label="Filter managed classes" className="border-b border-border pb-4">
        <form method="get" action="/admin/classes" className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-0 w-full md:min-w-44 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
            <Select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 md:min-h-9">
              <option value="">All programs</option>
              {data.programs.map(program => <option key={program.id} value={program.id}>{program.name}</option>)}
            </Select>
          </label>
          <label className="grid min-w-0 w-full md:min-w-40 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch code
            <Input name="cohortCode" defaultValue={data.query.cohortCode ?? ""} placeholder="Search batch code"
              className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid min-w-0 w-full md:min-w-44 flex-1 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search class, program or batch
            <Input name="q" type="search" defaultValue={data.query.q}
              className="min-h-11 md:min-h-9" />
          </label>
          <label className="grid min-w-0 w-full md:min-w-32 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Status
            <Select name="status" defaultValue={data.query.status} className="min-h-11 md:min-h-9">
              {statuses.map(status=><option key={status} value={status}>{status==="ALL"?"All statuses":status}</option>)}
            </Select>
          </label>
          <label className="grid min-w-0 w-full md:min-w-32 gap-1 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Rows per page
            <Select name="pageSize" defaultValue={data.query.pageSize} className="min-h-11 md:min-h-9">
              {[10,25,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </Select>
          </label>
          <Button type="submit" className="min-h-11 md:min-h-9">Filter</Button>
          <Button variant="secondary" type="submit" className="min-h-11 md:min-h-9">Refresh</Button>
          <Link href="/admin/classes" className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear filters</Link>
        </form>
      </section>
      <section aria-label="Manage classes" className="space-y-3 pt-2">
        <h2 className="text-lg font-semibold text-foreground">Manage classes</h2>
        <p className="text-sm text-muted-foreground">Edit class names, codes and capacities within the selected college.</p>
        <DataTable<(typeof data.items)[number]> caption="Manage classes" rows={data.items} getRowKey={row=>row.id}
          empty={<p role="status">No matching classes on this page.</p>}
          columns={[
            {key:"class",header:"Class",mobilePriority:"primary",cell:row=><div className="min-w-0">
              <span className="font-semibold">{row.name} ({row.code})</span>
              <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Manage students →</Link>
              <Link href={`/admin/academics/sections/${encodeURIComponent(row.id)}#section-schedule`} className="mt-1 inline-flex min-h-11 items-center font-semibold text-primary-text underline">Schedule →</Link>
            </div>},
            {key:"program",header:"Program",mobilePriority:"secondary",cell:row=>row.programName},
            {key:"batch",header:"Batch",mobilePriority:"secondary",cell:row=>row.cohortName},
            {key:"description",header:"Description",mobilePriority:"secondary",cell:row=>row.description?.trim()||"—"},
            {key:"students",header:"Students",mobilePriority:"secondary",cell:row=><>
              {row.activeLearners}{row.capacity!==null&&row.activeLearners>=row.capacity?
                <span className="ml-2 rounded border border-border px-2 text-xs font-semibold text-foreground" title="Class is full; learners cannot be moved into it.">Class full</span>:null}
            </>},
            {key:"capacity",header:"Max Students",mobilePriority:"secondary",cell:row=>row.capacity??"—"},
            {key:"actions",header:"Actions",mobilePriority:"action",cell:row=><CollegeClassRowActions row={row}/>},
          ]} />
        <nav aria-label="Class pages" className="flex items-center justify-between gap-3 text-sm">
          <span role="status" aria-live="polite">{data.items.length} of {data.total} results · Page {data.query.page} of {data.totalPages}</span>
          <div className="flex flex-wrap gap-2">
            {data.query.page>1?<Link className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:bg-primary-subtle" href={pageUrl({...data.query,page:data.query.page-1})}>Previous</Link>:null}
            {data.query.page<data.totalPages?<Link className="inline-flex min-h-11 items-center md:min-h-9 rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 font-semibold text-primary-text hover:bg-primary-subtle" href={pageUrl({...data.query,page:data.query.page+1})}>Next</Link>:null}
          </div>
        </nav>
        <Link href="/admin/batch-promotion" className="inline-flex min-h-11 items-center font-semibold text-primary-text">
          Batch Promotion →
        </Link>
      </section>
    </> : null}
  </div>;
}
