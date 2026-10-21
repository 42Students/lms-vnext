import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import dayjs from "dayjs";

// Mentor audit M-41/M-42/M-57: a meeting that ended earlier today is "Missed" (still Scheduled, nobody marked it),
// in agreement with it sitting under Past; one still to come today stays Scheduled under Upcoming.
jest.mock("next/link", () => function MockLink({ children, href }) {
  return <a href={typeof href === "string" ? href : "#"}>{children}</a>;
});
jest.mock("@/components/Course/Common/CourseSectionHeader", () => function MockHeader() {
  return <div />;
});
jest.mock("@/api/Services/projectService", () => ({
  getProjects: jest.fn(),
  extractProjectsPayload: (r) => r,
  normalizeProjectsList: (l) => l,
}));

const { getProjects } = require("@/api/Services/projectService");
const MentorCalendarPage = require("@/pages/mentor/calendar").default;

afterEach(() => jest.useRealTimers());

test("same-day meetings: ended one shows Missed under Past, later one stays Scheduled", async () => {
  jest.useFakeTimers({ now: new Date("2026-10-06T15:00:00"), doNotFake: ["queueMicrotask", "nextTick"] });
  const today = dayjs().format("YYYY-MM-DD");
  getProjects.mockResolvedValue([{ id: 1, title: "Capstone", meetingsList: [
    { id: 11, title: "Morning standup", meetingDate: today, startTime: "09:00", endTime: "09:30", meetingStatus: "SCHEDULED" },
    { id: 12, title: "Evening review", meetingDate: today, startTime: "18:00", endTime: "18:30", meetingStatus: "SCHEDULED" },
  ] }]);

  render(<MentorCalendarPage />);

  const evening = await screen.findByText("Evening review");
  expect(evening.closest(".ln-card")).toHaveTextContent(/scheduled/i);

  const pastToggle = screen.queryByRole("button", { name: /past/i });
  if (pastToggle) fireEvent.click(pastToggle);
  const morning = await screen.findByText("Morning standup");
  expect(morning.closest(".ln-card")).toHaveTextContent(/missed/i);
});
