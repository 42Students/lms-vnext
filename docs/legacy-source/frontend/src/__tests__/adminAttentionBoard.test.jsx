import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AttentionBoard from "@/components/admin/dashboard/AttentionBoard";
import { getAdminCollegeDashboard } from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({ getAdminCollegeDashboard: jest.fn() }));
jest.mock("next/link", () => ({ children, href, ...rest }) => <a href={href} {...rest}>{children}</a>);

const full = {
  attendanceThreshold: 75,
  today: { classCount: 4, heldCount: 2, markedCount: 1 },
  attendancePending: { count: 1, items: [{ startTime: "2026-10-02 14:00:00", className: "CSE - A", courseName: "Java Programming", facultyName: "Srinivas Rao" }] },
  attendanceAtRisk: { count: 1, items: [{ learnerId: 5, name: "Asha K", rollNumber: "21CS001", className: "CSE - A", held: 10, absent: 4, percent: 60 }] },
  gradingBacklog: { count: 139, oldestSubmittedAt: "2026-05-11T14:47:35", items: [{ courseId: 9, courseName: "MERN Stack Training", count: 139, oldestSubmittedAt: [2026, 5, 11, 14, 47, 35, 38721000] }] },
  unstaffed: { count: 0, items: [] },
  setupGaps: { batchesWithoutClasses: 2, sectionsWithoutStudents: 0, studentsWithoutClass: 0, coursesWithoutLessons: 0 },
  dueThisWeek: null,
};

describe("college admin attention board", () => {
  test("lists what needs attention, says all-clear where there is nothing, and flags a failed section", async () => {
    getAdminCollegeDashboard.mockResolvedValue({ data: { data: full } });
    render(<AttentionBoard collegeId={6} />);

    await waitFor(() => expect(screen.getByText("Java Programming · CSE - A")).toBeInTheDocument());
    expect(screen.getByText(/classes scheduled today/)).toBeInTheDocument();
    expect(screen.getByText("Asha K · 21CS001")).toBeInTheDocument();
    expect(screen.getByText("MERN Stack Training")).toBeInTheDocument();
    // The backend sends this as a Jackson array; it used to render "oldest Invalid Date".
    expect(screen.getByText(/139 submissions · oldest 11 May/)).toBeInTheDocument();
    expect(screen.getByText("Every current-semester course has a teacher for every section.")).toBeInTheDocument();
    expect(screen.getByText("2 active batches with no classes")).toBeInTheDocument();
    // dueThisWeek came back null: that section failed, the rest still render.
    expect(screen.getByText(/Couldn.t load this/)).toBeInTheDocument();
  });

  test("a failed request offers a retry instead of an empty page", async () => {
    getAdminCollegeDashboard.mockRejectedValue(new Error("down"));
    render(<AttentionBoard collegeId={6} />);
    await waitFor(() => expect(screen.getByText(/Couldn't load today's overview/)).toBeInTheDocument());
    expect(screen.getByRole("button", { name: /Retry/ })).toBeInTheDocument();
  });
});
