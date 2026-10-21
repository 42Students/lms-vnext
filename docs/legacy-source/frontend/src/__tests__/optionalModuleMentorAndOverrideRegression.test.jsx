import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/router";
import { useSelector } from "react-redux";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";
import MentorLanding from "@/pages/mentor/index";
import MentorProjectsPage from "@/pages/mentor/projects/index";
import ModuleAccess from "@/pages/superadmin/sections/ModuleAccess";
import {
  fetchWithErrorHandling, getLearnerModuleOverrides, getModuleAccessTree,
} from "@/api/Services/AdminService";

jest.mock("next/router", () => ({ useRouter: jest.fn() }));
jest.mock("react-redux", () => ({ useSelector: jest.fn() }));
jest.mock("@/utils/useCollegeFeatureFlags", () => jest.fn());
jest.mock("@/components/Projects/ProjectsContent", () => () => <div data-testid="projects-content" />);
jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(),
  getLearnerModuleOverrides: jest.fn(),
  getModuleAccessTree: jest.fn(),
  explainModuleAccess: jest.fn(),
  setModuleAccess: jest.fn(),
}));
jest.mock("@/api/Services/LearnerSearchService", () => ({ searchLearners: jest.fn() }));

const originalGetComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => { window.getComputedStyle = (element) => originalGetComputedStyle(element); });
afterAll(() => { window.getComputedStyle = originalGetComputedStyle; });

beforeEach(() => {
  jest.clearAllMocks();
  useRouter.mockReturnValue({ replace: jest.fn() });
  useSelector.mockReturnValue({ id: 23, collegeId: 7 });
  useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: false, modules: { projects: false }, loading: false });
  fetchWithErrorHandling.mockImplementation(async (promise) => {
    try { return { success: true, data: await promise }; }
    catch (error) { return { success: false, message: error.message }; }
  });
  getModuleAccessTree.mockResolvedValue({ nodes: [], canEditCollegeLevel: true });
});

test("T-16: mentor landing does not redirect to disabled Projects", async () => {
  const router = useRouter();
  render(<MentorLanding />);
  expect(screen.getByText("Projects is currently unavailable")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "View notifications" })).toHaveAttribute("href", "/mentor/notifications");
  await waitFor(() => expect(router.replace).not.toHaveBeenCalled());
});

test("T-17: disabled mentor Projects page gives neutral guidance and does not mount project content", () => {
  render(<MentorProjectsPage />);
  expect(screen.getByText("Projects is turned off for your college")).toBeInTheDocument();
  expect(screen.getByText(/Contact your administrator if you need access/)).toBeInTheDocument();
  expect(screen.queryByText(/college admin/i)).not.toBeInTheDocument();
  expect(screen.queryByTestId("projects-content")).not.toBeInTheDocument();
});

test("T-11: failed learner override request shows a retryable error, not an empty result", async () => {
  getLearnerModuleOverrides.mockRejectedValue(new Error("Override lookup failed"));
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  expect(await screen.findByText("Couldn't load student overrides")).toBeInTheDocument();
  expect(screen.getByText("Override lookup failed")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});
