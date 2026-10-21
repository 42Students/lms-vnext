import { render, screen, waitFor } from "@testing-library/react";
import FeatureControlsHub from "@/pages/superadmin/sections/FeatureControlsHub";
import ModuleAccess from "@/pages/superadmin/sections/ModuleAccess";
import {
  fetchWithErrorHandling,
  getCollegeFeatureFlags,
  getFeatureModules,
  getLearnerModuleOverrides,
  getModuleAccessTree,
} from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(),
  getCollegeFeatureFlags: jest.fn(),
  getFeatureModules: jest.fn(),
  getMentorCountForCollege: jest.fn(),
  updateCollegeFeatureFlag: jest.fn(),
  explainModuleAccess: jest.fn(),
  getLearnerModuleOverrides: jest.fn(),
  getModuleAccessTree: jest.fn(),
  setModuleAccess: jest.fn(),
}));
jest.mock("@/api/Services/LearnerSearchService", () => ({ searchLearners: jest.fn() }));

// rc-table requests pseudo-element computed styles, unsupported by jsdom; returning the
// element style is sufficient for its scrollbar measurement in this component test.
const getComputedStyle = window.getComputedStyle.bind(window);
beforeAll(() => {
  window.getComputedStyle = (element) => getComputedStyle(element);
});
afterAll(() => {
  window.getComputedStyle = getComputedStyle;
});

const moduleState = (module, enabled = true) => ({
  module,
  label: module === "courses" ? "Courses & Content" : module === "projects" ? "Projects" : "Placements",
  explicitValue: enabled,
  locked: false,
  effectiveEnabled: enabled,
  effectiveLevel: "COLLEGE",
  effectiveScopeId: 7,
  effectiveLocked: false,
  enforcement: module === "courses" ? "NAV_ONLY" : "NAV_AND_API",
});

beforeEach(() => {
  fetchWithErrorHandling.mockImplementation(async (promise) => ({ success: true, data: await promise }));
  getCollegeFeatureFlags.mockResolvedValue([{
    collegeId: 7,
    collegeName: "Test College",
    modules: { projects: true, placements: true, courses: false },
    projectsEnabled: true,
    placementsEnabled: true,
  }]);
  getFeatureModules.mockResolvedValue({
    projects: "Projects", placements: "Placements", courses: "Courses & Content",
  });
  getModuleAccessTree.mockResolvedValue({
    canEditCollegeLevel: true,
    nodes: [{
      scopeType: "COLLEGE", scopeId: 7, name: "Test College",
      parentType: null, parentId: null, learnerCount: 1,
      modules: [moduleState("projects"), moduleState("placements"), moduleState("courses", false)],
    }],
  });
  getLearnerModuleOverrides.mockResolvedValue({
    students: [{ learnerId: 3, name: "Old Override", overrides: { courses: false } }],
  });
});

describe("Courses is core, never an admin-controlled module toggle", () => {
  it("Super Admin Feature Controls only renders optional switches from an old server catalog", async () => {
    render(<FeatureControlsHub />);
    expect(await screen.findByRole("columnheader", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Placements" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Courses & Content" })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getAllByRole("switch")).toHaveLength(2));
    expect(screen.queryByRole("switch", { name: /Courses & Content for/i })).not.toBeInTheDocument();
  });

  it("shared College Admin and Super Admin grid filters legacy Courses nodes and overrides", async () => {
    render(<ModuleAccess collegeId={7} isSuperAdmin />);
    expect(await screen.findByRole("columnheader", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Placements" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Students in scope" })).toBeInTheDocument();
    expect(screen.getByText(/Student counts show the population under each scope/)).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Courses & Content" })).not.toBeInTheDocument();
    await waitFor(() => expect(getLearnerModuleOverrides).toHaveBeenCalledWith(7));
    expect(screen.queryByRole("button", { name: "Review" })).not.toBeInTheDocument();
    expect(screen.getByText(/Courses & Content is always available/)).toBeInTheDocument();
  });
});
