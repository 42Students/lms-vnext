import Link from "next/link";
import { CollegeClassRowActions } from "@/components/academics/college-section-management";
import { CollegeSectionLifecycleAction } from "@/components/academics/college-section-lifecycle-action";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import {CollegeElectiveOfferingManager} from "@/components/electives/college-elective-offering-manager";
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
        title={title}
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
          <details className="col-span-full rounded-md border border-border p-3">
            <summary className="cursor-pointer text-sm font-semibold text-body">More filters</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <label className="grid gap-1 text-sm font-semibold text-body">Batch status
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
            <label className="grid gap-1 text-sm font-semibold text-body">Program status
              <select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Academic period
              <select name="periodState" defaultValue={data.query.periodState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All slots</option>
                <option value="LINKED">Linked to a period</option>
                <option value="UNLINKED">No period assigned</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Program status
              <select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active programs</option>
                <option value="ARCHIVED">Archived programs</option>
              </select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Class academic period code
              <input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode ?? ""}
                placeholder="Exact registered code" className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Class code
              <input name="classCode" type="search" maxLength={64} defaultValue={data.query.classCode ?? ""}
                placeholder="Exact registered code" className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Number of choices
              <select name="choiceMode" defaultValue={data.query.choiceMode ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All slots</option>
                <option value="FLEXIBLE">Minimum and maximum differ</option>
                <option value="FIXED">Exact selection count</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Course offerings
              <select name="offeringState" defaultValue={data.query.offeringState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All slots</option>
                <option value="HAS_ACTIVE">Has active course offerings</option>
                <option value="NONE_ACTIVE">No active course offerings</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Academic year
              <select name="academicYearState" defaultValue={data.query.academicYearState ?? "ALL"} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All slots</option>
                <option value="RECORDED">Academic year recorded</option>
                <option value="MISSING">No academic year recorded</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Academic period code
              <input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode ?? ""}
                placeholder="Exact linked period code" className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Academic period status
              <select name="periodLifecycle" defaultValue={data.query.periodLifecycle} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All periods</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
              </select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Exact program code
              <input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Class name
              <input name="className" type="search" maxLength={255} defaultValue={data.query.className ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Batch name
              <input name="cohortName" type="search" maxLength={255} defaultValue={data.query.cohortName ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Saved section schedule
              <select name="schedulePresence" defaultValue={data.query.schedulePresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All classes</option>
                <option value="HAS_EVENTS">With schedule events</option>
                <option value="NO_EVENTS">No saved schedule events</option>
              </select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Faculty assignments
              <select name="facultyCoverage" defaultValue={data.query.facultyCoverage} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All classes</option>
                <option value="HAS_FACULTY">Has active Faculty assignments</option>
                <option value="NO_FACULTY">No active Faculty assignments</option>
              </select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Courses
              <select name="deliveryPresence" defaultValue={data.query.deliveryPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All classes</option>
                <option value="HAS_DELIVERIES">Has course deliveries</option>
                <option value="NO_DELIVERIES">No course deliveries</option>
              </select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Period start date on or after
              <input name="periodStartsOnOrAfter" type="date" defaultValue={data.query.periodStartsOnOrAfter ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Period end date on or before
              <input name="periodEndsOnOrBefore" type="date" defaultValue={data.query.periodEndsOnOrBefore ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Department code
              <input name="departmentCode" type="search" maxLength={64} defaultValue={data.query.departmentCode ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Elective name
              <input name="slotName" type="search" maxLength={150} defaultValue={data.query.slotName ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Program code
              <input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Department code
              <input name="departmentCode" type="search" maxLength={64} defaultValue={data.query.departmentCode ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Minimum required elective choices
              <input name="minimumRequiredPicks" type="number" min={0} max={1000} step={1} defaultValue={data.query.minimumRequiredPicks ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Maximum allowed elective choices
              <input name="maximumAllowedPicks" type="number" min={1} max={1000} step={1} defaultValue={data.query.maximumAllowedPicks ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Semester from
              <input name="semesterFrom" type="number" min={1} max={24} step={1} defaultValue={data.query.semesterFrom ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Semester through
              <input name="semesterThrough" type="number" min={1} max={24} step={1} defaultValue={data.query.semesterThrough ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Linked academic-period lifecycle
              <select name="periodLifecycle" defaultValue={data.query.periodLifecycle} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">All linked and unlinked</option><option value="PLANNED">Planned</option><option value="ACTIVE">Active</option><option value="CLOSED">Closed</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Elective description availability
              <select name="descriptionPresence" defaultValue={data.query.descriptionPresence} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground">
                <option value="ALL">Any description state</option><option value="RECORDED">Field is recorded</option><option value="MISSING">Field is missing</option>
              </select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Elective linked period starts on or after
              <input name="periodStartsOnOrAfter" type="date" defaultValue={data.query.periodStartsOnOrAfter ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-1 text-sm font-semibold text-body">Elective linked period ends on or before
              <input name="periodEndsOnOrBefore" type="date" defaultValue={data.query.periodEndsOnOrBefore ?? ""} className="min-h-11 rounded-md border border-border bg-surface px-3 text-foreground" />
            </label>
          ) : null}
            </div>
          </details>
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
      <section aria-label={title + " results"} role="region" tabIndex={0} className="max-w-full overflow-x-auto rounded-xl border border-border bg-surface">
        <p className="px-4 pt-3 text-xs text-muted-foreground sm:hidden">Scroll sideways to view all class or elective columns.</p>
        <p className="border-b border-border px-4 py-3 text-sm text-muted-foreground">
          {data.total} matching {classes ? "classes" : "elective slots"}
        </p>
        {data.items.length === 0 ? (
          <div role="status" className="space-y-2 p-6 text-sm text-body">
           <p>
            {data.total === 0
              ? classes
                ? "No recorded college classes match these filters. Classes are not inferred from batches."
                : "No electives match these filters."
              : "No rows on this page. Choose an earlier page."}
           </p>
           <Link href={path} className="inline-flex min-h-11 items-center font-semibold text-primary-text">Clear filters and view all {title.toLowerCase()}</Link>
          </div>
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
                      <Link href={"/college/classes/recurring-preview?classId=" + encodeURIComponent(item.id)}
                        className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text"
                        aria-label={"Schedule recurring sessions for " + item.name}>Schedule</Link>
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
                  <th scope="col" className="px-4 py-3">Students</th>
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
                      {item.credits} credits · Pick: {electiveSelectionLabel(item.minPick, item.maxPick)}
                    </td>
                    <td className="px-4 py-4 text-body" title="Distinct actively assigned learners across the slot’s active course groups. Not pending picks.">{item.confirmedStudents}</td>
                    <td className="px-4 py-4 text-body">{item.activeOfferings}</td>
                    <td className="px-4 py-4 text-body">{item.status}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-start gap-2">
                        {electiveOptions && item.status === "ACTIVE" ? <>
                          <Link href={"/college/electives/"+encodeURIComponent(item.id)} className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">Open</Link>
                           <CollegeSlotManager options={electiveOptions} row={item} />
                          <CollegeElectiveOfferingManager slotId={item.id}/>
                          <Link href={"/college/electives/" + encodeURIComponent(item.id) + "/allocate"}
                            className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">
                            Eligible students
                          </Link>
                        </> : null}
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
 
      </p>
    </div>
  );
}
