import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";
import MentorLanding from "@/pages/mentor/index";
import { getServerSideProps as getMentorCoursesRedirect } from "@/pages/mentor/courses/index";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("@/utils/useCollegeFeatureFlags", () => ({ __esModule: true, default: jest.fn() }));

const replace = jest.fn().mockResolvedValue(true);

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ replace });
});

it("does not navigate to disabled Projects and offers an accessible alternative", () => {
  useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: false, modules: { projects: false }, loading: false });
  render(<MentorLanding />);
  expect(screen.getByText("Projects is currently unavailable")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /view notifications/i })).toHaveAttribute("href", "/mentor/notifications");
  expect(replace).not.toHaveBeenCalled();
});

it("never redirects while module availability is unknown", () => {
  useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: false, modules: {}, loading: true });
  render(<MentorLanding />);
  expect(screen.getByText("Opening your mentor workspace")).toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});

it("opens Projects only after successful enablement is known", async () => {
  useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: true, modules: { projects: true }, loading: false });
  render(<MentorLanding />);
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/mentor/projects"));
});

it("legacy mentor courses redirect goes through feature-aware landing", async () => {
  const result = await getMentorCoursesRedirect();
  expect(result.redirect).toMatchObject({ destination: "/mentor", permanent: false });
});
