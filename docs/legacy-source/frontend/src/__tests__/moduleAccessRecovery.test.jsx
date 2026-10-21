import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ModuleAccess from "@/pages/superadmin/sections/ModuleAccess";
import { fetchWithErrorHandling, getModuleAccessTree, getLearnerModuleOverrides, explainModuleAccess } from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(),
  getModuleAccessTree: jest.fn(),
  getLearnerModuleOverrides: jest.fn(),
  explainModuleAccess: jest.fn(),
  setModuleAccess: jest.fn(),
}));
jest.mock("@/api/Services/LearnerSearchService", () => ({ searchLearners: jest.fn() }));
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
const tree = (scopeId, name) => ({ canEditCollegeLevel: true, nodes: [{
  scopeType: "COLLEGE", scopeId, name, parentType: null, parentId: null,
  learnerCount: 0, modules: [
    { module: "projects", explicitValue: true, effectiveEnabled: true, effectiveLevel: "COLLEGE", effectiveLocked: false },
    { module: "placements", explicitValue: true, effectiveEnabled: true, effectiveLevel: "COLLEGE", effectiveLocked: false },
  ],
}] });
let originalComputedStyle;
beforeAll(() => {
  originalComputedStyle = window.getComputedStyle;
  window.getComputedStyle = (element) => originalComputedStyle.call(window, element);
});
afterAll(() => { window.getComputedStyle = originalComputedStyle; });
beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (promise) => {
    try { return { success: true, data: await promise }; }
    catch (error) { return { success: false, message: error.message }; }
  });
  getModuleAccessTree.mockResolvedValue(tree(7, "Current college"));
  getLearnerModuleOverrides.mockResolvedValue({ students: [] });
});

test("a throwing tree wrapper displays a recoverable error instead of spinning forever", async () => {
  fetchWithErrorHandling.mockImplementationOnce(() => Promise.reject(new Error("interceptor failed")));
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  expect(await screen.findByText("Couldn't load module access")).toBeInTheDocument();
  expect(screen.getByText("interceptor failed")).toBeInTheDocument();
  expect(screen.queryByText("Loading student-specific overrides…")).not.toBeInTheDocument();
});

test("an override request failure is an explicit retryable error, never empty success", async () => {
  getLearnerModuleOverrides.mockRejectedValueOnce(new Error("override service down"))
    .mockResolvedValueOnce({ students: [] });
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  expect(await screen.findByText("Couldn't load student overrides")).toBeInTheDocument();
  expect(screen.getByText("override service down")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(getLearnerModuleOverrides).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByText("Couldn't load student overrides")).not.toBeInTheDocument());
});

test("a late tree for the previous college cannot replace the selected college", async () => {
  const old = deferred();
  getModuleAccessTree.mockReturnValueOnce(old.promise).mockResolvedValueOnce(tree(8, "New college"));
  const { rerender } = render(<ModuleAccess collegeId={7} isSuperAdmin />);
  await waitFor(() => expect(getModuleAccessTree).toHaveBeenCalledTimes(1));
  rerender(<ModuleAccess collegeId={8} isSuperAdmin />);
  expect(await screen.findByText("New college")).toBeInTheDocument();
  await act(async () => { old.resolve(tree(7, "Old college")); await old.promise; });
  expect(screen.queryByText("Old college")).not.toBeInTheDocument();
  expect(screen.getByText("New college")).toBeInTheDocument();
});

test("a legacy lock without a value remains discoverable and has a superadmin clear action", async () => {
  getLearnerModuleOverrides.mockResolvedValue({ students: [
    { learnerId: 3, name: "Lock-only learner", overrides: {}, locks: { projects: true } },
  ] });
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  expect(await screen.findByText("Projects: legacy lock without value")).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Clear legacy lock" })).toBeInTheDocument();
});


test("a thrown student access trace shows a retryable error instead of an endless spinner", async () => {
  getLearnerModuleOverrides.mockResolvedValue({ students: [
    { learnerId: 3, name: "Recoverable student", overrides: { projects: false }, locks: {} },
  ] });
  explainModuleAccess.mockImplementationOnce(() => { throw new Error("trace interceptor failed"); })
    .mockResolvedValueOnce({ learnerId: 3, modules: [] });
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  fireEvent.click(await screen.findByText("Recoverable student"));
  expect(await screen.findByText("Couldn't load student access")).toBeInTheDocument();
  expect(screen.getByText("trace interceptor failed")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() => expect(explainModuleAccess).toHaveBeenCalledTimes(2));
  await waitFor(() => expect(screen.queryByText("Couldn't load student access")).not.toBeInTheDocument());
});
