"use client";

import { COLLEGE_COURSES_COPY } from "@/modules/courses/college-courses-copy";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";
import {
  type FormEvent,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { apiFetch } from "@/lib/api-fetch";
import {collegeCourseDuplicatePrefill} from "@/modules/courses/college-course-duplicate-model";

type Option = { id: string; name: string; code?: string };
type CohortOption = Option & {
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  programName: string;
  startPeriodId: string;
  expectedEndPeriodId: string | null;
};
type PeriodOption = Option & {
  status: "PLANNED" | "ACTIVE" | "CLOSED";
  startDate: string;
  endDate: string;
};
type SectionOption = Option & { cohortId: string; academicPeriodId: string };
type CourseOption = Option & { code:string; departmentName: string; departmentId:string;description:string|null };
type OfferingOption = {
  id: string;
  courseName: string;
  courseCode: string;
  cohortId: string;
  cohortName: string;
  academicPeriodId: string;
  academicPeriodName: string;
};
type DeliveryOption = {
  id: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
  sectionCode: string;
};
type FacultyOption = {
  membershipId: string;
  displayName: string;
  email: string | null;
};

async function postJson(path: string, body: unknown) {
  return apiFetch<unknown>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createdRecordId(result:unknown,kind:"course"|"offering"|"delivery"){
 if(!result||typeof result!=="object")return null;
 const value=(result as Record<string,unknown>)[kind];
 if(!value||typeof value!=="object")return null;
 const id=(value as Record<string,unknown>).id;
 return typeof id==="string"&&/^[a-f0-9-]{36}$/i.test(id)?id:null;
}
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-body">{children}</label>;
}

export function AdminCourseCreatePanel({
  departments,
  periods,
  cohorts,
  sections,
  courses,
  offerings,
  deliveries,
  faculty,facultyTruncated=false,duplicateCourseId,courseBasePath="/college/courses",
}: {
  departments: readonly Option[];
  periods: readonly PeriodOption[];
  cohorts: readonly CohortOption[];
  sections: readonly SectionOption[];
  courses: readonly CourseOption[];
  offerings: readonly OfferingOption[];
  deliveries: readonly DeliveryOption[];
  faculty: readonly FacultyOption[];
  facultyTruncated?:boolean;
  duplicateCourseId?:string;
  courseBasePath?:string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const {pending,run:guardedRun}=useGuardedAction();
  const [offeringConfirmOpen, setOfferingConfirmOpen] = useState(false);
  const [nextSetupStep,setNextSetupStep]=useState<"COURSE"|"OFFERING"|"DELIVERY"|"FACULTY"|"DONE">("COURSE");

  const copy=collegeCourseDuplicatePrefill(courses,duplicateCourseId);
  const [courseDepartmentId, setCourseDepartmentId] = useState(copy?.departmentId??"");
  const [courseName, setCourseName] = useState(copy?.name??"");
  const [courseCode, setCourseCode] = useState(copy?.code??"");
  const [courseDescription, setCourseDescription] = useState(copy?.description??"");

  const [offeringCourseId, setOfferingCourseId] = useState("");
  const [offeringCohortId, setOfferingCohortId] = useState("");
  const [offeringAcademicPeriodId, setOfferingAcademicPeriodId] = useState("");
  const [offeringType, setOfferingType] = useState<"CORE" | "ELECTIVE">("CORE");
  const [offeringCredits, setOfferingCredits] = useState("");
  const [offeringDisplayOrder, setOfferingDisplayOrder] = useState("0");

  const [deliveryOfferingId, setDeliveryOfferingId] = useState("");
  const [deliverySectionId, setDeliverySectionId] = useState("");

  const [teacherDeliveryId, setTeacherDeliveryId] = useState("");
  const [teacherMembershipId, setTeacherMembershipId] = useState("");
  const [teacherRole, setTeacherRole] = useState<"PRIMARY" | "CO_TEACHER" | "TA">("PRIMARY");

  const selectedOfferingCohort =
    cohorts.find(
      (cohort) =>
        cohort.id === offeringCohortId,
    ) ?? null;
  const cohortStartPeriod =
    selectedOfferingCohort
      ? periods.find(
          (period) =>
            period.id ===
            selectedOfferingCohort.startPeriodId,
        ) ?? null
      : null;
  const cohortEndPeriod =
    selectedOfferingCohort?.expectedEndPeriodId
      ? periods.find(
          (period) =>
            period.id ===
            selectedOfferingCohort.expectedEndPeriodId,
        ) ?? null
      : null;
  const compatiblePeriods = periods.filter(
    (period) =>
      period.status !== "CLOSED" &&
      (!cohortStartPeriod ||
        period.startDate >=
          cohortStartPeriod.startDate) &&
      (!cohortEndPeriod ||
        period.endDate <=
          cohortEndPeriod.endDate),
  );
  const selectedDeliveryOffering = offerings.find((offering) => offering.id === deliveryOfferingId) ?? null;
  const compatibleSections = useMemo(() => {
    if (!selectedDeliveryOffering) return [];
    return sections.filter(
      (section) =>
        section.cohortId === selectedDeliveryOffering.cohortId &&
        section.academicPeriodId === selectedDeliveryOffering.academicPeriodId,
    );
  }, [sections, selectedDeliveryOffering]);

  function run(task: () => Promise<unknown>, successTitle: string, reset: (result:unknown) => void, failureTitle = "Course update failed") {
    void guardedRun(async () => {
      try {
        const result=await task();
        reset(result);
        showToast({ tone: "success", title: successTitle });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title: failureTitle,
          description: academicSetupErrorMessage(error, "The request could not be completed."),
        });
      }
    });
  }

  function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(
      () => postJson("/api/courses", {
        departmentId: courseDepartmentId,
        name: courseName,
        code: courseCode,
        description: courseDescription.trim() || null,
      }),
      COLLEGE_COURSES_COPY.createdMessage(courseName.trim()),
      (result) => { const id=createdRecordId(result,"course");if(id){setOfferingCourseId(id);setNextSetupStep("OFFERING");}
        setCourseName("");setCourseCode("");setCourseDescription("");if(copy)router.replace(courseBasePath); },
      COLLEGE_COURSES_COPY.createFailed,
    );
  }

  function createOffering(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offeringCourseId || !offeringCohortId || !offeringAcademicPeriodId) return;
    setOfferingConfirmOpen(true);
  }

  function commitOffering() {
    run(
      () => postJson("/api/courses/offerings", {
        courseId: offeringCourseId,
        cohortId: offeringCohortId,
        academicPeriodId: offeringAcademicPeriodId,
        type: offeringType,
        credits: offeringCredits ? Number(offeringCredits) : null,
        displayOrder: Number(offeringDisplayOrder),
      }),
      "Course Offering created",
      (result) => {
        const id=createdRecordId(result,"offering");
        if(id){setDeliveryOfferingId(id);setNextSetupStep("DELIVERY");}
        setDeliverySectionId("");
        setOfferingConfirmOpen(false);
        setOfferingCourseId("");
        setOfferingCohortId("");
        setOfferingAcademicPeriodId("");
        setOfferingCredits("");
        setOfferingDisplayOrder("0");
      },
    );
  }

  function createDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(
      () => postJson("/api/courses/deliveries", {
        offeringId: deliveryOfferingId,
        sectionId: deliverySectionId,
      }),
      "Section delivery created",
      (result) => {const id=createdRecordId(result,"delivery");if(id){setTeacherDeliveryId(id);setNextSetupStep("FACULTY");}
        setDeliverySectionId("");},
    );
  }

  function assignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(
      () => postJson("/api/courses/teaching-assignments", {
        deliveryId: teacherDeliveryId,
        membershipId: teacherMembershipId,
        role: teacherRole,
      }),
      "Teaching assignment created",
      () => {setTeacherMembershipId("");setTeacherRole("PRIMARY");setNextSetupStep("DONE");},
    );
  }

  return (
    <section aria-label="Course setup workflow" className="grid gap-4 xl:grid-cols-2">
      <nav aria-label="Course setup steps" className="flex flex-wrap gap-3 rounded-xl border border-border bg-surface p-3 text-sm xl:col-span-2">
       <a href="#setup-course" className="font-semibold text-primary-text underline">1. Create Course</a>
       <a href="#setup-offering" className="font-semibold text-primary-text underline">2. Course Offering</a>
       <a href="#setup-delivery" className="font-semibold text-primary-text underline">3. Section Delivery</a>
       <a href="#setup-faculty" className="font-semibold text-primary-text underline">4. Assign Course Faculty</a>
      </nav>
      <p role="status" className="rounded border border-border bg-surface p-3 text-sm text-body xl:col-span-2">
       {nextSetupStep==="COURSE"?"Start by creating or choosing a Course.":
        nextSetupStep==="OFFERING"?"Course created. Choose a Cohort and Academic Period for its Offering.":
        nextSetupStep==="DELIVERY"?"Offering created. Choose the compatible Section for the Delivery.":
        nextSetupStep==="FACULTY"?"Section Delivery created. Assign Faculty to that Section.":
        "Teaching assignment saved. The Course setup flow is complete."}
      </p>
      <form id="setup-course" onSubmit={createCourse} className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">{COLLEGE_COURSES_COPY.createTitle}</h2>
        {departments.length===0?<p role="status" className="mt-3 text-sm text-body">
          No departments in this college yet. Create a department before adding a course.{" "}
          <Link className="font-semibold text-primary-text underline" href={courseBasePath.startsWith("/admin/")?"/admin/departments":"/college/departments"}>Go to Departments</Link>
        </p>:null}
        {copy?<div className="mt-3 flex flex-wrap items-center gap-3 rounded border border-border bg-surface-subtle p-3">
          <strong>Duplicating “{copy.name}”</strong>
          <button type="button" className="font-semibold text-primary-text underline" onClick={()=>router.replace(courseBasePath)}>Cancel copy</button>
          <p className="w-full text-xs text-muted-foreground">Only catalog name, code, description and department are copied. Existing course content, offerings and assignments are not copied.</p>
        </div>:null}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="course-department">{COLLEGE_COURSES_COPY.departmentLabel}</FieldLabel>
            <Select id="course-department" value={courseDepartmentId} onChange={(event) => setCourseDepartmentId(event.target.value)} required>
              <option value="">Select Department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="course-name">{COLLEGE_COURSES_COPY.nameLabel}</FieldLabel>
            <Input id="course-name" value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder={COLLEGE_COURSES_COPY.namePlaceholder} maxLength={255} required />
          </div>
          <div>
            <FieldLabel htmlFor="course-code">Code</FieldLabel>
            <Input id="course-code" value={courseCode} onChange={(event) => setCourseCode(event.target.value)} placeholder="CS201" maxLength={64} required />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="course-description">Description</FieldLabel>
            <Textarea id="course-description" className="min-h-24" value={courseDescription} onChange={(event) => setCourseDescription(event.target.value)} maxLength={5000} placeholder="Optional Course description" />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={pending || !courseDepartmentId || !courseName.trim() || !courseCode.trim()}>Create Course</Button>
        </div>
      </form>

      <form id="setup-offering" onSubmit={createOffering} className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">New Course Offering</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Place a Course into one Cohort and Academic Period.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="offering-course">Course</FieldLabel>
            <Select id="offering-course" value={offeringCourseId} onChange={(event) => setOfferingCourseId(event.target.value)} required>
              <option value="">Select Course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name} · {course.code} · {course.departmentName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-cohort">Cohort</FieldLabel>
            <Select id="offering-cohort" value={offeringCohortId} onChange={(event) => { setOfferingCohortId(event.target.value); setOfferingAcademicPeriodId(""); }} required>
              <option value="">Select Cohort</option>
              {cohorts.filter((cohort) => cohort.status === "PLANNED" || cohort.status === "ACTIVE").map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name} · {cohort.programName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-period">Academic Period</FieldLabel>
            <Select id="offering-period" value={offeringAcademicPeriodId} onChange={(event) => setOfferingAcademicPeriodId(event.target.value)} required>
              <option value="">Select Period</option>
              {compatiblePeriods.map((period) => <option key={period.id} value={period.id}>{period.name} · {period.code}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-type">Type</FieldLabel>
            <Select id="offering-type" value={offeringType} onChange={(event) => setOfferingType(event.target.value as "CORE" | "ELECTIVE")}>
              <option value="CORE">Core</option>
              <option value="ELECTIVE">Elective</option>
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-credits">Credits</FieldLabel>
            <Input id="offering-credits" type="number" min={1} max={30} value={offeringCredits} onChange={(event) => setOfferingCredits(event.target.value)} placeholder="Optional" />
          </div>
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="offering-order">Display order</FieldLabel>
            <Input id="offering-order" type="number" min={0} max={10000} value={offeringDisplayOrder} onChange={(event) => setOfferingDisplayOrder(event.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={pending || !offeringCourseId || !offeringCohortId || !offeringAcademicPeriodId}>Create Offering</Button>
        </div>
      </form>

      <form id="setup-delivery" onSubmit={createDelivery} className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">Add Section Delivery</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Connect an Offering to an exact Section. Only structurally compatible Sections are shown.</p>
        <div className="mt-4 grid gap-3">
          <div>
            <FieldLabel htmlFor="delivery-offering">Offering</FieldLabel>
            <Select id="delivery-offering" value={deliveryOfferingId} onChange={(event) => { setDeliveryOfferingId(event.target.value); setDeliverySectionId(""); }} required>
              <option value="">Select Offering</option>
              {offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.courseName} · {offering.cohortName} · {offering.academicPeriodName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="delivery-section">Section</FieldLabel>
            <Select id="delivery-section" value={deliverySectionId} onChange={(event) => setDeliverySectionId(event.target.value)} disabled={!deliveryOfferingId} required>
              <option value="">{deliveryOfferingId ? "Select compatible Section" : "Select Offering first"}</option>
              {compatibleSections.map((section) => <option key={section.id} value={section.id}>{section.name} · {section.code}</option>)}
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={pending || !deliveryOfferingId || !deliverySectionId}>Add Section Delivery</Button>
        </div>
      </form>

      <form id="setup-faculty" onSubmit={assignTeacher} className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">Assign Course Faculty</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Assign an active Faculty Membership to one exact Section Delivery.</p>
        <div className="mt-4 grid gap-3">
          <div>
            <FieldLabel htmlFor="teacher-delivery">Section Delivery</FieldLabel>
            <Select id="teacher-delivery" value={teacherDeliveryId} onChange={(event) => setTeacherDeliveryId(event.target.value)} required>
              <option value="">Select Delivery</option>
              {deliveries.map((delivery) => <option key={delivery.id} value={delivery.id}>{delivery.courseName} · {delivery.sectionName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="teacher-membership">Faculty</FieldLabel>
            <Select id="teacher-membership" value={teacherMembershipId} onChange={(event) => setTeacherMembershipId(event.target.value)} required>
              <option value="">Select Faculty</option>
              {faculty.map((person) => <option key={person.membershipId} value={person.membershipId}>{person.displayName}{person.email ? " · " + person.email : ""}</option>)}
            </Select>
            {facultyTruncated?<p role="status" className="mt-1 text-xs text-muted-foreground">
             Showing only the first 500 active Faculty accounts. Faculty beyond this list cannot be selected in this picker.
            </p>:null}
          </div>
          <div>
            <FieldLabel htmlFor="teacher-role">Teaching role</FieldLabel>
            <Select id="teacher-role" value={teacherRole} onChange={(event) => setTeacherRole(event.target.value as "PRIMARY" | "CO_TEACHER" | "TA")}>
              <option value="PRIMARY">Primary</option>
              <option value="CO_TEACHER">Co-teacher</option>
              <option value="TA">Teaching assistant</option>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" disabled={pending || !teacherDeliveryId || !teacherMembershipId}>Assign Faculty</Button>
        </div>
      </form>
      <ConfirmDialog
        open={offeringConfirmOpen}
        onOpenChange={setOfferingConfirmOpen}
        title="Create this Course Offering?"
        description="This binds the selected course, cohort and academic period. Duplicate active bindings and incompatible periods are rejected by the server."
        confirmLabel="Create Offering"
        pending={pending}
        onConfirm={commitOffering}
      />
    </section>
  );
}