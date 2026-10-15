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
        eyebrow="College Admin · Academic Setup"
        title={title}
        description={semesters
          ? "Manage registered program terms with semester names, credit totals, status and dependency-guarded deletion."
          : "Create or edit planned batches and review recorded academic progression and active class/enrollment counts."}
        actions={
          <Link href="/college/academics"
            className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
            Academic workspace
          </Link>
        }
      />
      {data.kind === "SEMESTERS" ? <CollegeSemesterCreateForm programs={data.programs} /> : null}
      <section aria-label={title + " filters"} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form action={path} method="get" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <label className="grid gap-1 text-sm font-semibold text-body">Semester parent program lifecycle
              <select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active programs</option>
                <option value="ARCHIVED">Archived programs</option>
              </select>
            </label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Semester curriculum mapping presence
              <select name="mappingState" defaultValue={data.query.mappingState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All terms</option>
                <option value="MAPPED">Has mapped courses</option>
                <option value="UNMAPPED">No mapped courses</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Batch planned end period evidence
              <select name="expectedEndState" defaultValue={data.query.expectedEndState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="SET">End period recorded</option>
                <option value="UNSET">No end period recorded</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Batch recorded academic year evidence
              <select name="academicYearState" defaultValue={data.query.academicYearState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="RECORDED">Year recorded</option>
                <option value="UNRECORDED">No recorded year</option>
              </select>
            </label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Parent program lifecycle
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

      <section aria-label={title + " results"} className="overflow-x-auto rounded-xl border border-border bg-surface">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {data.total} matching {semesters ? "program terms" : "cohorts"}
        </p>
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? semesters
                ? "No program terms match these filters. An academic period is not substituted for an unconfigured semester."
                : "No cohorts match these filters. Batch membership or progression is not inferred from other records."
              : "No records exist on this page. Select an earlier page."}
          </p>
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
                  <th scope="col" className="px-4 py-3">Start period</th>
                  <th scope="col" className="px-4 py-3">Progression</th>
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
                      {item.totalCredits === null ? "Not configured" : item.totalCredits}
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
                      {item.startPeriodName}
                      <p className="mt-1 text-xs text-muted-foreground">Starts {item.startDate}</p>
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
                    <td className="px-4 py-4 text-body">{item.status}</td>
                    <td className="px-4 py-4"><CollegeCohortRowActions row={item} periods={batchPeriods} /></td>
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
          : "Learner counts include currently active program enrollments with active college membership; class counts include active sections. No graduation, promotion preview, derived batch end date or student move is implied."}
        Exact legacy workflows, browser checks and disposable-PostgreSQL execution remain open.
      </p>
    </div>
  );
}
