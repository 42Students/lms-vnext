import type { ReactNode } from "react";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { Disclosure } from "@/components/ui/disclosure";
import Link from "next/link";
import { CollegeClassRowActions } from "@/components/academics/college-section-management";
import { CollegeSectionLifecycleAction } from "@/components/academics/college-section-lifecycle-action";
import { CollegeSlotManager } from "@/components/electives/college-slot-manager";
import {CollegeElectiveOfferingManager} from "@/components/electives/college-elective-offering-manager";
import { CollegeElectiveLifecycleAction } from "@/components/electives/college-elective-lifecycle-action";
import { StatusBadge } from "@/components/ui/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { CollegeDirectoryPageSize, CollegeDirectoryRefresh } from "./college-directory-page-size";
import {
  classCapacityLabel,
  collegeStructureHref,
  electiveSelectionLabel,
} from "@/modules/academics/college-structure-directory-model";
import type {
  listCollegeClasses,
  listCollegeElectives,
} from "@/modules/academics/college-structure-directory-service";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type DirectoryData =
  | Awaited<ReturnType<typeof listCollegeClasses>>
  | Awaited<ReturnType<typeof listCollegeElectives>>;

export function CollegeStructureDirectory({ data, electiveOptions, prepend }: {
  data: DirectoryData;
  prepend?: ReactNode;
  electiveOptions?: {
    programs: { id: string; name: string; durationTerms: number }[];
    periods: { id: string; name: string }[];
  };
}) {
  const classes = data.kind === "CLASSES";
  const title = classes ? "Classes" : "Electives";
  const path = classes ? "/college/classes" : "/college/electives";
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        title={title}
        actions={<Link href="/college/academics"
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
          Academic workspace
        </Link>}
      />
      {prepend ? <div data-slot="page-tools" className="min-w-0">{prepend}</div> : null}
      <FilterBar title="Filters"
        search={<label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
          {classes ? "Class, batch or program" : "Elective, program or description"}
          <Input form="college-structure-directory-filters" type="search" name="q" maxLength={100} defaultValue={data.query.q}
            className="min-h-11 min-w-0 md:min-h-9" placeholder="Search registered records" />
        </label>}
        action={<Button type="submit" form="college-structure-directory-filters" className="min-h-11 md:min-h-9">Filter</Button>}>
        <section aria-label={title + " filters"} className="min-w-0">
        <form id="college-structure-directory-filters" method="get" action={path} className="grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2 lg:grid-cols-4">
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Program
            <Select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 min-w-0 md:min-h-9">
              <option value="">All programs</option>
              {data.programs.map(program => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 min-w-0 md:min-h-9">
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
              <option value="ALL">All</option>
            </Select>
          </label>
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Semester
              <Select name="semesterNumber" defaultValue={String(data.query.semesterNumber ?? "")}
                className="min-h-11 min-w-0 md:min-h-9">
                <option value="">All semesters</option>
                {Array.from({length: 12}, (_, i) => i + 1).map(number =>
                  <option key={number} value={number}>Semester {number}</option>)}
              </Select>
            </label>
          ) : null}
          <Disclosure title={"More filters"} className="col-span-full border-t border-border pt-3">
            <div className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Minimum slot credits
              <Input name="minimumCredits" type="number" min={1} max={500} step={1}
                defaultValue={data.query.minimumCredits??""} placeholder="Any credits"
                className="min-h-11 min-w-0 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Maximum slot credits
              <Input name="maximumCredits" type="number" min={1} max={500} step={1}
                defaultValue={data.query.maximumCredits ?? ""} placeholder="No upper bound"
                className="min-h-11 min-w-0 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Capacity configuration
              <Select name="capacityState" defaultValue={data.query.capacityState}
                className="min-h-11 min-w-0 md:min-h-9">
                <option value="ALL">Any configuration</option>
                <option value="CONFIGURED">Configured seats</option>
                <option value="UNSET">Not configured</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Batch code
              <Input name="cohortCode" type="text" maxLength={64}
                defaultValue={data.query.cohortCode ?? ""} placeholder="Exact batch code"
                className="min-h-11 min-w-0 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Maximum configured capacity
              <Input name="maximumCapacity" type="number" min={1} max={100000} step={1}
                defaultValue={data.query.maximumCapacity??""} placeholder="No upper bound"
                className="min-h-11 min-w-0 md:min-h-9"/>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Minimum configured capacity
              <Input name="minimumCapacity" type="number" min={1} max={100000} step={1}
                defaultValue={data.query.minimumCapacity ?? ""} placeholder="Any capacity"
                className="min-h-11 min-w-0 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch status
              <Select name="cohortStatus" defaultValue={data.query.cohortStatus ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All batches</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program status
              <Select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period
              <Select name="periodState" defaultValue={data.query.periodState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All slots</option>
                <option value="LINKED">Linked to a period</option>
                <option value="UNLINKED">No period assigned</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program status
              <Select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active programs</option>
                <option value="ARCHIVED">Archived programs</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class academic period code
              <Input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode ?? ""}
                placeholder="Exact registered code" className="min-h-11 min-w-0 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class code
              <Input name="classCode" type="search" maxLength={64} defaultValue={data.query.classCode ?? ""}
                placeholder="Exact registered code" className="min-h-11 min-w-0 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Number of choices
              <Select name="choiceMode" defaultValue={data.query.choiceMode ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All slots</option>
                <option value="FLEXIBLE">Minimum and maximum differ</option>
                <option value="FIXED">Exact selection count</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Course offerings
              <Select name="offeringState" defaultValue={data.query.offeringState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All slots</option>
                <option value="HAS_ACTIVE">Has active course offerings</option>
                <option value="NONE_ACTIVE">No active course offerings</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic year
              <Select name="academicYearState" defaultValue={data.query.academicYearState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All slots</option>
                <option value="RECORDED">Academic year recorded</option>
                <option value="MISSING">No academic year recorded</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period code
              <Input name="periodCode" type="search" maxLength={64} defaultValue={data.query.periodCode ?? ""}
                placeholder="Exact linked period code" className="min-h-11 min-w-0 md:min-h-9" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period status
              <Select name="periodLifecycle" defaultValue={data.query.periodLifecycle} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All periods</option>
                <option value="PLANNED">Planned</option>
                <option value="ACTIVE">Active</option>
                <option value="CLOSED">Closed</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Exact program code
              <Input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class name
              <Input name="className" type="search" maxLength={255} defaultValue={data.query.className ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch name
              <Input name="cohortName" type="search" maxLength={255} defaultValue={data.query.cohortName ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Saved section schedule
              <Select name="schedulePresence" defaultValue={data.query.schedulePresence} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All classes</option>
                <option value="HAS_EVENTS">With schedule events</option>
                <option value="NO_EVENTS">No saved schedule events</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty assignments
              <Select name="facultyCoverage" defaultValue={data.query.facultyCoverage} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All classes</option>
                <option value="HAS_FACULTY">Has active Faculty assignments</option>
                <option value="NO_FACULTY">No active Faculty assignments</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Courses
              <Select name="deliveryPresence" defaultValue={data.query.deliveryPresence} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All classes</option>
                <option value="HAS_DELIVERIES">Has course deliveries</option>
                <option value="NO_DELIVERIES">No course deliveries</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Period start date on or after
              <Input name="periodStartsOnOrAfter" type="date" defaultValue={data.query.periodStartsOnOrAfter ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Period end date on or before
              <Input name="periodEndsOnOrBefore" type="date" defaultValue={data.query.periodEndsOnOrBefore ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "CLASSES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department code
              <Input name="departmentCode" type="search" maxLength={64} defaultValue={data.query.departmentCode ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Elective name
              <Input name="slotName" type="search" maxLength={150} defaultValue={data.query.slotName ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program code
              <Input name="programCode" type="search" maxLength={64} defaultValue={data.query.programCode ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department code
              <Input name="departmentCode" type="search" maxLength={64} defaultValue={data.query.departmentCode ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum required elective choices
              <Input name="minimumRequiredPicks" type="number" min={0} max={1000} step={1} defaultValue={data.query.minimumRequiredPicks ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum allowed elective choices
              <Input name="maximumAllowedPicks" type="number" min={1} max={1000} step={1} defaultValue={data.query.maximumAllowedPicks ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester from
              <Input name="semesterFrom" type="number" min={1} max={24} step={1} defaultValue={data.query.semesterFrom ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester through
              <Input name="semesterThrough" type="number" min={1} max={24} step={1} defaultValue={data.query.semesterThrough ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Linked academic-period lifecycle
              <Select name="periodLifecycle" defaultValue={data.query.periodLifecycle} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All linked and unlinked</option><option value="PLANNED">Planned</option><option value="ACTIVE">Active</option><option value="CLOSED">Closed</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Elective description availability
              <Select name="descriptionPresence" defaultValue={data.query.descriptionPresence} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">Any description state</option><option value="RECORDED">Field is recorded</option><option value="MISSING">Field is missing</option>
              </Select>
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Elective linked period starts on or after
              <Input name="periodStartsOnOrAfter" type="date" defaultValue={data.query.periodStartsOnOrAfter ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
          {data.kind === "ELECTIVES" ? (
            <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Elective linked period ends on or before
              <Input name="periodEndsOnOrBefore" type="date" defaultValue={data.query.periodEndsOnOrBefore ?? ""} className="min-h-[var(--lms-control-height)]" />
            </label>
          ) : null}
            </div>
          </Disclosure>
          <div className="flex items-end gap-2">
            <Button variant="primary" type="submit" className="min-h-11 md:hidden">
              Filter
            </Button>
            <Link href={path}
              className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-[var(--lms-field-hover-border)] bg-surface px-4 text-sm font-[650] text-[var(--lms-body-text)] hover:border-[var(--lms-primary)] hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">
              Clear
            </Link>
          </div>
        </form>
      </section></FilterBar>
      <section aria-label={title + " results"} role="region" tabIndex={0} className="min-w-0 max-w-full border-b border-[var(--lms-canvas-border)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[var(--lms-space-3)]">
          <p className="text-sm text-muted-foreground">{data.total.toLocaleString("en-IN")} matching {classes ? "classes" : "elective slots"}</p>
          <CollegeDirectoryRefresh />
        </div>
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
          <>{data.kind === "CLASSES" ? (
            <DataTable caption="Class directory" rows={data.items}
              getRowKey={item=>item.id}
              empty={<p>No classes match these filters.</p>}
              columns={[
                {key:"class",header:"Class",mobilePriority:"primary",cell:item=><>
                  <Link href={"/college/academics/sections/"+encodeURIComponent(item.id)}
                    className="font-semibold text-primary-text hover:underline">{item.name}</Link>
                  <p className="mt-1 text-xs text-muted-foreground">{item.code}</p>
                </>},
                {key:"program",header:"Program / batch",mobilePriority:"secondary",cell:item=>
                  <span>{item.programName ?? `Name unavailable (ID ${item.linkedProgramId ?? "unknown"})`} · {item.cohortName ?? `Name unavailable (ID ${item.cohortId})`}</span>},
                {key:"period",header:"Academic period",mobilePriority:"secondary",cell:item=>item.periodName},
                {key:"capacity",header:"Capacity",mobilePriority:"secondary",cell:item=>classCapacityLabel(item.capacity)},
                {key:"enrollment",header:"Active enrollments",mobilePriority:"secondary",cell:item=>item.activeLearners === null
                  ? <span role="status" className="text-amber-700">Unavailable</span> : item.activeLearners},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status === "ACTIVE" ? "success" : "neutral"}>{item.status}</StatusBadge>},
                {key:"manage",header:"Manage",mobilePriority:"action",cell:item=>
                  <div className="flex min-w-0 flex-wrap items-center gap-[var(--lms-space-2)]">
                    <Link href={"/college/classes/recurring-preview?classId="+encodeURIComponent(item.id)}
                      className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text"
                      aria-label={"Schedule recurring sessions for "+item.name}>Schedule</Link>
                    <CollegeClassRowActions row={item}/>
                    <CollegeSectionLifecycleAction row={{
                      id:item.id,name:item.name,status:item.status,
                      updatedAt:item.updatedAt.toISOString(),
                    }}/>
                  </div>},
              ]}
            />
          ) : (
            <DataTable caption="Elective slot directory" rows={data.items}
              getRowKey={item=>item.id}
              empty={<p>No elective slots match these filters.</p>}
              columns={[
                {key:"slot",header:"Elective slot",mobilePriority:"primary",cell:item=>
                  <span className="font-semibold text-foreground">{item.name}</span>},
                {key:"program",header:"Program / semester",mobilePriority:"secondary",cell:item=>
                  <span>{item.programName} · Semester {item.semesterNumber}</span>},
                {key:"period",header:"Year / academic period",mobilePriority:"secondary",cell:item=><>
                  {item.academicYear ?? "Year not recorded"}
                  <p className="mt-1 text-xs text-muted-foreground">{item.periodName ?? "No academic period linked"}</p>
                </>},
                {key:"credits",header:"Credits / choices",mobilePriority:"secondary",cell:item=>
                  <span>{item.credits} credits · Pick: {electiveSelectionLabel(item.minPick,item.maxPick)}</span>},
                {key:"students",header:"Students",mobilePriority:"secondary",cell:item=>
                  <span title="Distinct actively assigned learners across the slot’s active course groups. Not pending picks.">{item.confirmedStudents}</span>},
                {key:"offerings",header:"Active offerings",mobilePriority:"secondary",cell:item=>item.activeOfferings},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:item=><StatusBadge tone={item.status==="ACTIVE"?"success":"neutral"}>{item.status}</StatusBadge>},
                {key:"manage",header:"Manage",mobilePriority:"action",cell:item=>
                  <div className="flex flex-wrap items-start gap-2">
                    {electiveOptions && item.status === "ACTIVE" ? <>
                      <Link href={"/college/electives/"+encodeURIComponent(item.id)}
                        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">Open</Link>
                      <CollegeSlotManager options={electiveOptions} row={item}/>
                      <CollegeElectiveOfferingManager slotId={item.id}/>
                      <Link href={"/college/electives/"+encodeURIComponent(item.id)+"/allocate"}
                        className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-primary-text">
                        Eligible students
                      </Link>
                    </> : null}
                    <CollegeElectiveLifecycleAction slotId={item.id} name={item.name}
                      version={item.version} status={item.status}/>
                  </div>},
              ]}
            />
          )}</>
        )}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
<div className="flex flex-wrap items-center gap-3">
          <p className="text-muted-foreground">
            {data.total === 0 ? "0" : ((data.query.page - 1) * data.query.pageSize + 1).toLocaleString("en-IN")}–{Math.min(data.query.page * data.query.pageSize, data.total).toLocaleString("en-IN")}
            {" of "}{data.total.toLocaleString("en-IN")} · Page {data.query.page} of {data.totalPages}
          </p>
          <CollegeDirectoryPageSize current={data.query.pageSize} />
        </div>
        <div className="flex gap-2">
          {data.query.page > 1 ? (
            <Link href={collegeStructureHref(data.kind, { ...data.query, page: data.query.page - 1 })}
              className="rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-primary-text">Previous</Link>
          ) : null}
          {data.query.page < data.totalPages ? (
            <Link href={collegeStructureHref(data.kind, { ...data.query, page: data.query.page + 1 })}
              className="rounded-[8px] md:rounded-[var(--lms-control-radius)] border border-border px-4 py-2 font-semibold text-primary-text">Next</Link>
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
