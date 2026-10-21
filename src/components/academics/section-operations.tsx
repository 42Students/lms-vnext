"use client";

import { formatDateIst, formatDateTimeIst } from "@/lib/format-date";
import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Disclosure } from "@/components/ui/disclosure";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";

type Choice = {
  membershipId: string;
  displayName: string | null;
};

type ProgramEnrollment = {
  id: string;
  membershipId: string;
  status: "ACTIVE" | "COMPLETED" | "WITHDRAWN";
  displayName: string | null;
  admittedAt: string;
  completedAt: string | null;
  withdrawnAt: string | null;
};

type RosterRow = {
  id: string;
  learnerEnrollmentId: string;
  membershipId: string;
  displayName: string | null;
  academicPeriodId: string;
  status:
    | "ACTIVE"
    | "COMPLETED"
    | "MOVED"
    | "WITHDRAWN";
  startedAt: string;
  endedAt: string | null;
};

type FacultyAssignment = {
  id: string;
  membershipId: string;
  displayName: string | null;
  role: "ADVISOR" | "COORDINATOR";
  startedAt: string;
  endedAt: string | null;
};

type CourseChoice = {
  deliveryId: string;
  courseId: string;
  courseName: string;
  courseCode: string;
};

type ScheduleEvent = {
  id: string;
  facultyMembershipId: string | null;
  facultyName: string | null;
  deliveryId: string | null;
  courseId: string | null;
  courseName: string | null;
  courseCode: string | null;
  title: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  location: string | null;
  status: "SCHEDULED" | "CANCELLED";
};

async function request(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
) {
  const response = await fetch(path, {
    method,
    headers:
      body === undefined
        ? undefined
        : { "content-type": "application/json" },
    body:
      body === undefined
        ? undefined
        : JSON.stringify(body),
  });
  const payload = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      payload?.error ?? "REQUEST_FAILED",
    );
  }

  return payload;
}

function readableStatus(
  status: string,
) {
  return status
    .toLowerCase()
    .split("_")
    .map(
      (part) =>
        part.charAt(0).toUpperCase() +
        part.slice(1),
    )
    .join(" ");
}

function statusTone(status: string) {
  switch (status) {
    case "ACTIVE":
    case "SCHEDULED":
      return "success" as const;
    case "PLANNED":
      return "warning" as const;
    case "MOVED":
    case "COMPLETED":
      return "info" as const;
    case "WITHDRAWN":
    case "CANCELLED":
      return "neutral" as const;
    default:
      return "neutral" as const;
  }
}

function SectionEmpty({ href, label }: { href: string; label: string }) {
  return <EmptyState title="No records to show" action={
    <a href={href} className="inline-flex min-h-11 items-center font-semibold text-[var(--lms-link-text)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">{label}</a>
  } />;
}

