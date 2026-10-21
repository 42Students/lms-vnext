import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useSelector } from "react-redux";
import LiveClassContent from "@/pages/Dashboard/course/syllabus/liveclass";

jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("@/api/Services/courseServices", () => ({ saveContentProgress: jest.fn() }));
jest.mock("@/utils/courseUtils/syllabusUtils", () => jest.fn());

function liveClassContent(overrides = {}) {
  return {
    id: 1,
    contentDataDTO: {
      link: "https://meet.example.com/abc",
      date: "2026-09-29",
      start_time: "2026-09-29 09:00:00",
      end_time: "2026-09-29 10:00:00",
      ...overrides,
    },
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  useSelector.mockImplementation((selector) => selector({ loginUser: { id: 1, userType: "LEARNER" } }));
});

// #11: the join link used to render as a live, clickable button regardless of whether the
// scheduled session had actually happened yet.
test("a session whose end_time has already passed shows a disabled 'Session ended' state, not a live join button", () => {
  render(
    <LiveClassContent
      content={liveClassContent({ end_time: "2020-01-01 10:00:00" })}
      progress={null}
      onProgressUpdate={() => {}}
    />
  );

  expect(screen.getByText("This session has already ended.")).toBeInTheDocument();
  const button = screen.getByRole("button", { name: /Session ended/ });
  expect(button).toBeDisabled();
  expect(screen.queryByRole("button", { name: /Join Meeting/ })).not.toBeInTheDocument();
});

test("an upcoming or in-progress session still shows a live, clickable Join Meeting button", () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  render(
    <LiveClassContent
      content={liveClassContent({ end_time: future })}
      progress={null}
      onProgressUpdate={() => {}}
    />
  );

  const button = screen.getByRole("button", { name: /Join Meeting/ });
  expect(button).not.toBeDisabled();
  expect(screen.queryByText("This session has already ended.")).not.toBeInTheDocument();
});

test("a record with no end_time at all is not gated -- an unknown end time never hides the link", () => {
  render(
    <LiveClassContent
      content={liveClassContent({ end_time: null })}
      progress={null}
      onProgressUpdate={() => {}}
    />
  );

  expect(screen.getByRole("button", { name: /Join Meeting/ })).not.toBeDisabled();
});

test("faculty are never gated -- the person running an overrunning session must still be able to rejoin it", () => {
  useSelector.mockImplementation((selector) => selector({ loginUser: { id: 1, userType: "FACULTY" } }));
  render(
    <LiveClassContent
      content={liveClassContent({ end_time: "2020-01-01 10:00:00" })}
      progress={null}
      onProgressUpdate={() => {}}
    />
  );

  expect(screen.getByRole("button", { name: /Join Meeting/ })).not.toBeDisabled();
  expect(screen.queryByText("This session has already ended.")).not.toBeInTheDocument();
});
