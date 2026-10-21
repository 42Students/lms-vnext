import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Modal } from "antd";
import FeatureControlsHub from "@/pages/superadmin/sections/FeatureControlsHub";
import { fetchWithErrorHandling, getCollegeFeatureFlags, getFeatureModules, getMentorCountForCollege, updateCollegeFeatureFlag } from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(), getCollegeFeatureFlags: jest.fn(),
  getFeatureModules: jest.fn(), getMentorCountForCollege: jest.fn(),
  updateCollegeFeatureFlag: jest.fn(),
}));
const college = (details, projects = false) => ({
  collegeId: 7, collegeName: "Inherited college", projectsEnabled: projects,
  placementsEnabled: true, modules: { projects, placements: true },
  moduleDetails: { projects: details, placements: {
    effectiveEnabled: true, effectiveLevel: "DEFAULT", effectiveLocked: false, editableHere: true,
  } },
});
beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (promise) => {
    try { return { success: true, data: await promise }; }
    catch (error) { return { success: false, message: error.message }; }
  });
  getFeatureModules.mockResolvedValue({ projects: "Projects", placements: "Placements" });
});

test("an inherited organization lock displays effective OFF and prevents all writes", async () => {
  getCollegeFeatureFlags.mockResolvedValue([college({
    effectiveEnabled: false, effectiveLevel: "ORGANIZATION", effectiveScopeId: 8,
    effectiveLocked: true, editableHere: false,
  })]);
  render(<FeatureControlsHub selectedCollegeId={7} />);
  const projectSwitch = await screen.findByRole("switch", { name: "Projects for Inherited college" });
  expect(projectSwitch).not.toBeChecked();
  expect(projectSwitch).toBeDisabled();
  expect(screen.getByText("Locked at Organization level")).toBeInTheDocument();
  fireEvent.click(projectSwitch);
  expect(updateCollegeFeatureFlag).not.toHaveBeenCalled();
});

test("an unlocked inherited global setting identifies its source without blocking override", async () => {
  getCollegeFeatureFlags.mockResolvedValue([college({
    effectiveEnabled: false, effectiveLevel: "GLOBAL", effectiveScopeId: null,
    effectiveLocked: false, editableHere: true,
  })]);
  const modal = jest.spyOn(Modal, "confirm").mockImplementation(() => ({ destroy: jest.fn(), update: jest.fn() }));
  try {
    render(<FeatureControlsHub selectedCollegeId={7} />);
    const projectSwitch = await screen.findByRole("switch", { name: "Projects for Inherited college" });
    expect(projectSwitch).not.toBeDisabled();
    expect(screen.getByText("Inherited from Global")).toBeInTheDocument();
    expect(projectSwitch).not.toBeChecked();
    fireEvent.click(projectSwitch);
    await waitFor(() => expect(updateCollegeFeatureFlag).toHaveBeenCalledWith(7, "projects", true));
    expect(modal).not.toHaveBeenCalled();
  } finally { modal.mockRestore(); }
});

test("successful local update refetches effective state instead of assuming requested value won", async () => {
  getCollegeFeatureFlags.mockResolvedValueOnce([college({
    effectiveEnabled: false, effectiveLevel: "ORGANIZATION", effectiveLocked: false,
    editableHere: true,
  })]).mockResolvedValueOnce([college({
    effectiveEnabled: false, effectiveLevel: "ORGANIZATION", effectiveLocked: false,
    editableHere: true,
  })]);
  updateCollegeFeatureFlag.mockResolvedValue({});
  render(<FeatureControlsHub selectedCollegeId={7} />);
  const projectSwitch = await screen.findByRole("switch", { name: "Projects for Inherited college" });
  fireEvent.click(projectSwitch);
  await waitFor(() => expect(updateCollegeFeatureFlag).toHaveBeenCalledWith(7, "projects", true));
  await waitFor(() => expect(getCollegeFeatureFlags).toHaveBeenCalledTimes(2));
  expect(screen.getByRole("switch", { name: "Projects for Inherited college" })).not.toBeChecked();
});
