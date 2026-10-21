import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Modal } from "antd";
import ModuleAccess from "@/pages/superadmin/sections/ModuleAccess";
import FeatureControlsHub from "@/pages/superadmin/sections/FeatureControlsHub";
import {
  fetchWithErrorHandling, getCollegeFeatureFlags, getFeatureModules,
  getLearnerModuleOverrides, getModuleAccessTree, updateCollegeFeatureFlag,
} from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(), getCollegeFeatureFlags: jest.fn(),
  getFeatureModules: jest.fn(), getMentorCountForCollege: jest.fn(),
  updateCollegeFeatureFlag: jest.fn(), explainModuleAccess: jest.fn(),
  getLearnerModuleOverrides: jest.fn(), getModuleAccessTree: jest.fn(),
  setModuleAccess: jest.fn(),
}));
jest.mock("@/api/Services/LearnerSearchService", () => ({ searchLearners: jest.fn() }));

const originalGetComputedStyle = window.getComputedStyle;
beforeAll(() => {
  window.getComputedStyle = (element) => originalGetComputedStyle.call(window, element);
});
afterAll(() => { window.getComputedStyle = originalGetComputedStyle; });

const tree = (collegeId, name) => ({
  canEditCollegeLevel: true,
  nodes: [{ scopeType: "COLLEGE", scopeId: collegeId, name,
    parentType: null, parentId: null, learnerCount: 1, modules: [] }],
});
const deferred = () => {
  let resolve;
  const promise = new Promise((finish) => { resolve = finish; });
  return { promise, resolve };
};

beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (promise) => {
    try { return { success: true, data: await promise }; }
    catch (error) { return { success: false, message: error.message }; }
  });
  getModuleAccessTree.mockResolvedValue(tree(5, "Current College"));
  getLearnerModuleOverrides.mockResolvedValue({ students: [] });
  getCollegeFeatureFlags.mockResolvedValue([{
    collegeId: 5, collegeName: "Current College",
    modules: { projects: true, placements: true },
    projectsEnabled: true, placementsEnabled: true,
  }]);
  getFeatureModules.mockResolvedValue({ projects: "Projects", placements: "Placements" });
  updateCollegeFeatureFlag.mockResolvedValue({});
});

it("T-04: lock-only legacy learners remain visible and reviewable", async () => {
  getLearnerModuleOverrides.mockResolvedValue({
    students: [{ learnerId: 77, name: "Legacy Learner", overrides: {}, locks: { projects: true } }],
  });
  render(<ModuleAccess collegeId={5} isSuperAdmin />);
  const review = await screen.findByRole("button", { name: "Review" });
  fireEvent.click(review);
  expect(await screen.findByText("Legacy Learner")).toBeInTheDocument();
  expect(screen.getByText(/Projects: legacy lock without value/)).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Clear legacy lock" })).toBeInTheDocument();
});

it("T-10: late response from an old college cannot overwrite the new tree", async () => {
  const first = deferred();
  const second = deferred();
  getModuleAccessTree.mockImplementation((id) => id === 5 ? first.promise : second.promise);
  const { rerender } = render(<ModuleAccess collegeId={5} isSuperAdmin />);
  await waitFor(() => expect(getModuleAccessTree).toHaveBeenCalledWith(5));
  rerender(<ModuleAccess collegeId={9} isSuperAdmin />);
  await waitFor(() => expect(getModuleAccessTree).toHaveBeenCalledWith(9));
  await act(async () => { second.resolve(tree(9, "New College")); });
  expect(await screen.findByText("New College")).toBeInTheDocument();
  await act(async () => { first.resolve(tree(5, "Old College")); });
  expect(screen.getByText("New College")).toBeInTheDocument();
  expect(screen.queryByText("Old College")).not.toBeInTheDocument();
});

it("T-11: a failed override fetch is an error with Retry, not an empty result", async () => {
  getLearnerModuleOverrides.mockRejectedValue(new Error("Overrides unavailable"));
  render(<ModuleAccess collegeId={5} isSuperAdmin />);
  expect(await screen.findByText("Couldn't load student overrides")).toBeInTheDocument();
  expect(screen.getByText("Overrides unavailable")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
});

it("T-14: disabling Placements requires explicit confirmation and discloses unknown impact", async () => {
  const confirm = jest.spyOn(Modal, "confirm").mockImplementation(() => ({ destroy: jest.fn(), update: jest.fn() }));
  try {
    render(<FeatureControlsHub selectedCollegeId={5} />);
    const toggle = await screen.findByRole("switch", { name: "Placements for Current College" });
    fireEvent.click(toggle);
    expect(confirm).toHaveBeenCalledTimes(1);
    const options = confirm.mock.calls[0][0];
    expect(options.title).toBe("Turn off Placements for Current College?");
    expect(render(<div>{options.content}</div>).container.textContent).toMatch(/Impact data could not be loaded/);
    expect(updateCollegeFeatureFlag).not.toHaveBeenCalled();
    await act(async () => { await options.onOk(); });
    expect(updateCollegeFeatureFlag).toHaveBeenCalledWith(5, "placements", false);
  } finally { confirm.mockRestore(); }
});
