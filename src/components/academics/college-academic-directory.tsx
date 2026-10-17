import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
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
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Academic workspace
          </Link>
        }
      />
      {data.kind === "SEMESTERS" ? <CollegeSemesterCreateForm programs={data.programs} /> : null}
      <section aria-label={title + " filters"} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form action={path} method="get" className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold text-body">
            {semesters ? "Semester or program" : "Batch or program"}
            <input name="q" type="search" maxLength={100} defaultValue={data.query.q}
              placeholder="Search name or code"
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Program
            <select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All programs</option>
              {data.programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Status
            <select name="status" defaultValue={data.query.status}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
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
            </select>
          </label>
          <details className="col-span-full rounded-md border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold text-body">More filters</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Recorded current term
              <input type="number" name="currentTerm" min={1} max={24} step={1}
                defaultValue={data.query.currentTerm??""} placeholder="All progression terms"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Progression record
              <select name="progression" defaultValue={data.query.progression}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="RECORDED">Progression recorded</option>
                <option value="MISSING">No progression record</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Recorded academic year (start)
              <input name="yearStart" type="number" min={1900} max={9998} step={1}
                defaultValue={data.query.yearStart ?? ""} placeholder="All academic years"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Minimum configured credits
              <input type="number" name="minimumCredits" min={0} max={500} step={1}
                defaultValue={data.query.minimumCredits??""} placeholder="All credit totals"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Maximum configured credits
              <input type="number" name="maximumCredits" min={0} max={500} step={1}
                defaultValue={data.query.maximumCredits ?? ""} placeholder="All credit totals"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Semester number
              <input type="number" name="termNumber" min={1} max={24} step={1}
                defaultValue={data.query.termNumber ?? ""} placeholder="All semesters"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Credits availability
              <select name="creditState" defaultValue={data.query.creditState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All terms</option>
                <option value="CONFIGURED">Credits configured</option>
                <option value="UNSET">No configured credits</option>
              </select>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Program status
              <select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active programs</option>
                <option value="ARCHIVED">Archived programs</option>
              </select>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Course mapping
              <select name="mappingState" defaultValue={data.query.mappingState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All terms</option>
                <option value="MAPPED">Has mapped courses</option>
                <option value="UNMAPPED">No mapped courses</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Expected end period
              <select name="expectedEndState" defaultValue={data.query.expectedEndState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="SET">End period recorded</option>
                <option value="UNSET">No end period recorded</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Academic year
              <select name="academicYearState" defaultValue={data.query.academicYearState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="RECORDED">Year recorded</option>
                <option value="UNRECORDED">No recorded year</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Program status
              <select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All parent programs</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Batch start on or after
              <input type="date" name="startOnOrAfter" defaultValue={data.query.startOnOrAfter ?? ""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Batch start on or before
              <input type="date" name="startOnOrBefore" defaultValue={data.query.startOnOrBefore ?? ""}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Classes
              <select name="activeClassState" defaultValue={data.query.activeClassState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="HAS_ACTIVE">Has active classes</option>
                <option value="NONE_ACTIVE">No active classes</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Students
              <select name="activeLearnerState" defaultValue={data.query.activeLearnerState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="HAS_ACTIVE">Has active learner enrollments</option>
                <option value="NONE_ACTIVE">No active learner enrollments</option>
              </select>
            </label>
          ) : null}
            </div>
          </details>
          <div className="flex items-end gap-2">
            <button type="submit" className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
              Filter
            </button>
            <Link href={path} className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Clear
            </Link>
          </div>
        </form>
      </section>

      <section aria-label={title + " results"} role="region" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
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
           <Link href={path} className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear filters and view all {title.toLowerCase()}</Link>
          </div>
        ) : (
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead className="bg-muted text-muted-foreground">
              {data.kind === "SEMESTERS" ? (
                <tr>
                  <th scope="col" className="px-4 py-3">Semester</th>
                  <th scope="col" className="px-4 py-3">Program</th>
                  <th scope="col" className="px-4 py-3">Credits</th>
                  <th scope="col" className="px-4 py-3">Mapped courses</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              ) : (
                <tr>
                  <th scope="col" className="px-4 py-3">Batch</th>
                  <th scope="col" className="px-4 py-3">Program</th>
                  <th scope="col" className="px-4 py-3">Years</th>
                  <th scope="col" className="px-4 py-3">Academic Year</th>
                  <th scope="col" className="px-4 py-3">Current Semester</th>
                  <th scope="col" className="px-4 py-3">Active classes / learners</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              )}
            </thead>
            <tbody>
              {data.kind === "SEMESTERS"
                ? data.items.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Semester {item.termNumber}</p>
                    </td>
                    <td className="px-4 py-4 text-body">{item.programName} ({item.programCode})</td>
                    <td className="px-4 py-4 text-body">
                      {item.mappedCredits ?? 0}
                    </td>
                    <td className="px-4 py-4 text-body">{item.mappedCourses}</td>
                    <td className="px-4 py-4 text-body">{item.isActive ? "Active" : "Inactive"}</td>
                    <td className="px-4 py-4"><CollegeSemesterRowActions row={item} /></td>
                  </tr>
                ))
                : data.items.map((item) => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-4 py-4">
                      <p className="font-semibold text-foreground">{item.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.code}</p>
                    </td>
                    <td className="px-4 py-4 text-body">{item.programName} ({item.programCode})</td>
                    <td className="px-4 py-4 text-body">
                      <p>Start Date: {item.startDate}</p>
                      <p>End Date: {item.endDate ?? "Not set"}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{item.startPeriodName}</p>
                    </td>
                    <td className="px-4 py-4 text-body">
                      {item.academicYear??(item.currentAcademicYearStart !== null
                        ? `${item.currentAcademicYearStart}-${String((item.currentAcademicYearStart + 1) % 100).padStart(2, "0")}`
                        : "Not recorded")}
                    </td>
                    <td className="px-4 py-4 text-body">
                      {batchProgressLabel(item.currentTermNumber === null ? null : {
                        currentTermNumber: item.currentTermNumber,
                        currentAcademicYearStart: item.currentAcademicYearStart,
                      })}
                    </td>
                    <td className="px-4 py-4 text-body">
                      {item.activeSections} classes / {item.activeEnrolledLearners} learners
                    </td>
                    <td className="px-4 py-4 text-body">{item.inactiveAt?"Inactive":item.status}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link href={"/college/batches/" + encodeURIComponent(item.id) + "/students"}
                          className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">
                          Students
                        </Link>
                        <CollegeCohortRowActions row={item} periods={batchPeriods} />
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</span>
        <div className="flex gap-2">
          {data.query.page > 1 ? (
            <Link href={academicDirectoryHref(data.kind, { ...data.query, page: data.query.page - 1 })}
              className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">
              Previous
            </Link>
          ) : null}
          {data.query.page < data.totalPages ? (
            <Link href={academicDirectoryHref(data.kind, { ...data.query, page: data.query.page + 1 })}
              className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">
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
