import type { ReactNode } from "react";
import { FilterBar } from "@/components/ui/filter-bar";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Disclosure } from "@/components/ui/disclosure";
import { PageHeader } from "@/components/ui/page-header";
import { DataTable } from "@/components/ui/data-table";
import { CollegeCohortRowActions } from "@/components/academics/college-cohort-management";
import { CollegeSemesterCreateForm, CollegeSemesterRowActions } from "@/components/academics/college-semester-management";
import { academicDirectoryHref } from "@/modules/academics/college-academic-directory-model";
import type {
  listCollegeBatches,
  listCollegeSemesters,
} from "@/modules/academics/college-academic-directory-service";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CollegeDirectoryPageSize } from "@/components/academics/college-directory-page-size";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";
import { Label } from "@/components/ui/label";
import { TextLink } from "@/components/ui/text-link";
import { formatNumberIN } from "@/lib/safe-format";

type DirectoryData =
  | Awaited<ReturnType<typeof listCollegeSemesters>>
  | Awaited<ReturnType<typeof listCollegeBatches>>;

export function CollegeAcademicDirectory({ data, batchPeriods = [], prepend, actions }: {
  data: DirectoryData;
  batchPeriods?: { id: string; name: string; code: string }[];
  prepend?: ReactNode;
  actions?: ReactNode;
}) {
  const semesters = data.kind === "SEMESTERS";
  const title = semesters ? "Semesters" : "Batches";
  const path = semesters ? "/college/semesters" : "/college/batches";
  const hasFilters = Object.entries(data.query).some(([key, value]) =>
    !["page","pageSize"].includes(key) && value !== undefined && value !== null &&
      value !== "" && value !== "ALL");
  const pageStart = data.total ? Math.min(data.total, (data.query.page-1)*data.query.pageSize+1) : 0;
  const pageEnd = Math.min(data.total, data.query.page*data.query.pageSize);
  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <PageHeader
        title={title}
        description={semesters
          ? "Manage semesters, their courses and credits."
          : "Manage cohorts, their academic year and current semester."}
        actions={<>
          {actions}
          <ButtonLink variant="secondary" href="/college/academics">
            Academic workspace
          </ButtonLink>
        </>}
      />
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-24">
        <div className="min-w-0 xl:col-span-10">
          {prepend ? <section aria-label="Batch actions" className="min-w-0">{prepend}</section> : null}
          {data.kind === "SEMESTERS" ? <CollegeSemesterCreateForm programs={data.programs} /> : null}
        </div>
        <section className="min-w-0 overflow-hidden rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface xl:col-span-14"
          aria-label={semesters ? "Existing Semesters" : "Existing Batches"}>
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <Heading level={2} size="base" className="text-foreground">
              {semesters ? "Semesters" : "Existing Batches"}
            </Heading>
            <ButtonLink variant="secondary" href={academicDirectoryHref(data.kind,data.query)} aria-label={"Refresh " + title.toLowerCase()}>
              <span aria-hidden="true">↻</span> Refresh
            </ButtonLink>
          </header>
      <FilterBar title="Filters"
        search={<Label stack className="min-w-0">
          {semesters ? "Semester or program" : "Batch or program"}
          <Input form="college-academic-directory-filters" name="q" type="search" maxLength={100} defaultValue={data.query.q}
            placeholder={semesters ? "Search semesters" : "Search batch, year, program or status"}
            className="min-h-11 min-w-0 md:min-h-9" />
        </Label>}
        action={<Button type="submit" form="college-academic-directory-filters" variant="primary" className="min-h-11 md:min-h-9">Filter</Button>}>
        <section aria-label={title + " filters"} className="min-w-0">
        <form id="college-academic-directory-filters" action={path} method="get" className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-3)] md:grid-cols-2 lg:grid-cols-4">
          <Label stack className="max-w-[200px]">
            Program
            <Select name="programId" defaultValue={data.query.programId ?? ""}
              className="min-h-11 min-w-0 md:min-h-9">
              <option value="">All programs</option>
              {data.programs.map((program) => (
                <option key={program.id} value={program.id}>
                  {program.name} ({program.code})
                </option>
              ))}
            </Select>
          </Label>
          <Label stack>
            Status
            <Select name="status" defaultValue={data.query.status}
              className="min-h-11 min-w-0 md:min-h-9">
              <option value="ALL">All statuses</option>
              {semesters ? (
                <>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </>
              ) : (
                <>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PLANNED">Planned</option>
                  <option value="ARCHIVED">Archived</option>
                </>
              )}
            </Select>
          </Label>
          <Disclosure title={"More filters"} className="col-span-full border-t border-border pt-3">
            <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          {data.kind === "BATCHES" ? (
            <Label stack>
              Recorded current term
              <Input type="number" name="currentTerm" min={1} max={24} step={1}
                defaultValue={data.query.currentTerm??""} placeholder="All progression terms"
                className="min-h-11 min-w-0 md:min-h-9"/>
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>
              Progression record
              <Select name="progression" defaultValue={data.query.progression}
                className="min-h-11 min-w-0 md:min-h-9">
                <option value="ALL">All batches</option>
                <option value="RECORDED">Progression recorded</option>
                <option value="MISSING">No progression record</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>
              Recorded academic year (start)
              <Input name="yearStart" type="number" min={1900} max={9998} step={1}
                defaultValue={data.query.yearStart ?? ""} placeholder="All academic years"
                className="min-h-11 min-w-0 md:min-h-9" />
            </Label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <Label stack>
              Minimum configured credits
              <Input type="number" name="minimumCredits" min={0} max={500} step={1}
                defaultValue={data.query.minimumCredits??""} placeholder="All credit totals"
                className="min-h-11 min-w-0 md:min-h-9"/>
            </Label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <Label stack>
              Maximum configured credits
              <Input type="number" name="maximumCredits" min={0} max={500} step={1}
                defaultValue={data.query.maximumCredits ?? ""} placeholder="All credit totals"
                className="min-h-11 min-w-0 md:min-h-9"/>
            </Label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <Label stack>
              Semester number
              <Input type="number" name="termNumber" min={1} max={24} step={1}
                defaultValue={data.query.termNumber ?? ""} placeholder="All semesters"
                className="min-h-11 min-w-0 md:min-h-9" />
            </Label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <Label stack>Credits availability
              <Select name="creditState" defaultValue={data.query.creditState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All terms</option>
                <option value="CONFIGURED">Credits configured</option>
                <option value="UNSET">No configured credits</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <Label stack>Program status
              <Select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All programs</option>
                <option value="ACTIVE">Active programs</option>
                <option value="ARCHIVED">Archived programs</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "SEMESTERS" ? (
            <Label stack>Course mapping
              <Select name="mappingState" defaultValue={data.query.mappingState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All terms</option>
                <option value="MAPPED">Has mapped courses</option>
                <option value="UNMAPPED">No mapped courses</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>Expected end period
              <Select name="expectedEndState" defaultValue={data.query.expectedEndState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All batches</option>
                <option value="SET">End period recorded</option>
                <option value="UNSET">No end period recorded</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>Academic year
              <Select name="academicYearState" defaultValue={data.query.academicYearState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All batches</option>
                <option value="RECORDED">Year recorded</option>
                <option value="UNRECORDED">No recorded year</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>Program status
              <Select name="programStatus" defaultValue={data.query.programStatus ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All parent programs</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>Batch start on or after
              <Input type="date" name="startOnOrAfter" defaultValue={data.query.startOnOrAfter ?? ""}
                className="min-h-11 min-w-0 md:min-h-9" />
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>Batch start on or before
              <Input type="date" name="startOnOrBefore" defaultValue={data.query.startOnOrBefore ?? ""}
                className="min-h-11 min-w-0 md:min-h-9" />
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>Classes
              <Select name="activeClassState" defaultValue={data.query.activeClassState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All batches</option>
                <option value="HAS_ACTIVE">Has active classes</option>
                <option value="NONE_ACTIVE">No active classes</option>
              </Select>
            </Label>
          ) : null}
          {data.kind === "BATCHES" ? (
            <Label stack>Students
              <Select name="activeLearnerState" defaultValue={data.query.activeLearnerState ?? "ALL"} className="min-h-[var(--lms-control-height)]">
                <option value="ALL">All batches</option>
                <option value="HAS_ACTIVE">Has active learner enrollments</option>
                <option value="NONE_ACTIVE">No active learner enrollments</option>
              </Select>
            </Label>
          ) : null}
            </div>
          </Disclosure>
          <div className="flex items-end gap-2">
            <Button variant="primary" type="submit" className="min-h-11 md:hidden">
              Filter
            </Button>
            {hasFilters ? <ButtonLink variant="secondary" href={path}>
              Clear
            </ButtonLink> : null}
          </div>
        </form>
      </section></FilterBar>

      <section aria-label={title + " results"} role="region" tabIndex={0} className="min-w-0 max-w-full overflow-x-auto border-b border-[var(--lms-canvas-border)]">
        <p className="border-b border-[var(--lms-canvas-border)] px-[var(--lms-space-4)] py-[var(--lms-space-3)] text-sm text-muted-foreground">
          {formatNumberIN(data.total)} {semesters ? "semesters" : "batches"} ·
          {hasFilters ? " filtered results" : " all records"}
        </p>
        <p className="px-4 py-2 text-xs text-muted-foreground sm:hidden">Scroll sideways to view all semester or batch columns.</p>
        {data.items.length === 0 ? (
          <div role="status" className="space-y-2 p-6 text-sm text-body">
           <p>
            {data.total === 0 ? hasFilters
              ? semesters ? "No semesters match these filters." : "No batches match search/filters."
              : semesters ? "No semesters found. Create a program first, then add semesters."
                : "No batches yet. Create a program first."
              : "No records exist on this page. Select an earlier page."}
           </p>
           {hasFilters ? <TextLink href={path}
             className="inline-flex min-h-11 items-center">
             Clear filters and view all {title.toLowerCase()}</TextLink> :
             <TextLink href={semesters ? "#college-semester-create" : "#college-batch-create"}
               className="inline-flex min-h-11 items-center">
               {semesters ? "Create semester" : "Create batch"}</TextLink>}
          </div>
        ) : (
          <>{data.kind === "SEMESTERS" ? (
            <DataTable
              caption="Semester directory"
              mobileMode="scroll"
              rows={data.items}
              getRowKey={item=>item.id}
              empty={<p>{hasFilters ? "No semesters match these filters." :
                "No semesters found. Create a program first, then add semesters."}</p>}
              columns={[
                {key:"program",header:"Program",mobilePriority:"secondary",className:"whitespace-nowrap",cell:item=>
                  <span>{item.programName || "Program name unavailable"}</span>},
                {key:"number",header:"Semester #",mobilePriority:"secondary",cell:item=>
                  <StatusBadge tone="info">Sem {item.termNumber}</StatusBadge>},
                {key:"name",header:"Name",mobilePriority:"primary",cell:item=>
                  <span className="font-semibold text-foreground">{item.name}</span>},
                {key:"credits",header:"Credits",mobilePriority:"secondary",cell:item=>
                  item.mappedCourses > 0 ? item.mappedCredits ?? 0 : "—"},
                {key:"courses",header:"Courses",mobilePriority:"secondary",cell:item=>item.mappedCourses},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>
                  <StatusBadge tone={item.isActive ? "success" : "error"}>
                    {item.isActive ? "Active" : "Inactive"}
                  </StatusBadge>},
                {key:"actions",header:"Actions",mobilePriority:"action",cell:item=>
                  <CollegeSemesterRowActions row={item}/>},
              ]}
            />
          ) : (
            <DataTable
              caption="Batch directory"
              mobileMode="scroll"
              rows={data.items}
              getRowKey={item=>item.id}
              empty={<p>{hasFilters ? "No batches match search/filters." : "No batches yet. Use Create New Batch to add your first batch."}</p>}
              columns={[
                {key:"batch",header:"Batch Name",mobilePriority:"primary",className:"whitespace-nowrap",cell:item=>
                  <span className="font-semibold text-foreground">{item.name}</span>},
                {key:"program",header:"Program",mobilePriority:"secondary",cell:item=>
                  <span>{item.programName || "Program name unavailable"}</span>},
                {key:"years",header:"Years",mobilePriority:"secondary",cell:item=>
                  item.startDate && item.endDate
                    ? item.startDate.slice(0,4)+" – "+item.endDate.slice(0,4) : "—"},
                {key:"semester",header:"Current Semester",mobilePriority:"secondary",cell:item=>
                  item.currentTermNumber === null ? "—" :
                    <StatusBadge tone="info">Semester {item.currentTermNumber}</StatusBadge>},
                {key:"year",header:"Academic Year",mobilePriority:"secondary",cell:item=>
                  item.academicYear ?? (item.currentAcademicYearStart !== null
                    ? String(item.currentAcademicYearStart)+"-"+String((item.currentAcademicYearStart+1)%100).padStart(2,"0")
                    : "—")},
                {key:"classes",header:"Classes",mobilePriority:"secondary",cell:item=>item.activeSections},
                {key:"students",header:"Students",mobilePriority:"secondary",cell:item=>item.activeEnrolledLearners},
                {key:"status",header:"Status",mobilePriority:"secondary",cell:item=>{
                  const caption = item.status === "ARCHIVED" ? "Archived" : item.inactiveAt ||
                    item.status === "PLANNED" ? "Inactive" : item.status === "COMPLETED" ?
                    "Completed" : "Active";
                  return <StatusBadge tone={caption === "Active" ? "success" :
                    caption === "Inactive" ? "warning" : "neutral"}>{caption}</StatusBadge>;
                }},
                {key:"actions",header:"Actions",mobilePriority:"action",cell:item=>
                  <CollegeCohortRowActions row={item} periods={batchPeriods}/>},
              ]}
            />
          )}</>
        )}
      </section>
      <nav aria-label={title + " pagination"} className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{pageStart}–{pageEnd} of {data.total} · Page {data.query.page} of {data.totalPages}</span>
        <CollegeDirectoryPageSize current={data.query.pageSize} />
        <div className="flex gap-2">
          {data.query.page > 1 ? (
            <ButtonLink variant="secondary" href={academicDirectoryHref(data.kind, { ...data.query, page: data.query.page - 1 })}>
              Previous
            </ButtonLink>
          ) : null}
          {data.query.page < data.totalPages ? (
            <ButtonLink variant="secondary" href={academicDirectoryHref(data.kind, { ...data.query, page: data.query.page + 1 })}>
              Next
            </ButtonLink>
          ) : null}
        </div>
      </nav>
        </section>
      </div>
      <p className="text-xs leading-5 text-muted-foreground">
        {semesters
          ? "Mapped course counts include registered curriculum mappings within this college only. Deletion is denied when mappings or non-archived batches exist; editing never changes the assigned program or semester number."
          : "Learner counts include currently active program enrollments with active college membership; class counts include active sections. Manage each batch’s students and recorded progression using the available actions."}
 
      </p>
    </div>
  );
}
