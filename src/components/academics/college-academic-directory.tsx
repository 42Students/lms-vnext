import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { CollegeCohortRowActions } from "@/components/academics/college-cohort-management";
import { CollegeSemesterCreateForm, CollegeSemesterRowActions } from "@/components/academics/college-semester-management";
import {
  academicDirectoryHref,
  batchProgressLabel,
} from "@/modules/academics/college-academic-directory-model";
import type {
  listCollegeBatches,
  listCollegeSemesters,
} from "@/modules/academics/college-academic-directory-service";

type DirectoryData =
  | Awaited<ReturnType<typeof listCollegeSemesters>>
  | Awaited<ReturnType<typeof listCollegeBatches>>;

export function CollegeAcademicDirectory({ data, batchPeriods = [] }: {
  data: DirectoryData;
  batchPeriods?: { id: string; name: string; code: string }[];
}) {
  const semesters = data.kind === "SEMESTERS";
  const title = semesters ? "Semesters" : "Batches";
  const path = semesters ? "/college/semesters" : "/college/batches";
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        actions={
          <Link href="/college/academics"
            className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 text-sm font-semibold text-[var(--lms-link-text)]">
            Academic workspace
          </Link>
        }
      />
      {data.kind === "SEMESTERS" ? <CollegeSemesterCreateForm programs={data.programs} /> : null}
      <section aria-label={title + " filters"} className="border-t border-border pt-4">
        <form action={path} method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold text-body">
            {semesters ? "Semester or program" : "Batch or program"}
            <Input name="q" type="search" maxLength={100} defaultValue={data.query.q}
              placeholder="Search name or code"
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Program
            <Select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              <option value="">All programs</option>
              {data.programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
              <option value="ALL">All statuses</option>
              {semesters ? (
                <>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </>
              ) : (
                <>
                  <option value="PLANNED">Planned</option>
                  <option value="ACTIVE">Active</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </>
              )}
            </Select>
          </label>
          <details className="col-span-full rounded-[var(--lms-control-radius)] border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold text-body">More filters</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Recorded current term
              <Input type="number" name="currentTerm" min={1} max={24} step={1}
                defaultValue={data.query.currentTerm??""} placeholder="All progression terms"
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Progression record
              <Select name="progression" defaultValue={data.query.progression}
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="RECORDED">Progression recorded</option>
                <option value="MISSING">No progression record</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Recorded academic year (start)
              <Input name="yearStart" type="number" min={1900} max={9998} step={1}
                defaultValue={data.query.yearStart ?? ""} placeholder="All academic years"
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Minimum configured credits
              <Input type="number" name="minimumCredits" min={0} max={500} step={1}
                defaultValue={data.query.minimumCredits??""} placeholder="All credit totals"
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Maximum configured credits
              <Input type="number" name="maximumCredits" min={0} max={500} step={1}
                defaultValue={data.query.maximumCredits ?? ""} placeholder="All credit totals"
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Semester number
              <Input type="number" name="termNumber" min={1} max={24} step={1}
                defaultValue={data.query.termNumber ?? ""} placeholder="All semesters"
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Credits availability
              <Select name="creditState" defaultValue={data.query.creditState ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All terms</option>
                <option value="CONFIGURED">Credits configured</option>
                <option value="UNSET">No configured credits</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Program status
              <Select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active programs</option>
                <option value="ARCHIVED">Archived programs</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Course mapping
              <Select name="mappingState" defaultValue={data.query.mappingState ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All terms</option>
                <option value="MAPPED">Has mapped courses</option>
                <option value="UNMAPPED">No mapped courses</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Expected end period
              <Select name="expectedEndState" defaultValue={data.query.expectedEndState ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="SET">End period recorded</option>
                <option value="UNSET">No end period recorded</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Academic year
              <Select name="academicYearState" defaultValue={data.query.academicYearState ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="RECORDED">Year recorded</option>
                <option value="UNRECORDED">No recorded year</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Program status
              <Select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All parent programs</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Batch start on or after
              <Input type="date" name="startOnOrAfter" defaultValue={data.query.startOnOrAfter ?? ""}
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Batch start on or before
              <Input type="date" name="startOnOrBefore" defaultValue={data.query.startOnOrBefore ?? ""}
                className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Classes
              <Select name="activeClassState" defaultValue={data.query.activeClassState ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="HAS_ACTIVE">Has active classes</option>
                <option value="NONE_ACTIVE">No active classes</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Students
              <Select name="activeLearnerState" defaultValue={data.query.activeLearnerState ?? "ALL"} className="min-h-[var(--lms-control-height)] rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="HAS_ACTIVE">Has active learner enrollments</option>
                <option value="NONE_ACTIVE">No active learner enrollments</option>
              </Select>
            </label>
          ) : null}
            </div>
          </details>
          <div className="flex items-end gap-2">
            <Button variant="primary" type="submit" >
              Filter
            </Button>
            <Link href={path} className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section aria-label={title + " results"} role="region" tabIndex={0} className="max-w-full overflow-x-auto rounded-[var(--lms-control-radius)] border border-border bg-surface">
        <p className="px-4 pt-3 text-xs text-muted-foreground sm:hidden">Scroll sideways to view all semester or batch columns.</p>
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {data.total} matching {semesters ? "program terms" : "cohorts"}
        </p>
        {data.items.length === 0 ? (
          <div role="status" className="space-y-2 p-6 text-sm text-body">
           <p>
            {data.total === 0
              ? semesters
                ? "No semesters match these filters."
                : "No cohorts match these filters. Batch membership or progression is not inferred from other records."
              : "No records exist on this page. Select an earlier page."}
           </p>
           <Link href={path} className="inline-flex min-h-[var(--lms-control-height)] items-center font-semibold text-[var(--lms-link-text)]">Clear filters and view all {title.toLowerCase()}</Link>
          </div>
        ) : (
          <>{data.kind === "SEMESTERS" ? (
            <DataTable
              caption="Semester directory"
              rows={data.items}
              getRowKey={item=>item.id}
              empty={<p>No semesters match these filters.</p>}
              columns={[
                {key:"semester",header:"Semester",mobilePriority:"primary",cell:item=><>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Semester {item.termNumber}</p>
                </>},
                {key:"program",header:"Program",mobilePriority:"secondary",cell:item=>
                  <span>{item.programName} ({item.programCode})</span>},
                {key:"credits",header:"Credits",mobilePriority:"secondary",cell:item=>item.mappedCredits??0},
                {key:"courses",header:"Mapped courses",mobilePriority:"secondary",cell:item=>item.mappedCourses},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
                  item.isActive ? "Active" : "Inactive"},
                {key:"actions",header:"Actions",mobilePriority:"action",cell:item=>
                  <CollegeSemesterRowActions row={item}/>},
              ]}
            />
          ) : (
            <DataTable
              caption="Batch directory"
              rows={data.items}
              getRowKey={item=>item.id}
              empty={<p>No batches match these filters.</p>}
              columns={[
                {key:"batch",header:"Batch",mobilePriority:"primary",cell:item=><>
                  <p className="font-semibold text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.code}</p>
                </>},
                {key:"program",header:"Program",mobilePriority:"secondary",cell:item=>
                  <span>{item.programName} ({item.programCode})</span>},
                {key:"years",header:"Years",mobilePriority:"secondary",cell:item=><>
                  <p>Start Date: {item.startDate}</p>
                  <p>End Date: {item.endDate ?? "Not set"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{item.startPeriodName}</p>
                </>},
                {key:"year",header:"Academic Year",mobilePriority:"secondary",cell:item=>
                  item.academicYear??(item.currentAcademicYearStart !== null
                    ? String(item.currentAcademicYearStart)+"-"+String((item.currentAcademicYearStart+1)%100).padStart(2,"0")
                    : "Not recorded")},
                {key:"semester",header:"Current Semester",mobilePriority:"secondary",cell:item=>
                  batchProgressLabel(item.currentTermNumber === null ? null : {
                    currentTermNumber:item.currentTermNumber,
                    currentAcademicYearStart:item.currentAcademicYearStart,
                  })},
                {key:"population",header:"Active classes / learners",mobilePriority:"secondary",cell:item=>
                  <span>{item.activeSections} classes / {item.activeEnrolledLearners} learners</span>},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
                  item.inactiveAt?"Inactive":item.status},
                {key:"actions",header:"Actions",mobilePriority:"action",cell:item=>
                  <div className="flex flex-wrap gap-2">
                    <Link href={"/college/batches/"+encodeURIComponent(item.id)+"/students"}
                      className="inline-flex min-h-[var(--lms-control-height)] items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-3 text-sm font-semibold text-[var(--lms-link-text)]">
                      Students
                    </Link>
                    <CollegeCohortRowActions row={item} periods={batchPeriods}/>
                  </div>},
              ]}
            />
          )}</>
        )}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
        <div className="flex gap-2">
          {data.query.page > 1 ? (
            <Link href={academicDirectoryHref(data.kind, { ...data.query, page: data.query.page - 1 })}
              className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 py-2 font-semibold text-[var(--lms-link-text)]">
              Previous
            </Link>
          ) : null}
          {data.query.page < data.totalPages ? (
            <Link href={academicDirectoryHref(data.kind, { ...data.query, page: data.query.page + 1 })}
              className="rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] px-4 py-2 font-semibold text-[var(--lms-link-text)]">
              Next
            </Link>
          ) : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        {semesters
          ? "Mapped course counts include registered curriculum mappings within this college only. Deletion is denied when mappings or non-archived batches exist; editing never changes the assigned program or semester number."
          : "Learner counts include currently active program enrollments with active college membership; class counts include active sections. Manage each batch’s students and recorded progression using the available actions."}
 
      </p>
    </div>
  );
}
