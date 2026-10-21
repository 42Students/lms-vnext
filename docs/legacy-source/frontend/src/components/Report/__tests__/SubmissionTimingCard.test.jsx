import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import SubmissionTimingCard from "../SubmissionTimingCard";

test("shows on-time and late counts", () => {
  render(<SubmissionTimingCard onTimeCount={5} lateCount={2} notSubmitted={[]} />);
  expect(screen.getByText("5")).toBeInTheDocument();
  expect(screen.getByText("On time")).toBeInTheDocument();
  expect(screen.getByText("2")).toBeInTheDocument();
  expect(screen.getByText("Late")).toBeInTheDocument();
});

test("lists every student who hasn't submitted", () => {
  render(
    <SubmissionTimingCard
      onTimeCount={1}
      lateCount={0}
      notSubmitted={[{ id: 2, name: "Ravi Kumar" }, { id: 3, name: "Meena Iyer" }]}
    />
  );
  expect(screen.getByText("Hasn't submitted (2)")).toBeInTheDocument();
  expect(screen.getByText("Ravi Kumar")).toBeInTheDocument();
  expect(screen.getByText("Meena Iyer")).toBeInTheDocument();
});

test("omits the missing-students section entirely when everyone has submitted", () => {
  render(<SubmissionTimingCard onTimeCount={3} lateCount={0} notSubmitted={[]} />);
  expect(screen.queryByText(/Hasn't submitted/)).not.toBeInTheDocument();
});


test("normalizes malformed counts and invalid missing-student rows without crashing", () => {
  render(
    <SubmissionTimingCard
      onTimeCount={"not-a-number"}
      lateCount={-4}
      notSubmitted={null}
    />
  );

  expect(screen.getAllByText("0")).toHaveLength(2);
  expect(screen.getByText("No submitted assignments to chart yet.")).toBeInTheDocument();
  expect(screen.queryByText(/Hasn't submitted/)).not.toBeInTheDocument();
});
