import { FilterBar } from "@/components/ui/filter-bar";
import { StatTile } from "@/components/ui/stat-tile";
import { Disclosure } from "@/components/ui/disclosure";
import collegeStyles from "@/components/admin/legacy-college-stat.module.css";
import { Pagination } from "@/components/ui/pagination";
import Link from "next/link";
import {collegeCourseCatalogueHref,paginateCollegeCourses,type CollegeCourseCatalogueQuery} from "@/modules/courses/college-course-catalogue-model";
import {collegeCourseCatalogueExportHref} from "@/modules/courses/college-course-catalogue-export-model";
import type {listCollegeCourseCatalogue} from "@/modules/courses/college-course-catalogue-service";
import { COLLEGE_COURSES_COPY, courseVisibleToStudentsLabel, facultyAssignmentRoleLabel } from "@/modules/courses/college-courses-copy";
import { CollegeOfferingLifecycleAction } from "@/components/college/college-offering-lifecycle-action";
import { CollegeOfferingMetadataAction } from "@/components/college/college-offering-metadata-action";
import {
  DataTable,
  type DataTableColumn,
} from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type {
  getAdminCourseWorkspace,
} from "@/modules/courses/admin-course-workspace";
import { AdminCourseCreatePanel } from "./admin-course-create-panel";
import { SuperAdminCourseBulkVisibility } from "./super-admin-course-bulk-visibility";
import {
  CourseActions,
  DeliveryActions,
  OfferingActions,
  TeachingAssignmentActions,
} from "./admin-course-actions";

type Workspace = Awaited<
  ReturnType<typeof getAdminCourseWorkspace>
>;