export function SectionOperations({
  section,
  programEnrollments,
  roster,
  facultyAssignments,
  scheduleEvents,
  learnerChoices,
  facultyChoices,
  courseChoices,
}: {
  section: {
    id: string;
    name: string;
    code: string;
    capacity: number | null;
    cohortId: string;
    cohortName: string;
    programId: string;
    programName: string;
    academicPeriodName: string;
    academicPeriodCode: string;
    academicPeriodStatus:
      | "PLANNED"
      | "ACTIVE"
      | "CLOSED";
    startDate: string;
    endDate: string;
  };
  programEnrollments: readonly ProgramEnrollment[];
  roster: readonly RosterRow[];
  facultyAssignments: readonly FacultyAssignment[];
  scheduleEvents: readonly ScheduleEvent[];
  learnerChoices: readonly Choice[];
  facultyChoices: readonly Choice[];
  courseChoices: readonly CourseChoice[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, startTransition] =
    useTransition();

  const [learnerMembershipId, setLearnerMembershipId] =
    useState("");
  const [placementEnrollmentId, setPlacementEnrollmentId] =
    useState("");
  const [facultyMembershipId, setFacultyMembershipId] =
    useState("");
  const [facultyRole, setFacultyRole] =
    useState<"ADVISOR" | "COORDINATOR">(
      "ADVISOR",
    );
  const [eventFacultyId, setEventFacultyId] =
    useState("");
  const [eventDeliveryId, setEventDeliveryId] =
    useState("");
  const [eventTitle, setEventTitle] =
    useState("");
  const [eventStart, setEventStart] =
    useState("");
  const [eventEnd, setEventEnd] =
    useState("");
  const [eventLocation, setEventLocation] =
    useState("");
  const [scheduleOpen,setScheduleOpen]=useState(false);
  const [discardScheduleOpen,setDiscardScheduleOpen]=useState(false);
  const scheduleDirty=Boolean(eventTitle.trim()||eventStart||eventEnd||eventLocation.trim()||eventFacultyId||eventDeliveryId);
  function closeSchedule(){if(pending)return;if(scheduleDirty)setDiscardScheduleOpen(true);else setScheduleOpen(false);}
  function resetSchedule(){setEventTitle("");setEventStart("");setEventEnd("");setEventLocation("");setEventFacultyId("");setEventDeliveryId("");}

  const activeEnrollmentMemberships = new Set(
    programEnrollments
      .filter(
        (enrollment) =>
          enrollment.status === "ACTIVE",
      )
      .map(
        (enrollment) => enrollment.membershipId,
      ),
  );

  function run(
    task: () => Promise<unknown>,
    title: string,
    reset?: () => void,
  ) {
    startTransition(async () => {
      try {
        await task();
        reset?.();
        showToast({
          tone: "success",
          title,
        });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title: "Academic operation failed",
          description:
            error instanceof Error
              ? error.message
              : "The request could not be completed.",
        });
      }
    });
  }

  const enrollmentColumns: DataTableColumn<ProgramEnrollment>[] = [
    {
      key: "learner",
      mobilePriority: "primary",
      header: "Learner",
      cell: (row: ProgramEnrollment) => (
        <span className="font-semibold text-foreground">
          {row.displayName || "Learner"}
        </span>
      ),
    },
    {
      key: "status",
      mobilePriority: "secondary",
      header: "Program status",
      cell: (row: ProgramEnrollment) => (
        <StatusBadge tone={statusTone(row.status)}>
          {readableStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: ProgramEnrollment) =>
        row.status === "ACTIVE" ? (
          <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-2)] md:flex md:flex-wrap md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              size="md"
             
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    request(
                      `/api/academics/enrollments/${row.id}`,
                      "PATCH",
                      { action: "COMPLETE" },
                    ),
                  "Program enrollment completed",
                )
              }
            >
              Complete
            </Button>
            <Button
              size="md"
             
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    request(
                      `/api/academics/enrollments/${row.id}`,
                      "PATCH",
                      { action: "WITHDRAW" },
                    ),
                  "Program enrollment withdrawn",
                )
              }
            >
              Withdraw
            </Button>
          </div>
        ) : null,
    },
  ];

  const rosterColumns: DataTableColumn<RosterRow>[] = [
    {
      key: "learner",
      mobilePriority: "primary",
      header: "Learner",
      cell: (row: RosterRow) => (
        <span className="font-semibold text-foreground">
          {row.displayName || "Learner"}
        </span>
      ),
    },
    {
      key: "status",
      mobilePriority: "secondary",
      header: "Section history",
      cell: (row: RosterRow) => (
        <StatusBadge tone={statusTone(row.status)}>
          {readableStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "started",
      header: "Started",
      cell: (row: RosterRow) =>
        formatDateIst(row.startedAt),
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: RosterRow) =>
        row.status === "ACTIVE" ? (
          <div className="grid min-w-0 grid-cols-2 gap-[var(--lms-space-2)] md:flex md:flex-wrap md:justify-end [&>button]:w-full md:[&>button]:w-auto">
            <Button
              size="md"
             
              variant="secondary"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    request(
                      `/api/academics/section-enrollments/${row.id}`,
                      "PATCH",
                      { action: "COMPLETE" },
                    ),
                  "Section placement completed",
                )
              }
            >
              Complete
            </Button>
            <Button
              size="md"
             
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(
                  () =>
                    request(
                      `/api/academics/section-enrollments/${row.id}`,
                      "PATCH",
                      { action: "WITHDRAW" },
                    ),
                  "Section placement withdrawn",
                )
              }
            >
              Withdraw
            </Button>
          </div>
        ) : null,
    },
  ];

  const facultyColumns: DataTableColumn<FacultyAssignment>[] = [
    {
      key: "faculty",
      mobilePriority: "primary",
      header: "Faculty",
      cell: (row: FacultyAssignment) => (
        <span className="font-semibold text-foreground">
          {row.displayName || "Faculty"}
        </span>
      ),
    },
    {
      key: "role",
      mobilePriority: "secondary",
      header: "Responsibility",
      cell: (row: FacultyAssignment) => (
        <StatusBadge
          tone={row.endedAt ? "neutral" : "info"}
        >
          {row.role}
        </StatusBadge>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: FacultyAssignment) =>
        row.endedAt ? "Ended" : "Active",
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: FacultyAssignment) =>
        !row.endedAt ? (
          <Button
            size="md"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  request(
                    `/api/academics/faculty-assignments/${row.id}`,
                    "DELETE",
                  ),
                "Faculty responsibility ended",
              )
            }
          >
            End
          </Button>
        ) : null,
    },
  ];

  const scheduleColumns: DataTableColumn<ScheduleEvent>[] = [
    {
      key: "event",
      mobilePriority: "primary",
      header: "Event",
      cell: (row: ScheduleEvent) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {row.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground leading-[20px]">
            {[
              row.courseName
                ? `${row.courseName}${row.courseCode ? ` · ${row.courseCode}` : ""}`
                : "General Section event",
              row.facultyName || null,
              row.location || "No location",
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      ),
    },
    {
      key: "time",
      mobilePriority: "secondary",
      header: "Time",
      cell: (row: ScheduleEvent) => (
        <span>
          {formatDateTimeIst(row.startsAt)}
          {" → "}
          {formatDateTimeIst(row.endsAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row: ScheduleEvent) => (
        <StatusBadge tone={statusTone(row.status)}>
          {readableStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      mobilePriority: "action",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: ScheduleEvent) =>
        row.status === "SCHEDULED" ? (
          <Button
            size="md"
            variant="ghost"
            disabled={pending}
            onClick={() =>
              run(
                () =>
                  request(
                    `/api/academics/schedule-events/${row.id}`,
                    "PATCH",
                    { action: "CANCEL" },
                  ),
                "Class schedule deleted successfully (cancelled in history)",
              )
            }
          >
            Cancel
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="min-w-0 space-y-[var(--lms-space-5)]">
      <section aria-label="Section summary" className="grid min-w-0 gap-[var(--lms-space-3)] border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-4)] grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-[20px]">
            Program
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {section.programName}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-[20px]">
            Cohort
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {section.cohortName}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-[20px]">
            Period
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {section.academicPeriodName}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-[20px]">
            Capacity
          </p>
          <p className="mt-2 font-semibold tabular-nums text-[var(--lms-body-text)]">
            {section.capacity ?? "Unlimited"}
          </p>
        </div>
      </section>

      <section className="min-w-0 space-y-[var(--lms-space-4)]">
        <div>
          <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
            Learner progression
          </h2>
          <p className="mt-1 text-sm text-body leading-[22px]">
            Admit learners to the Program, then place or move them into this Section. History is retained automatically.
          </p>
        </div>

        <div className="grid min-w-0 items-start gap-[var(--lms-space-4)] xl:grid-cols-2">
          <Disclosure id="section-admit-learner" title="Admit learner to Program" className="min-w-0" contentClassName="pb-[var(--lms-space-4)]">
            <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center [&>button]:w-full lg:[&>button]:w-auto">
              <Select className="min-w-0 flex-1"
                aria-label="Learner to admit to program"
                value={learnerMembershipId}
                onChange={(event) =>
                  setLearnerMembershipId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select learner
                </option>
                {learnerChoices
                  .filter(
                    (choice) =>
                      !activeEnrollmentMemberships.has(
                        choice.membershipId,
                      ),
                  )
                  .map((choice) => (
                    <option
                      key={choice.membershipId}
                      value={choice.membershipId}
                    >
                      {choice.displayName ||
                        "Learner"}
                    </option>
                  ))}
              </Select>
              <Button
                disabled={
                  pending || !learnerMembershipId
                }
                onClick={() =>
                  run(
                    () =>
                      request(
                        "/api/academics/enrollments",
                        "POST",
                        {
                          membershipId:
                            learnerMembershipId,
                          programId: section.programId,
                          cohortId: section.cohortId,
                        },
                      ),
                    "Learner admitted to Program",
                    () =>
                      setLearnerMembershipId(""),
                  )
                }
              >
                Admit
              </Button>
            </div>
          </Disclosure>

          <Disclosure id="section-place-learner" title="Place learner in this Section" className="min-w-0" contentClassName="pb-[var(--lms-space-4)]">
            <div className="mt-[var(--lms-space-3)] grid min-w-0 gap-[var(--lms-space-3)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center [&>button]:w-full lg:[&>button]:w-auto">
              <Select className="min-w-0 flex-1"
                aria-label="Active program enrollment to place in section"
                value={placementEnrollmentId}
                onChange={(event) =>
                  setPlacementEnrollmentId(
                    event.target.value,
                  )
                }
              >
                <option value="">
                  Select active Program enrollment
                </option>
                {programEnrollments
                  .filter(
                    (enrollment) =>
                      enrollment.status ===
                      "ACTIVE",
                  )
                  .map((enrollment) => (
                    <option
                      key={enrollment.id}
                      value={enrollment.id}
                    >
                      {enrollment.displayName ||
                        "Learner"}
                    </option>
                  ))}
              </Select>
              <Button
                disabled={
                  pending ||
                  !placementEnrollmentId
                }
                onClick={() =>
                  run(
                    () =>
                      request(
                        "/api/academics/section-enrollments",
                        "POST",
                        {
                          learnerEnrollmentId:
                            placementEnrollmentId,
                          sectionId: section.id,
                        },
                      ),
                    "Learner placed in Section",
                    () =>
                      setPlacementEnrollmentId(
                        "",
                      ),
                  )
                }
              >
                Place / move
              </Button>
            </div>
          </Disclosure>
        </div>

        <div className="min-w-0 space-y-[var(--lms-space-3)]">
          <h3 className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
            Program enrollments
          </h3>
          <DataTable empty={<SectionEmpty href="#section-admit-learner" label="Admit learner to Program" />}
            columns={enrollmentColumns}
            rows={programEnrollments}
            getRowKey={(row) => row.id}
          />
        </div>

        <div className="min-w-0 space-y-[var(--lms-space-3)]">
          <h3 id="section-roster" className="m-0 text-sm font-semibold text-[var(--lms-heading)]">
            Section roster history
          </h3>
          <DataTable empty={<SectionEmpty href="#section-place-learner" label="Place learner in this Section" />}
            columns={rosterColumns}
            rows={roster}
            getRowKey={(row) => row.id}
          />
        </div>
      </section>

      <section className="min-w-0 space-y-[var(--lms-space-4)]">
        <div>
          <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
            Faculty responsibilities
          </h2>
          <p className="mt-1 text-sm text-body leading-[22px]">
            Section-level Advisor/Coordinator roles only. Course teaching assignments belong to Courses.
          </p>
        </div>

        <Disclosure id="section-faculty-responsibility" title="Faculty responsibility" className="min-w-0" contentClassName="pb-[var(--lms-space-4)]">
        <div className="grid min-w-0 items-center gap-[var(--lms-space-3)] md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] [&>button]:w-full xl:[&>button]:w-auto">
          <Select className="min-w-0 flex-1"
            aria-label="Faculty member to assign"
            value={facultyMembershipId}
            onChange={(event) =>
              setFacultyMembershipId(
                event.target.value,
              )
            }
          >
            <option value="">
              Select Faculty
            </option>
            {facultyChoices.map((choice) => (
              <option
                key={choice.membershipId}
                value={choice.membershipId}
              >
                {choice.displayName || "Faculty"}
              </option>
            ))}
          </Select>
          <Select className="min-w-0 flex-1"
            aria-label="Faculty responsibility"
            value={facultyRole}
            onChange={(event) =>
              setFacultyRole(
                event.target.value as "ADVISOR" | "COORDINATOR",
              )
            }
          >
            <option value="ADVISOR">Advisor</option>
            <option value="COORDINATOR">
              Coordinator
            </option>
          </Select>
          <Button
            disabled={
              pending || !facultyMembershipId
            }
            onClick={() =>
              run(
                () =>
                  request(
                    "/api/academics/faculty-assignments",
                    "POST",
                    {
                      sectionId: section.id,
                      membershipId:
                        facultyMembershipId,
                      role: facultyRole,
                    },
                  ),
                "Faculty responsibility assigned",
                () =>
                  setFacultyMembershipId(""),
              )
            }
          >
            Assign
          </Button>
        </div>
        </Disclosure>

        <DataTable empty={<SectionEmpty href="#section-faculty-responsibility" label="Faculty responsibility" />}
          columns={facultyColumns}
          rows={facultyAssignments}
          getRowKey={(row) => row.id}
        />
      </section>

      <section className="min-w-0 space-y-[var(--lms-space-4)]">
        <div>
          <h2 id="section-schedule" className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">
            Section schedule
          </h2>
          <p className="mt-1 text-sm text-body leading-[22px]">
            Section calendar for {section.startDate} → {section.endDate}. Attendance and roster details remain restricted to staff with section access. Link teaching sessions to a Course delivery for faculty and learner calendars.
          </p>
        </div>

        <Button type="button" variant="primary" onClick={()=>setScheduleOpen(true)} className="min-h-11 w-full sm:w-auto md:min-h-9">+ Schedule class</Button>
        <Dialog open={scheduleOpen} onOpenChange={next=>next?setScheduleOpen(true):closeSchedule()}
          title="Schedule class" description={"Set a schedule for "+section.name+" · "+section.programName}
          dismissible={!pending} className="!max-w-[620px]" bodyClassName="max-h-[75dvh] overflow-y-auto"
          footer={<div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="secondary" disabled={pending} onClick={closeSchedule}>Cancel</Button>
            <Button type="button" disabled={pending||!eventTitle.trim()||!eventStart||!eventEnd}
              onClick={()=>run(()=>request("/api/academics/schedule-events","POST",{
                sectionId:section.id,facultyMembershipId:eventFacultyId||null,deliveryId:eventDeliveryId||null,
                title:eventTitle,startsAt:new Date(eventStart).toISOString(),endsAt:new Date(eventEnd).toISOString(),
                location:eventLocation.trim()||null,
              }),"Class schedule created successfully",()=>{resetSchedule();setScheduleOpen(false);})}>
              {pending?"Saving…":"Save class"}
            </Button>
          </div>}>
        <div className="grid min-w-0 items-start gap-[var(--lms-space-4)] pt-[var(--lms-space-3)] sm:grid-cols-1 md:grid-cols-2 [&_input]:min-w-0">
          <div>
            <label
              htmlFor="schedule-title"
              className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Title
            </label>
            <Input
              id="schedule-title"
              value={eventTitle}
              onChange={(event) =>
                setEventTitle(event.target.value)
              }
              placeholder="Orientation"
            />
          </div>
          <div>
            <label
              htmlFor="schedule-start"
              className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Starts
            </label>
            <Input
              id="schedule-start"
              type="datetime-local"
              value={eventStart}
              onChange={(event) =>
                setEventStart(event.target.value)
              }
            />
          </div>
          <div>
            <label
              htmlFor="schedule-end"
              className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Ends
            </label>
            <Input
              id="schedule-end"
              type="datetime-local"
              value={eventEnd}
              onChange={(event) =>
                setEventEnd(event.target.value)
              }
            />
          </div>
          <div>
            <label
              htmlFor="schedule-location"
              className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Location
            </label>
            <Input
              id="schedule-location"
              value={eventLocation}
              onChange={(event) =>
                setEventLocation(
                  event.target.value,
                )
              }
              placeholder="Room 101"
            />
          </div>
          <div>
            <label
              htmlFor="schedule-course"
              className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Course · optional
            </label>
            <Select
              id="schedule-course"
              value={eventDeliveryId}
              onChange={(event) =>
                setEventDeliveryId(
                  event.target.value,
                )
              }
            >
              <option value="">
                General Section event
              </option>
              {courseChoices.map((choice) => (
                <option
                  key={choice.deliveryId}
                  value={choice.deliveryId}
                >
                  {choice.courseName} · {choice.courseCode}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label
              htmlFor="schedule-faculty"
              className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]"
            >
              Faculty · optional
            </label>
            <Select
              id="schedule-faculty"
              value={eventFacultyId}
              onChange={(event) =>
                setEventFacultyId(
                  event.target.value,
                )
              }
            >
              <option value="">
                No Faculty
              </option>
              {facultyChoices.map((choice) => (
                <option
                  key={choice.membershipId}
                  value={choice.membershipId}
                >
                  {choice.displayName || "Faculty"}
                </option>
              ))}
            </Select>
          </div>
        </div>
        </Dialog>
        <ConfirmDialog open={discardScheduleOpen} onOpenChange={setDiscardScheduleOpen}
          title="Discard class schedule?" description="Your unsaved schedule class details will be lost."
          confirmLabel="Discard changes" confirmVariant="danger" onConfirm={()=>{resetSchedule();setScheduleOpen(false);setDiscardScheduleOpen(false);}}/>


        <DataTable empty={<EmptyState title="No class schedules" description="Use Schedule class to create the first event." />}
          columns={scheduleColumns}
          rows={scheduleEvents}
          getRowKey={(row) => row.id}
        />
      </section>
    </div>
  );
}
