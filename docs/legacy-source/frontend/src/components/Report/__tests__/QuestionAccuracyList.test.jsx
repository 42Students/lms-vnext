import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import QuestionAccuracyList from "../QuestionAccuracyList";

test("renders a meaningful empty state for missing or malformed question data", () => {
  const { rerender } = render(<QuestionAccuracyList questions={null} />);
  expect(screen.getByRole("status")).toHaveTextContent("This quiz has no questions yet.");

  rerender(<QuestionAccuracyList questions={[null, "broken"]} />);
  expect(screen.getByRole("status")).toHaveTextContent("This quiz has no questions yet.");
});

test("clamps malformed percentages and exposes an accessible chart summary", () => {
  render(
    <QuestionAccuracyList
      questions={[
        { id: 1, prompt: "Too high", accuracyPercent: 140, correctCount: 5, answeredCount: 4 },
        { id: 2, prompt: "Too low", accuracyPercent: -20, correctCount: -2, answeredCount: "bad" },
      ]}
    />
  );

  expect(screen.getByRole("img", { name: /Too high: 100% correct, 5 of 4/ })).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /Too low: 0% correct, 0 of 0/ })).toBeInTheDocument();
  expect(document.querySelectorAll(".ln-question-accuracy__fill")[0]).toHaveStyle({ width: "100%" });
  expect(document.querySelectorAll(".ln-question-accuracy__fill")[1]).toHaveStyle({ width: "0%" });
});

test("falls back to a readable question label instead of crashing on missing prompt/id", () => {
  render(<QuestionAccuracyList questions={[{ accuracyPercent: 50, correctCount: 1, answeredCount: 2 }]} />);

  expect(screen.getByText("Question 1")).toBeInTheDocument();
  expect(screen.getByRole("img", { name: /Question 1: 50% correct, 1 of 2/ })).toBeInTheDocument();
});
