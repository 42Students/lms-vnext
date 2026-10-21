import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import ModuleAccess from "@/pages/superadmin/sections/ModuleAccess";
import {
  fetchWithErrorHandling, getLearnerModuleOverrides, getModuleAccessTree, setModuleAccess,
} from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(),
  getLearnerModuleOverrides: jest.fn(),
  getModuleAccessTree: jest.fn(),
  explainModuleAccess: jest.fn(),
  setModuleAccess: jest.fn(),
}));
jest.mock("@/api/Services/LearnerSearchService", () => ({ searchLearners: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (promise) => ({ success: true, data: await promise }));
  getModuleAccessTree.mockResolvedValue({ canEditCollegeLevel: true, nodes: [] });
  getLearnerModuleOverrides.mockResolvedValue({ students: [{
    learnerId: 77, name: "Legacy Student", rollNumber: "R77", overrides: {},
    locks: { projects: true, courses: true },
  }] });
  setModuleAccess.mockResolvedValue({ success: true });
});

test("failed override fetch is visibly an error instead of an empty roster", async () => {
  getLearnerModuleOverrides.mockRejectedValueOnce(new Error("Override service unavailable"));
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  expect(await screen.findByText("Couldn't load student overrides")).toBeInTheDocument();
  expect(screen.getByText("Override service unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Review" })).not.toBeInTheDocument();
});

test("super admin sees lock-only student and can clear a legacy Projects lock", async () => {
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  const review = await screen.findByRole("button", { name: "Review" });
  fireEvent.click(review);
  expect(await screen.findByText("Projects: legacy lock without value")).toBeInTheDocument();
  expect(screen.queryByText(/Courses: legacy lock/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Clear legacy lock" }));
  await waitFor(() => expect(setModuleAccess).toHaveBeenCalledWith({
    scopeType: "LEARNER", scopeId: 77, module: "projects", enabled: null, locked: false,
  }));
});

test("college admin can review orphan lock but cannot clear a super-admin lock", async () => {
  render(<ModuleAccess collegeId={7} isSuperAdmin={false} />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  expect(await screen.findByText("Projects: legacy lock without value")).toBeInTheDocument();
  expect(screen.getByText("Super Admin must clear this lock")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Clear legacy lock" })).not.toBeInTheDocument();
});
