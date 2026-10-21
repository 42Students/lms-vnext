import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useLearnerHomeStats } from "@/hooks/useLearnerHomeStats";
import { getLearnerCourseHomeStats } from "@/api/Services/courseServices";

jest.mock("@/api/Services/courseServices", () => ({
  getLearnerCourseHomeStats: jest.fn(),
}));

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

function StatsHarness({ courseSlug }) {
  const { data, loading, error, refetch } = useLearnerHomeStats({ courseSlug });
  return (
    <div>
      <span data-testid="value">{data?.label || "none"}</span>
      <span data-testid="loading">{loading ? "loading" : "idle"}</span>
      <span data-testid="error">{error ? "error" : "ok"}</span>
      <button type="button" onClick={refetch}>Refresh stats</button>
    </div>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  getLearnerCourseHomeStats.mockReset();
});

test("course scope changes clear the previous course stats while the new scope is loading", async () => {
  const nextCourse = deferred();
  getLearnerCourseHomeStats
    .mockResolvedValueOnce({ data: { label: "Course A progress" } })
    .mockReturnValueOnce(nextCourse.promise);

  const view = render(<StatsHarness courseSlug="course-a" />);
  expect(await screen.findByText("Course A progress")).toBeInTheDocument();

  view.rerender(<StatsHarness courseSlug="course-b" />);
  await waitFor(() => expect(getLearnerCourseHomeStats).toHaveBeenCalledTimes(2));

  expect(screen.getByTestId("value")).toHaveTextContent("none");
  expect(screen.getByTestId("loading")).toHaveTextContent("loading");

  await act(async () => {
    nextCourse.resolve({ data: { label: "Course B progress" } });
    await nextCourse.promise;
  });

  expect(await screen.findByText("Course B progress")).toBeInTheDocument();
  expect(screen.queryByText("Course A progress")).not.toBeInTheDocument();
});

test("same-scope refresh failure preserves the last successful learner stats", async () => {
  const refreshRequest = deferred();
  getLearnerCourseHomeStats
    .mockResolvedValueOnce({ data: { label: "Stable progress" } })
    .mockReturnValueOnce(refreshRequest.promise);

  render(<StatsHarness courseSlug="course-a" />);
  expect(await screen.findByText("Stable progress")).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Refresh stats" }));
  await waitFor(() => expect(getLearnerCourseHomeStats).toHaveBeenCalledTimes(2));

  expect(screen.getByTestId("value")).toHaveTextContent("Stable progress");
  expect(screen.getByTestId("loading")).toHaveTextContent("loading");

  await act(async () => {
    refreshRequest.reject(new Error("temporary refresh failure"));
    await Promise.resolve();
  });

  await waitFor(() => expect(screen.getByTestId("error")).toHaveTextContent("error"));
  expect(screen.getByTestId("value")).toHaveTextContent("Stable progress");
});
