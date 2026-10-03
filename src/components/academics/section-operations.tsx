"use client";

import {
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
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

type ScheduleEvent = {
  id: string;
  facultyMembershipId: string | null;
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

export function SectionOperations({
  section,
  programEnrollments,
  roster,
  facultyAssignments,
  scheduleEvents,
  learnerChoices,
  facultyChoices,
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
  const [eventTitle, setEventTitle] =
    useState("");
  const [eventStart, setEventStart] =
    useState("");
  const [eventEnd, setEventEnd] =
    useState("");
  const [eventLocation, setEventLocation] =
    useState("");

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

  const enrollmentColumns = [
    {
      key: "learner",
      header: "Learner",
      cell: (row: ProgramEnrollment) => (
        <span className="font-semibold text-foreground">
          {row.displayName || "Learner"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Program status",
      cell: (row: ProgramEnrollment) => (
        <StatusBadge tone={statusTone(row.status)}>
          {readableStatus(row.status)}
        </StatusBadge>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: ProgramEnrollment) =>
        row.status === "ACTIVE" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
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
              size="sm"
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

  const rosterColumns = [
    {
      key: "learner",
      header: "Learner",
      cell: (row: RosterRow) => (
        <span className="font-semibold text-foreground">
          {row.displayName || "Learner"}
        </span>
      ),
    },
    {
      key: "status",
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
        new Date(row.startedAt).toLocaleDateString(),
    },
    {
      key: "actions",
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: RosterRow) =>
        row.status === "ACTIVE" ? (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
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
              size="sm"
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

  const facultyColumns = [
    {
      key: "faculty",
      header: "Faculty",
      cell: (row: FacultyAssignment) => (
        <span className="font-semibold text-foreground">
          {row.displayName || "Faculty"}
        </span>
      ),
    },
    {
      key: "role",
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
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: FacultyAssignment) =>
        !row.endedAt ? (
          <Button
            size="sm"
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

  const scheduleColumns = [
    {
      key: "event",
      header: "Event",
      cell: (row: ScheduleEvent) => (
        <div>
          <p className="m-0 font-semibold text-foreground">
            {row.title}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {row.location || "No location"}
          </p>
        </div>
      ),
    },
    {
      key: "time",
      header: "Time",
      cell: (row: ScheduleEvent) => (
        <span>
          {new Date(row.startsAt).toLocaleString()}
          {" → "}
          {new Date(row.endsAt).toLocaleString()}
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
      header: <span className="sr-only">Actions</span>,
      className: "text-right",
      cell: (row: ScheduleEvent) =>
        row.status === "SCHEDULED" ? (
          <Button
            size="sm"
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
                "Schedule event cancelled",
              )
            }
          >
            Cancel
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid gap-4 rounded-xl border border-border bg-surface p-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Program
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {section.programName}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Cohort
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {section.cohortName}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Period
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {section.academicPeriodName}
          </p>
        </div>
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Capacity
          </p>
          <p className="mt-2 font-semibold text-foreground">
            {section.capacity ?? "Unlimited"}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Learner progression
          </h2>
          <p className="mt-1 text-sm text-body">
            Admit learners to the Program, then place or move them into this Section. History is retained automatically.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="m-0 text-sm font-semibold text-foreground">
              Admit learner to Program
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Select
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
          </div>

          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="m-0 text-sm font-semibold text-foreground">
              Place learner in this Section
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <Select
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
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="m-0 text-sm font-semibold text-foreground">
            Program enrollments
          </h3>
          <DataTable
            columns={enrollmentColumns}
            rows={programEnrollments}
            getRowKey={(row) => row.id}
          />
        </div>

        <div className="space-y-3">
          <h3 className="m-0 text-sm font-semibold text-foreground">
            Section roster history
          </h3>
          <DataTable
            columns={rosterColumns}
            rows={roster}
            getRowKey={(row) => row.id}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Faculty responsibilities
          </h2>
          <p className="mt-1 text-sm text-body">
            Section-level Advisor/Coordinator roles only. Course teaching assignments belong to Courses.
          </p>
        </div>

        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 md:flex-row">
          <Select
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
          <Select
            value={facultyRole}
            onChange={(event) =>
              setFacultyRole(
                event.target.value as
                  | "ADVISOR"
                  | "COORDINATOR",
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

        <DataTable
          columns={facultyColumns}
          rows={facultyAssignments}
          getRowKey={(row) => row.id}
        />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="m-0 text-lg font-semibold text-foreground">
            Section schedule
          </h2>
          <p className="mt-1 text-sm text-body">
            Generic Section calendar for {section.startDate} → {section.endDate}. Course meetings will extend this in the Courses phase.
          </p>
        </div>

        <div className="grid gap-3 rounded-xl border border-border bg-surface p-5 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label
              htmlFor="schedule-title"
              className="mb-1.5 block text-xs font-semibold text-body"
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
              className="mb-1.5 block text-xs font-semibold text-body"
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
              className="mb-1.5 block text-xs font-semibold text-body"
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
              className="mb-1.5 block text-xs font-semibold text-body"
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
              htmlFor="schedule-faculty"
              className="mb-1.5 block text-xs font-semibold text-body"
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
          <div className="md:col-span-2 xl:col-span-5">
            <Button
              disabled={
                pending ||
                !eventTitle.trim() ||
                !eventStart ||
                !eventEnd
              }
              onClick={() =>
                run(
                  () =>
                    request(
                      "/api/academics/schedule-events",
                      "POST",
                      {
                        sectionId: section.id,
                        facultyMembershipId:
                          eventFacultyId || null,
                        title: eventTitle,
                        startsAt: new Date(
                          eventStart,
                        ).toISOString(),
                        endsAt: new Date(
                          eventEnd,
                        ).toISOString(),
                        location:
                          eventLocation.trim() ||
                          null,
                      },
                    ),
                  "Schedule event created",
                  () => {
                    setEventTitle("");
                    setEventStart("");
                    setEventEnd("");
                    setEventLocation("");
                    setEventFacultyId("");
                  },
                )
              }
            >
              Add event
            </Button>
          </div>
        </div>

        <DataTable
          columns={scheduleColumns}
          rows={scheduleEvents}
          getRowKey={(row) => row.id}
        />
      </section>
    </div>
  );
}
