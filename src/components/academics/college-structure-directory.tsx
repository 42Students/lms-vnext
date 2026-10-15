import Link from "next/link";
import { CollegeClassRowActions } from "@/components/academics/college-section-management";
import { CollegeSectionLifecycleAction } from "@/components/academics/college-section-lifecycle-action";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import { CollegeElectiveLifecycleAction } from "@/components/electives/college-elective-lifecycle-action";
import { PageHeader } from "@/components/ui/page-header";
import {
  classCapacityLabel,
  collegeStructureHref,
  electiveSelectionLabel,
} from "@/modules/academics/college-structure-directory-model";
import type {
  listCollegeClasses,
  listCollegeElectives,
} from "@/modules/academics/college-structure-directory-service";

type DirectoryData =
  | Awaited<ReturnType<typeof listCollegeClasses>>
  | Awaited<ReturnType<typeof listCollegeElectives>>;

export function CollegeStructureDirectory({ data, electiveOptions }: {
  data: DirectoryData;
  electiveOptions?: {
    programs: { id: string; name: string; durationTerms: number }[];
    periods: { id: string; name: string }[];
  };
}) {
  const classes = data.kind === "CLASSES";
  const title = classes ? "Classes" : "Electives";
  const path = classes ? "/college/classes" : "/college/electives";
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="College Admin · Academic Setup"
        title={title}
        description={classes
          ? "Read-only college classes with program, batch, term and recorded active learner enrollments."
          : "Registered elective slots with guarded creation, editing, choice constraints and active course offerings."}
        actions={<Link href="/college/academics"
          className="inline-flex min-h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
          Academic workspace
        </Link>}
      />
      <section aria-label={title + " filters"} className="rounded-xl border border-border bg-surface p-4 sm:p-5">
        <form method="get" action={path} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-1 text-sm font-semibold text-body">
            {classes ? "Class, batch or program" : "Elective or program"}
            <input type="search" name="q" maxLength={100} defaultValue={data.query.q}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"
              placeholder="Search registered records" />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-body">
            Program
            <select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
              <option value="">All programs</option>
              {data.programs.map(program => (
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
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All</option>
            </select>
          </label>
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Minimum slot credits
              <input name="minimumCredits" type="number" min={1} max={500} step={1}
                defaultValue={data.query.minimumCredits??""} placeholder="Any credits"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Maximum slot credits
              <input name="maximumCredits" type="number" min={1} max={500} step={1}
                defaultValue={data.query.maximumCredits ?? ""} placeholder="No upper bound"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Semester number
              <input name="semesterNumber" type="number" min={1} max={24} step={1}
                defaultValue={data.query.semesterNumber ?? ""} placeholder="All semesters"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Capacity configuration
              <select name="capacityState" defaultValue={data.query.capacityState}
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any configuration</option>
                <option value="CONFIGURED">Configured seats</option>
                <option value="UNSET">Not configured</option>
              </select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Batch code
              <input name="cohortCode" type="text" maxLength={64}
                defaultValue={data.query.cohortCode ?? ""} placeholder="Exact batch code"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Maximum configured capacity
              <input name="maximumCapacity" type="number" min={1} max={100000} step={1}
                defaultValue={data.query.maximumCapacity??""} placeholder="No upper bound"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground"/>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">
              Minimum configured capacity
              <input name="minimumCapacity" type="number" min={1} max={100000} step={1}
                defaultValue={data.query.minimumCapacity ?? ""} placeholder="Any capacity"
                className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Class parent batch lifecycle
              <select name="cohortStatus" defaultValue={data.query.cohortStatus ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All batches</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Class parent program lifecycle
              <select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Elective slot academic period linkage
              <select name="periodState" defaultValue={data.query.periodState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All slots</option>
                <option value="LINKED">Linked to a period</option>
                <option value="UNLINKED">No period assigned</option>
              </select>
            </label>
          ) : null}
          <div className="flex items-end gap-2">
            <button type="submit"
              className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-on-primary">
              Filter
            </button>
            <Link href={path}
              className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary-text">
              Clear
            </Link>
          </div>
        </form>
      </section>
      <section aria-label={title + " results"} className="overflow-x-auto rounded-xl border border-border bg-surface">
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {data.total} matching {classes ? "classes" : "elective slots"}
        </p>
        {data.items.length === 0 ? (
          <p className="p-6 text-sm text-body">
            {data.total === 0
              ? classes
                ? "No recorded college classes match these filters. Classes are not inferred from batches."
                : "No registered elective slots match these filters. This does not establish whether electives are enabled for your college."
              : "No rows on this page. Choose an earlier page."}
          </p>
        ) : (
          <table className="w-full min-w-[53rem] text-left text-sm">
            {data.kind === "CLASSES" ? (
              <>
                <thead className="bg-muted text-muted-foreground"><tr>
                  <th scope="col" className="px-4 py-3">Class</th>
                  <th scope="col" className="px-4 py-3">Program / batch</th>
                  <th scope="col" className="px-4 py-3">Academic period</th>
                  <th scope="col" className="px-4 py-3">Capacity</th>
                  <th scope="col" className="px-4 py-3">Active enrollments</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Manage</th>
                </tr></thead>
                <tbody>{data.items.map(item => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-4 py-4">
                      <Link href={"/college/academics/sections/" + encodeURIComponent(item.id)}
                        className="font-semibold text-primary-text hover:underline">{item.name}</Link>
                      <p className="mt-1 text-xs text-muted-foreground">{item.code}</p>
                    </td>
                    <td className="px-4 py-4 text-body">{item.programName} · {item.cohortName}</td>
                    <td className="px-4 py-4 text-body">{item.periodName}</td>
                    <td className="px-4 py-4 text-body">{classCapacityLabel(item.capacity)}</td>
                    <td className="px-4 py-4 text-body">{item.activeLearners}</td>
                    <td className="px-4 py-4 text-body">{item.status}</td>
                    <td className="px-4 py-4"><div className="flex flex-wrap items-start gap-2">
                      <CollegeClassRowActions row={item} />
                      <CollegeSectionLifecycleAction row={{
                        id:item.id,name:item.name,status:item.status,
                        updatedAt:item.updatedAt.toISOString(),
                      }}/>
                    </div></td>
                  </tr>
                ))}</tbody>
              </>
            ) : (
              <>
                <thead className="bg-muted text-muted-foreground"><tr>
                  <th scope="col" className="px-4 py-3">Elective slot</th>
                  <th scope="col" className="px-4 py-3">Program / semester</th>
                  <th scope="col" className="px-4 py-3">Year / academic period</th>
                  <th scope="col" className="px-4 py-3">Credits / choices</th>
                  <th scope="col" className="px-4 py-3">Active offerings</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Manage</th>
                </tr></thead>
                <tbody>{data.items.map(item => (
                  <tr key={item.id} className="border-t border-border align-top">
                    <td className="px-4 py-4 font-semibold text-foreground">{item.name}</td>
                    <td className="px-4 py-4 text-body">{item.programName} · Semester {item.semesterNumber}</td>
                    <td className="px-4 py-4 text-body">
                      {item.academicYear ?? "Year not recorded"}
                      <p className="mt-1 text-xs text-muted-foreground">{item.periodName ?? "No academic period linked"}</p>
                    </td>
                    <td className="px-4 py-4 text-body">
                      {item.credits} credits · {electiveSelectionLabel(item.minPick, item.maxPick)}
                    </td>
                    <td className="px-4 py-4 text-body">{item.activeOfferings}</td>
                    <td className="px-4 py-4 text-body">{item.status}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-start gap-2">
                        {electiveOptions && item.status === "ACTIVE"
                          ? <CollegeSlotManager options={electiveOptions} row={item} />
                          : null}
                        <CollegeElectiveLifecycleAction slotId={item.id} name={item.name}
                          version={item.version} status={item.status} />
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </>
            )}
          </table>
        )}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-muted-foreground">Page {data.query.page} of {data.totalPages} · 25 per page</p>
        <div className="flex gap-2">
          {data.query.page > 1 ? (
            <Link href={collegeStructureHref(data.kind, { ...data.query, page: data.query.page - 1 })}
              className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link>
          ) : null}
          {data.query.page < data.totalPages ? (
            <Link href={collegeStructureHref(data.kind, { ...data.query, page: data.query.page + 1 })}
              className="rounded-md border border-border px-4 py-2 font-semibold text-primary-text">Next</Link>
          ) : null}
        </div>
      </nav>
      <p className="text-xs leading-5 text-muted-foreground">
        {classes
          ? "Active enrollments count persisted section enrollments for active learner memberships. Class capacity is configured capacity, not occupancy or attendance; scheduling conflicts and recurring series creation are not available here."
          : "Offered-course counts represent nondeleted active elective offerings with college-owned courses. Slots do not prove that the elective feature is enabled or that learner selections are open. Selection finalization and capacity enforcement are not implemented here."}
        Read-only. Legacy create/edit/delete, confirmation and browser parity remain open.
      </p>
    </div>
  );
}
