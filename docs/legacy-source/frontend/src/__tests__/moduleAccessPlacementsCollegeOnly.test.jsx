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


const withBatch = () => ({ canEditCollegeLevel: true, nodes: [
  tree(7, "Current college").nodes[0],
  { scopeType: "BATCH", scopeId: 40, name: "B.Tech CSE 2023-27", parentType: "COLLEGE", parentId: 7, learnerCount: 120, modules: [
    { module: "projects", explicitValue: null, effectiveEnabled: true, effectiveLevel: "COLLEGE", effectiveLocked: false },
    { module: "placements", explicitValue: null, effectiveEnabled: true, effectiveLevel: "COLLEGE", effectiveLocked: false, managedBy: "PLACEMENT_ELIGIBILITY" },
  ] },
] });

test("Placements below the college is shown as the placement cell's decision, not a switch", async () => {
  getModuleAccessTree.mockResolvedValue(withBatch());
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  expect(await screen.findByTestId("managed-BATCH-40")).toHaveTextContent("Placement cell decides");
});

test("the student explain view says why Placements is open or closed: college switch, then eligibility", async () => {
  getLearnerModuleOverrides.mockResolvedValue({ students: [{ learnerId: 3, name: "Asha", overrides: { placements: true }, locks: {} }] });
  explainModuleAccess.mockResolvedValue({ learnerId: 3, modules: [{
    module: "placements", label: "Placements", enabled: false, collegeEnabled: true, decidedAtLevel: "PLACEMENT_ELIGIBILITY", locked: false,
    levels: [{ scopeType: "LEARNER", scopeId: 3, status: "MANAGED_BY_ELIGIBILITY", explicitValue: true },
      { scopeType: "COLLEGE", scopeId: 7, scopeName: "Current college", status: "UNSET", explicitValue: null }],
    placementEligibility: { collegeHasPlacements: true, eligibility: "INELIGIBLE", eligibilityLevel: "CLASS", eligibilityReason: "Year back", eligibilityBy: "Ravi" },
  }] });
  render(<ModuleAccess collegeId={7} isSuperAdmin />);
  fireEvent.click(await screen.findByRole("button", { name: "Review" }));
  fireEvent.click(await screen.findByText("Asha"));
  const box = await screen.findByTestId("placement-explain");
  expect(box).toHaveTextContent("closed for this student until the placement cell makes them Eligible");
  expect(box).toHaveTextContent("Ineligible for their class: Year back");
  expect(box).toHaveTextContent("Decided by Ravi");
  expect(screen.queryByText("Just for this student:")).not.toBeInTheDocument();
});
