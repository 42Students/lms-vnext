import React from "react";
import { render, screen } from "@testing-library/react";
import LiveClassContent, { liveSessionSchedule } from "@/pages/Dashboard/course/syllabus/liveclass";

let mockUserType = "LEARNER";

jest.mock("react-redux", () => ({
  useSelector: (selector) => selector({ loginUser: { id: 42, userType: mockUserType } }),
}));

jest.mock("@/components/Course/Syllabus/ContentTitle", () => ({
  __esModule: true,
  default: () => <div>Live session title</div>,
  ContentAddedDate: () => null,
}));

jest.mock("@/components/Course/Syllabus/MarkCompleteButton", () => function MarkCompleteButton() {
  return <button type="button">Mark complete</button>;
});

jest.mock("@/utils/courseUtils/syllabusUtils", () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

beforeEach(() => {
  mockUserType = "LEARNER";
});

test("ended learner live sessions never expose Join or Copy actions", () => {
  render(
    <LiveClassContent
      content={{
        id: 9,
        contentDataDTO: {
          link: "https://meet.google.com/example",
          start_time: "2020-01-01T10:00:00",
          end_time: "2020-01-01T11:00:00",
        },
      }}
    />
  );

  expect(screen.getByRole("button", { name: /Session ended/ })).toBeDisabled();
  expect(screen.queryByRole("button", { name: /Join Meeting/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Copy meeting link" })).not.toBeInTheDocument();
  expect(screen.getByText("This session has already ended.")).toBeInTheDocument();
});

test("an active learner session keeps Join available", () => {
  render(
    <LiveClassContent
      content={{
        id: 10,
        contentDataDTO: {
          link: "https://meet.google.com/example",
          start_time: "2020-01-01T10:00:00",
          end_time: "2099-01-01T11:00:00",
        },
      }}
    />
  );

  expect(screen.getByRole("button", { name: /Join Meeting/ })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Copy meeting link" })).toBeEnabled();
});

test("schedule helper distinguishes upcoming and ended windows", () => {
  expect(liveSessionSchedule({
    contentDataDTO: {
      start_time: "2099-01-01T10:00:00",
      end_time: "2099-01-01T11:00:00",
    },
  }).state).toBe("upcoming");

  expect(liveSessionSchedule({
    contentDataDTO: {
      start_time: "2020-01-01T10:00:00",
      end_time: "2020-01-01T11:00:00",
    },
  }).state).toBe("ended");
});
