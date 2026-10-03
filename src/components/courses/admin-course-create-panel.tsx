"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { courseApiError } from "./learner-course-api";

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
type CourseOption = Option & { departmentName: string };
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
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await courseApiError(response));
  return response.json();
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
  faculty,
}: {
  departments: readonly Option[];
  periods: readonly PeriodOption[];
  cohorts: readonly CohortOption[];
  sections: readonly SectionOption[];
  courses: readonly CourseOption[];
  offerings: readonly OfferingOption[];
  deliveries: readonly DeliveryOption[];
  faculty: readonly FacultyOption[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();

  const [courseDepartmentId, setCourseDepartmentId] = useState("");
  const [courseName, setCourseName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [courseDescription, setCourseDescription] = useState("");

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

  function run(task: () => Promise<unknown>, successTitle: string, reset: () => void) {
    startTransition(async () => {
      try {
        await task();
        reset();
        showToast({ tone: "success", title: successTitle });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title: "Course update failed",
          description: error instanceof Error ? error.message : "The request could not be completed.",
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
      "Course created",
      () => { setCourseName(""); setCourseCode(""); setCourseDescription(""); },
    );
  }

  function createOffering(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      () => {
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
      () => { setDeliveryOfferingId(""); setDeliverySectionId(""); },
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
      () => { setTeacherMembershipId(""); setTeacherRole("PRIMARY"); },
    );
  }

  return (
    <section className="grid gap-4 xl:grid-cols-2">
      <form onSubmit={createCourse} className="rounded-xl border border-border bg-surface p-5">
        <h2 className="m-0 text-base font-semibold text-foreground">New Course</h2>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Create the reusable Department-owned Course catalog entry first.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="course-department">Department</FieldLabel>
            <Select id="course-department" value={courseDepartmentId} onChange={(event) => setCourseDepartmentId(event.target.value)} required>
              <option value="">Select Department</option>
              {departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="course-name">Name</FieldLabel>
            <Input id="course-name" value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Data Structures" maxLength={255} required />
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

      <form onSubmit={createOffering} className="rounded-xl border border-border bg-surface p-5">
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

      <form onSubmit={createDelivery} className="rounded-xl border border-border bg-surface p-5">
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

      <form onSubmit={assignTeacher} className="rounded-xl border border-border bg-surface p-5">
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
    </section>
  );
}