export function AdminCourseOverview({
  workspace,
  offeringBasePath,
  allowOfferingLifecycle = false,
  duplicateCourseId,catalogueQuery,catalogueData,courseBasePath="/college/courses",lessonCountByCourse,openCreateCourse=false,
}: {
  workspace: Workspace;
  offeringBasePath: string;
  allowOfferingLifecycle?: boolean;
  duplicateCourseId?:string;
  openCreateCourse?:boolean;
  courseBasePath?:string;
  catalogueQuery?:CollegeCourseCatalogueQuery;
  catalogueData?:Awaited<ReturnType<typeof listCollegeCourseCatalogue>>;
  lessonCountByCourse?:Readonly<Record<string,number>>;
}) {
  const catalogue=catalogueData??(catalogueQuery?paginateCollegeCourses(workspace.courses,catalogueQuery):null);
  const deliveryCountByOffering = new Map<
    string,
    number
  >();
  const teacherCountByDelivery = new Map<
    string,
    number
  >();

  for (const delivery of workspace.deliveries) {
    deliveryCountByOffering.set(
      delivery.offeringId,
      (deliveryCountByOffering.get(
        delivery.offeringId,
      ) ?? 0) + 1,
    );
  }

  for (const assignment of workspace.teachingAssignments) {
    teacherCountByDelivery.set(
      assignment.deliveryId,
      (teacherCountByDelivery.get(
        assignment.deliveryId,
      ) ?? 0) + 1,
    );
  }

  const activeOfferingCountByCourse=new Map<string,number>();
  for(const item of workspace.offerings){
    if(item.status!=="ACTIVE")continue;
    activeOfferingCountByCourse.set(item.courseId,
      (activeOfferingCountByCourse.get(item.courseId)??0)+1);
  }

  const courseColumns: DataTableColumn<
    Workspace["courses"][number]
  >[] = [
    {
      key: "course",
      header: "Course",
      cell: (course) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {course.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-primary-text">{course.code}</p>
          {(course.description || (courseBasePath.startsWith("/admin/") && (course.shortTitle || course.takeaways))) ? (
            <Disclosure title="Course details" className="mt-2" contentClassName="space-y-2 px-2 pb-2 text-xs leading-5 text-muted-foreground">
              {courseBasePath.startsWith("/admin/") && course.shortTitle ? <p>Short display name: {course.shortTitle}</p> : null}
              {courseBasePath.startsWith("/admin/") && course.takeaways ? <p className="break-words">Takeaways: {course.takeaways}</p> : null}
              {course.description ? <p className="max-w-xl break-words">{course.description}</p> : null}
            </Disclosure>
          ) : null}
        </div>
      ),
    },
    {
      key: "department",
      header: "Department",
      cell: (course) =>
        course.departmentName,
    },
    {
      key: "dependencies",
      header: "Dependencies",
      cell: course=>{
        const count=activeOfferingCountByCourse.get(course.id)??0;
        const lessons=lessonCountByCourse?.[course.id];
        return <span title="Course lesson dependencies and active Offerings to archive before this Course can be archived">
          {lessons===undefined?"":lessons+" lesson"+(lessons===1?"":"s")+" · "}{count} active offering{count===1?"":"s"}
        </span>;
      },
    },
    {
      key: "status",
      header: COLLEGE_COURSES_COPY.studentsSeeIt,
      cell: (course) => (
        <StatusBadge
          tone={
            course.status === "ACTIVE"
              ? "success"
              : "neutral"
          }
        >
          {courseVisibleToStudentsLabel(course.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (course) => (
        <CourseActions
          allowMetadata={courseBasePath.startsWith("/admin/")}
          duplicateHref={courseBasePath+"?duplicate="+encodeURIComponent(course.id)}
          activeOfferingCount={activeOfferingCountByCourse.get(course.id)??0}
          course={{
            id: course.id,
            updatedAt: course.updatedAt.toISOString(),
            name: course.name,
            code: course.code,
            shortTitle:course.shortTitle,
            officialCode:course.officialCode,
            cardColor:course.cardColor,
            takeaways:course.takeaways,
            description:
              course.description,
          }}
        />
      ),
    },
  ];

  const offeringColumns: DataTableColumn<
    Workspace["offerings"][number]
  >[] = [
    {
      key: "course",
      header: "Course",
      cell: (offering) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {offering.courseName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {offering.courseCode} ·{" "}
            {offering.departmentName}
          </p>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Cohort / Period",
      cell: (offering) => (
        <div>
          <p className="m-0 text-sm text-body">
            {offering.cohortName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {offering.academicPeriodName}
          </p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Type / Credits",
      cell: (offering) => (
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone="info">
            {offering.type}
          </StatusBadge>
          <span>
            {offering.credits ?? "—"} credits
          </span>
        </div>
      ),
    },
    {
      key: "deliveries",
      header: "Sections",
      cell: (offering) =>
        deliveryCountByOffering.get(
          offering.id,
        ) ?? 0,
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (offering) => (
        <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] md:flex-row md:flex-wrap md:justify-end">
          {offering.status === "ACTIVE" ? <Link
            href={
              offeringBasePath +
              "/" +
              offering.id
            }
            className="inline-flex min-h-11 md:min-h-9 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:bg-primary-subtle hover:text-primary-text focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] motion-reduce:transition-none"
          >
            Open learning
          </Link> : null}
          {offering.status === "ACTIVE" ? <OfferingActions
            offering={{
              id: offering.id,
              type: offering.type,
              credits: offering.credits,
              displayOrder:
                offering.displayOrder,
              courseName:
                offering.courseName,
            }}
            hideArchive={allowOfferingLifecycle}
          /> : null}
          {allowOfferingLifecycle && offering.status === "ACTIVE" ?
            <CollegeOfferingMetadataAction offering={{
              id:offering.id,courseName:offering.courseName,type:offering.type,
              credits:offering.credits,displayOrder:offering.displayOrder,
              updatedAt:offering.updatedAt.toISOString(),
            }} /> : null}
          {allowOfferingLifecycle ? <CollegeOfferingLifecycleAction
            id={offering.id} name={offering.courseName} status={offering.status} /> : null}
        </div>
      ),
    },
  ];

  const deliveryColumns: DataTableColumn<
    Workspace["deliveries"][number]
  >[] = [
    {
      key: "course",
      header: "Course",
      cell: (delivery) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {delivery.courseName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {delivery.courseCode}
          </p>
        </div>
      ),
    },
    {
      key: "section",
      header: "Section",
      cell: (delivery) => (
        <div>
          <p className="m-0 text-sm text-body">
            {delivery.sectionName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {delivery.sectionCode}
          </p>
        </div>
      ),
    },
    {
      key: "scope",
      header: "Cohort / Period",
      cell: (delivery) => (
        <div>
          <p className="m-0 text-sm text-body">
            {delivery.cohortName}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {delivery.academicPeriodName}
          </p>
        </div>
      ),
    },
    {
      key: "faculty",
      header: "Faculty",
      cell: (delivery) =>
        teacherCountByDelivery.get(
          delivery.id,
        ) ?? 0,
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (delivery) => (
        <DeliveryActions
          delivery={{
            id: delivery.id,
            courseName:
              delivery.courseName,
            sectionName:
              delivery.sectionName,
          }}
        />
      ),
    },
  ];

  const assignmentColumns: DataTableColumn<
    Workspace["teachingAssignments"][number]
  >[] = [
    {
      key: "faculty",
      header: "Faculty",
      cell: (assignment) => (
        <p className="m-0 font-semibold text-foreground">
          {assignment.displayName ??
            "Unnamed Faculty"}
        </p>
      ),
    },
    {
      key: "course",
      header: "Course / Section",
      cell: (assignment) => (
        <div>
          <p className="m-0 text-sm text-body">
            {assignment.courseName} ·{" "}
            {assignment.courseCode}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {assignment.sectionName} ·{" "}
            {assignment.sectionCode}
          </p>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      cell: (assignment) => (
        <StatusBadge
          tone={
            assignment.role === "PRIMARY"
              ? "success"
              : "info"
          }
        >
          {facultyAssignmentRoleLabel(assignment.role)}
        </StatusBadge>
      ),
    },
    {
      key: "started",
      header: "Started",
      cell: (assignment) =>
        new Intl.DateTimeFormat("en-IN", {
          dateStyle: "medium",
          timeZone: "Asia/Kolkata",
        }).format(assignment.startedAt),
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (assignment) => (
        <TeachingAssignmentActions
          assignment={{
            id: assignment.id,
            facultyDisplayName:
              assignment.displayName ??
              "Unnamed Faculty",
            courseName:
              assignment.courseName,
            sectionName:
              assignment.sectionName,
          }}
        />
      ),
    },
  ];

  return (
    <div className="min-w-0 space-y-[var(--lms-space-4)]">
      <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-3)] lg:grid-cols-4">
        <StatTile
          className={collegeStyles.tile}
          label="Courses"
          value={workspace.summary.courses}
          detail=""
        />
        <StatTile
          className={collegeStyles.tile}
          label="Offerings"
          value={workspace.summary.offerings}
          detail=""
        />
        <StatTile
          className={collegeStyles.tile}
          label="Deliveries"
          value={workspace.summary.deliveries}
          detail=""
        />
        <StatTile
          className={collegeStyles.tile}
          label="Teaching assignments"
          value={
            workspace.summary
              .teachingAssignments
          }
          detail=""
        />
      </div>

      <div className={courseBasePath.startsWith("/admin/")?"grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]":"space-y-[var(--lms-space-4)]"}>
      <div id="create-course" className="min-w-0">
      <Disclosure title="Create New Course" defaultOpen={openCreateCourse||Boolean(duplicateCourseId)||courseBasePath.startsWith("/admin/")}
        className="min-w-0 border-y border-[var(--lms-canvas-border)]"
        contentClassName="min-w-0 pb-[var(--lms-space-4)] pt-[var(--lms-space-3)]">
      <AdminCourseCreatePanel
        key={duplicateCourseId??"new-course"}
        duplicateCourseId={duplicateCourseId}
        courseBasePath={courseBasePath}
        departments={workspace.departments}
        periods={workspace.periods}
        cohorts={workspace.cohorts}
        sections={workspace.sections}
        courses={workspace.courses}
        offerings={workspace.offerings.filter(offering => offering.status === "ACTIVE")}
        deliveries={workspace.deliveries}
        faculty={workspace.faculty}
        facultyTruncated={workspace.facultyTruncated}
      />
      </Disclosure>
      </div>

      <section className="min-w-0 space-y-[var(--lms-space-3)]">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            {COLLEGE_COURSES_COPY.existingTitle}
          </h2>
        </div>
        {catalogue && catalogueQuery ? <FilterBar title="Filters"
          activeCount={Number(Boolean(catalogueQuery.q)) + Number(catalogueQuery.sort !== "NAME_ASC")}
          search={<label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
            Search courses
            <Input form="college-course-catalogue-filters" name="q" type="search" maxLength={100}
              defaultValue={catalogueQuery.q} placeholder="Name, code or department"
              className="min-h-11 min-w-0 md:min-h-9"/>
          </label>}
          action={<Button type="submit" form="college-course-catalogue-filters" className="min-h-11 md:min-h-9">Filter</Button>}>
          <form id="college-course-catalogue-filters" method="get" action={courseBasePath}
            className="grid min-w-0 items-end gap-[var(--lms-space-3)] md:grid-cols-2">
            <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Sort
              <Select name="sort" defaultValue={catalogueQuery.sort} className="min-h-11 md:min-h-9">
                <option value="NAME_ASC">Name A–Z</option><option value="NAME_DESC">Name Z–A</option>
                <option value="CODE_ASC">Code A–Z</option><option value="CODE_DESC">Code Z–A</option>
              </Select>
            </label>
            {courseBasePath.startsWith("/admin/") ? <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">
              Per page
              <Select name="pageSize" defaultValue={catalogueQuery.pageSize ?? "25"} className="min-h-11 md:min-h-9">
                <option value="10">10</option><option value="25">25</option><option value="50">50</option><option value="100">100</option>
              </Select>
            </label> : null}
            <div className="flex min-w-0 flex-col gap-[var(--lms-space-2)] md:flex-row md:flex-wrap md:col-span-2">
              <Button type="submit" className="min-h-11 w-full md:hidden">Filter</Button>
              <a href={courseBasePath.startsWith("/admin/") ? "/api/admin/courses/catalogue/export" + collegeCourseCatalogueExportHref(catalogueQuery).replace("/api/academics/college-course-export", "") : collegeCourseCatalogueExportHref(catalogueQuery)} download
                className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] bg-surface px-[var(--lms-space-3)] text-sm font-semibold text-primary-text hover:border-primary hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:w-auto md:min-h-9">
                Export CSV
              </a>
              {courseBasePath.startsWith("/admin/") ? <Link href={collegeCourseCatalogueHref(catalogueQuery).replace("/college/courses", courseBasePath)}
                className="inline-flex min-h-11 items-center justify-center px-[var(--lms-space-3)] text-sm text-body hover:text-primary-text md:min-h-9">Refresh</Link> : null}
              <Link href={courseBasePath} className="inline-flex min-h-11 items-center justify-center px-[var(--lms-space-3)] text-sm text-body hover:text-primary-text md:min-h-9">Clear</Link>
            </div>
          </form>
        </FilterBar> : null}
        {catalogue&&catalogue.total>1000?<p className="text-xs text-muted-foreground">
         Export CSV includes up to the first 1,000 matching courses. Narrow filters to export a smaller set.
        </p>:null}
        {catalogue&&catalogue.total===0?<p role="status" className="text-sm text-muted-foreground">
         No courses match these filters. Clear filters to see the whole catalogue.
        </p>:null}
        {courseBasePath.startsWith("/admin/") ? <SuperAdminCourseBulkVisibility
          key={workspace.collegeId}
          collegeId={workspace.collegeId}
          maxSelection={(() => { const n=Number(process.env.COURSE_BULK_STATUS_MAX??"100"); return Number.isInteger(n)?Math.min(100,Math.max(1,n)):100; })()}
          courses={(catalogue?catalogue.items:workspace.courses).map(course=>({id:course.id,name:course.name}))}/> : null}
        <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show. Create Course and offering above to add the first record.</p>}
          columns={courseColumns}
          rows={catalogue?catalogue.items:workspace.courses}
          getRowKey={(course) => course.id}
        />
        {catalogue&&catalogueQuery?<div className="flex min-w-0 flex-wrap items-center justify-between gap-[var(--lms-space-3)] text-sm">
          <p className="text-muted-foreground">{catalogue.total} matching courses · {catalogue.pageSize} per page</p>
          <Pagination page={catalogue.page} pageCount={catalogue.pages}
            hrefForPage={page => collegeCourseCatalogueHref({...catalogueQuery,page}).replace("/college/courses",courseBasePath)}
            label="Course catalogue pages" showBoundaryLinks={false}/>
         </div>:null}
      </section>
      </div>

      <Disclosure title="Course Offerings" className="min-w-0 border-t border-[var(--lms-canvas-border)]" contentClassName="min-w-0 space-y-[var(--lms-space-3)] pb-[var(--lms-space-4)] pt-[var(--lms-space-3)]">
        <div>
          <h2 className="sr-only">
            Course Offerings
          </h2>
          <p className="mt-1 text-sm text-body">
            Cohort + Academic Period Course
            instances.
          </p>
        </div>
        <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
          columns={offeringColumns}
          rows={workspace.offerings}
          getRowKey={(offering) =>
            offering.id
          }
        />

      </Disclosure>

      <Disclosure title="Section Deliveries" className="min-w-0 border-t border-[var(--lms-canvas-border)]" contentClassName="min-w-0 space-y-[var(--lms-space-3)] pb-[var(--lms-space-4)] pt-[var(--lms-space-3)]">
        <div>
          <h2 className="sr-only">
            Section Deliveries
          </h2>
          <p className="mt-1 text-sm text-body">
            Exact Offering-to-Section teaching
            boundaries.
          </p>
        </div>
        <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
          columns={deliveryColumns}
          rows={workspace.deliveries}
          getRowKey={(delivery) =>
            delivery.id
          }
        />

      </Disclosure>

      <Disclosure title="Teaching Assignments" className="min-w-0 border-t border-[var(--lms-canvas-border)]" contentClassName="min-w-0 space-y-[var(--lms-space-3)] pb-[var(--lms-space-4)] pt-[var(--lms-space-3)]">
        <div>
          <h2 className="sr-only">
            Teaching Assignments
          </h2>
          <p className="mt-1 text-sm text-body">
            Active Faculty ownership for each
            Section Delivery.
          </p>
        </div>
        <DataTable empty={<p className="m-0 text-sm text-muted-foreground">No records to show.</p>}
          columns={assignmentColumns}
          rows={
            workspace.teachingAssignments
          }
          getRowKey={(assignment) =>
            assignment.id
          }
        />

      </Disclosure>
    </div>
  );
}