import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildRecruiterCalendarEvents,
  type RecruiterCalendarJob,
  type RecruiterCalendarRound,
} from "@/modules/placements/recruiter-calendar-model";
import {
  groupPlacementCalendarEvents,
  placementCalendarWindow,
  summarizePlacementCalendar,
} from "@/modules/placements/placement-calendar-model";

const startsAt = new Date(
  "2026-10-11T18:30:00.000Z",
);

const endsBefore = new Date(
  "2026-10-18T18:30:00.000Z",
);

const job: RecruiterCalendarJob = {
  id: "job-authorized",
  title: "Software Engineer",
  status: "PUBLISHED",
  archivedAt: null,
  companyId: "company-1",
  companyName: "Example Employer",
  applicationDeadline: new Date(
    "2026-10-16T12:30:00.000Z",
  ),
};

const round: RecruiterCalendarRound = {
  id: "round-1",
  jobId: job.id,
  name: "Technical Interview",
  kind: "INTERVIEW",
  status: "SCHEDULED",
  scheduledAt: new Date(
    "2026-10-14T04:30:00.000Z",
  ),
  timezone: "Asia/Kolkata",
  venue: "Campus Hall A",
};

function project(
  jobs: readonly RecruiterCalendarJob[],
  rounds: readonly RecruiterCalendarRound[],
) {
  return buildRecruiterCalendarEvents({
    jobs,
    rounds,
    startsAt,
    endsBefore,
  });
}

describe("recruiter calendar projection", () => {
  it("builds authorized rounds and deadlines in chronological order", () => {
    const events = project([job], [round]);

    expect(events).toHaveLength(2);

    expect(events.map((event) => event.kind)).toEqual([
      "ROUND",
      "APPLICATION_DEADLINE",
    ]);

    expect(events[0]).toMatchObject({
      id: "round:round-1",
      title: "Technical Interview",
      companyId: "company-1",
      companyName: "Example Employer",
      jobId: "job-authorized",
      roundId: "round-1",
      roundKind: "INTERVIEW",
      status: "SCHEDULED",
      venue: "Campus Hall A",
    });

    expect(events[1]).toMatchObject({
      id: "deadline:job-authorized",
      jobId: "job-authorized",
      roundId: null,
      status: "PUBLISHED",
    });
  });

  it("never projects a round belonging to a job outside the authorized allowlist", () => {
    const events = project(
      [job],
      [
        round,
        {
          ...round,
          id: "foreign-round",
          jobId: "foreign-job",
          name: "Private Interview",
        },
      ],
    );

    expect(events).toHaveLength(2);

    expect(
      events.some(
        (event) =>
          event.id === "round:foreign-round",
      ),
    ).toBe(false);
  });

  it("excludes draft and archived jobs and their rounds", () => {
    const draft: RecruiterCalendarJob = {
      ...job,
      id: "draft-job",
      status: "DRAFT",
    };

    const archived: RecruiterCalendarJob = {
      ...job,
      id: "archived-job",
      status: "ARCHIVED",
      archivedAt: new Date(
        "2026-10-12T00:00:00.000Z",
      ),
    };

    const events = project(
      [draft, archived],
      [
        {
          ...round,
          jobId: draft.id,
        },
        {
          ...round,
          id: "archived-round",
          jobId: archived.id,
        },
      ],
    );

    expect(events).toEqual([]);
  });

  it("excludes cancelled, pending and unscheduled rounds", () => {
    const events = project(
      [{ ...job, applicationDeadline: null }],
      [
        {
          ...round,
          id: "cancelled",
          status: "CANCELLED",
        },
        {
          ...round,
          id: "pending",
          status: "PENDING",
        },
        {
          ...round,
          id: "unscheduled",
          scheduledAt: null,
        },
        {
          ...round,
          id: "completed",
          status: "COMPLETED",
        },
      ],
    );

    expect(events).toHaveLength(1);
    expect(events[0]?.id).toBe(
      "round:completed",
    );
  });

  it("uses inclusive start and exclusive end boundaries", () => {
    const events = project(
      [
        {
          ...job,
          applicationDeadline:
            new Date(startsAt),
        },
      ],
      [
        {
          ...round,
          scheduledAt:
            new Date(endsBefore),
        },
      ],
    );

    expect(events.map((event) => event.id)).toEqual([
      "deadline:job-authorized",
    ]);
  });

  it("preserves IST day grouping and correct calendar counts", () => {
    const events = project([job], [round]);

    const days =
      groupPlacementCalendarEvents(events);

    expect(days.map((day) => day.day)).toEqual([
      "2026-10-14",
      "2026-10-16",
    ]);

    const summary = summarizePlacementCalendar(
      events,
      new Date("2026-10-13T00:00:00.000Z"),
    );

    expect(summary).toMatchObject({
      total: 2,
      rounds: 1,
      deadlines: 1,
      followups: 0,
    });

    expect(summary.next?.id).toBe(
      "round:round-1",
    );
  });

  it("reuses Monday-first week and shared month and agenda windows", () => {
    const week = placementCalendarWindow(
      "2026-10-14",
      "week",
    );

    expect(week.from).toBe("2026-10-12");
    expect(week.to).toBe("2026-10-18");
    expect(week.days).toHaveLength(7);

    const month = placementCalendarWindow(
      "2026-10-14",
      "month",
    );

    expect(month.days).toHaveLength(42);
    expect(month.days[0]).toBe("2026-09-28");

    const agenda = placementCalendarWindow(
      "2026-10-14",
      "agenda",
    );

    expect(agenda.from).toBe("2026-10-01");
    expect(agenda.to).toBe("2026-10-31");
  });

  it("does not invent events for an empty authorized portfolio", () => {
    const events = project([], [round]);

    expect(events).toEqual([]);
    expect(groupPlacementCalendarEvents(events)).toEqual([]);

    expect(
      summarizePlacementCalendar(
        events,
        new Date("2026-10-14T00:00:00.000Z"),
      ),
    ).toMatchObject({
      total: 0,
      rounds: 0,
      deadlines: 0,
      followups: 0,
      next: null,
    });
  });

  it("does not mutate the caller's job or round arrays", () => {
    const jobs = [job];
    const rounds = [round];

    const originalJob = { ...job };
    const originalRound = { ...round };

    project(jobs, rounds);

    expect(jobs).toEqual([originalJob]);
    expect(rounds).toEqual([originalRound]);
  });
});
