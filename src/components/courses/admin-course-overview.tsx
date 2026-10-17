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
import type {
  getAdminCourseWorkspace,
} from "@/modules/courses/admin-course-workspace";
import { AdminCourseCreatePanel } from "./admin-course-create-panel";
import {
  CourseActions,
  DeliveryActions,
  OfferingActions,
  TeachingAssignmentActions,
} from "./admin-course-actions";

type Workspace = Awaited<
  ReturnType<typeof getAdminCourseWorkspace>
>;

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <p className="m-0 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      {detail ? <p className="mt-1 text-xs leading-5 text-body">
        {detail}
      </p> : null}
    </section>
  );
}

export function AdminCourseOverview({
  workspace,
  offeringBasePath,
  allowOfferingLifecycle = false,
  duplicateCourseId,catalogueQuery,catalogueData,courseBasePath="/college/courses",lessonCountByCourse,
}: {
  workspace: Workspace;
  offeringBasePath: string;
  allowOfferingLifecycle?: boolean;
  duplicateCourseId?:string;
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
          <p className="mt-1 text-xs font-semibold text-primary-text">
            {course.code}
          </p>
          {course.description ? (
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              {course.description}
            </p>
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
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (course) => (
        <CourseActions
          duplicateHref={courseBasePath+"?duplicate="+encodeURIComponent(course.id)}
          activeOfferingCount={activeOfferingCountByCourse.get(course.id)??0}
          course={{
            id: course.id,
            name: course.name,
            code: course.code,
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
      header: (
        <span className="sr-only">
          Actions
        </span>
      ),
      className: "text-right",
      cell: (offering) => (
        <div className="flex flex-wrap justify-end gap-2">
          {offering.status === "ACTIVE" ? <Link
            href={
              offeringBasePath +
              "/" +
              offering.id
            }
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-border bg-surface px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-primary-subtle hover:text-primary-text"
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
        }).format(assignment.startedAt),
    },
    {
      key: "actions",
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
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Courses"
          value={workspace.summary.courses}
          detail=""
        />
        <Metric
          label="Offerings"
          value={workspace.summary.offerings}
          detail=""
        />
        <Metric
          label="Deliveries"
          value={workspace.summary.deliveries}
          detail=""
        />
        <Metric
          label="Teaching assignments"
          value={
            workspace.summary
              .teachingAssignments
          }
          detail=""
        />
      </div>

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

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            {COLLEGE_COURSES_COPY.existingTitle}
          </h2>
        </div>
        {catalogue&&catalogueQuery?<form method="get" action={courseBasePath}
         className="flex flex-wrap items-end gap-3 rounded border border-border bg-surface p-3">
         <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold">Search courses
          <input type="search" name="q" maxLength={100} defaultValue={catalogueQuery.q}
           placeholder="Name, code or department" className="min-h-10 rounded border border-border bg-background p-2"/>
         </label>
         <label className="grid gap-1 text-sm font-semibold">Sort
          <select name="sort" defaultValue={catalogueQuery.sort}
           className="min-h-10 rounded border border-border bg-background p-2">
           <option value="NAME_ASC">Name A–Z</option><option value="NAME_DESC">Name Z–A</option>
           <option value="CODE_ASC">Code A–Z</option><option value="CODE_DESC">Code Z–A</option>
          </select>
         </label>
         <button type="submit" className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary">Filter</button>
         <a href={courseBasePath.startsWith("/admin/")?"/api/admin/courses/catalogue/export"+collegeCourseCatalogueExportHref(catalogueQuery).replace("/api/academics/college-course-export",""):collegeCourseCatalogueExportHref(catalogueQuery)} download
          className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm font-semibold text-primary-text">
          Export CSV
         </a>
         <Link className="inline-flex min-h-10 items-center rounded border border-border px-3 text-sm" href={courseBasePath}>Clear</Link>
        </form>:null}
        {catalogue&&catalogue.total>1000?<p className="text-xs text-muted-foreground">
         Export CSV includes up to the first 1,000 matching courses. Narrow filters to export a smaller set.
        </p>:null}
        {catalogue&&catalogue.total===0?<p role="status" className="text-sm text-muted-foreground">
         No courses match these filters. Clear filters to see the whole catalogue.
        </p>:null}
        <DataTable
          columns={courseColumns}
          rows={catalogue?catalogue.items:workspace.courses}
          getRowKey={(course) => course.id}
        />
        {catalogue&&catalogueQuery?<nav aria-label="Course catalogue pages"
          className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-muted-foreground">{catalogue.total} matching courses · page {catalogue.page} of {catalogue.pages} · 25 per page</p>
          <div className="flex gap-3">
           {catalogue.page>1?<Link className="font-semibold text-primary-text"
            href={collegeCourseCatalogueHref({...catalogueQuery,page:catalogue.page-1}).replace("/college/courses",courseBasePath)}>Previous</Link>:null}
           {catalogue.page<catalogue.pages?<Link className="font-semibold text-primary-text"
            href={collegeCourseCatalogueHref({...catalogueQuery,page:catalogue.page+1}).replace("/college/courses",courseBasePath)}>Next</Link>:null}
          </div>
         </nav>:null}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Course Offerings
          </h2>
          <p className="mt-1 text-sm text-body">
            Cohort + Academic Period Course
            instances.
          </p>
        </div>
        <DataTable
          columns={offeringColumns}
          rows={workspace.offerings}
          getRowKey={(offering) =>
            offering.id
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Section Deliveries
          </h2>
          <p className="mt-1 text-sm text-body">
            Exact Offering-to-Section teaching
            boundaries.
          </p>
        </div>
        <DataTable
          columns={deliveryColumns}
          rows={workspace.deliveries}
          getRowKey={(delivery) =>
            delivery.id
          }
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Teaching Assignments
          </h2>
          <p className="mt-1 text-sm text-body">
            Active Faculty ownership for each
            Section Delivery.
          </p>
        </div>
        <DataTable
          columns={assignmentColumns}
          rows={
            workspace.teachingAssignments
          }
          getRowKey={(assignment) =>
            assignment.id
          }
        />
      </section>
    </div>
  );
}