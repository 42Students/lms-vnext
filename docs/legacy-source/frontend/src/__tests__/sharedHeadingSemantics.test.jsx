import React from "react";
import { render, screen } from "@testing-library/react";
import ListingPageHeader from "@/components/Global/ListingPageHeader/ListingPageHeader";
import CourseSectionHeader from "@/components/Course/Common/CourseSectionHeader";
import PageShell from "@/components/Common/PageShell";

test("listing pages expose their visual title as the page h1", () => {
  render(<ListingPageHeader title="Courses" />);
  expect(screen.getByRole("heading", { level: 1, name: "Courses" })).toBeInTheDocument();
});

test("PageShell promotes its title to h1 while reusable course section headers default to h2", () => {
  const { rerender } = render(<PageShell title="Assignments">Body</PageShell>);
  expect(screen.getByRole("heading", { level: 1, name: "Assignments" })).toBeInTheDocument();

  rerender(<CourseSectionHeader title="Upcoming work" />);
  expect(screen.getByRole("heading", { level: 2, name: "Upcoming work" })).toBeInTheDocument();
});
