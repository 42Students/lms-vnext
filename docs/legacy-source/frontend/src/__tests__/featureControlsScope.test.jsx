import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Modal } from "antd";
import FeatureControlsHub from "@/pages/superadmin/sections/FeatureControlsHub";
import { fetchWithErrorHandling, getCollegeFeatureFlags, getFeatureModules, getMentorCountForCollege, updateCollegeFeatureFlag } from "@/api/Services/AdminService";

jest.mock("@/api/Services/AdminService", () => ({
  fetchWithErrorHandling: jest.fn(),
  getCollegeFeatureFlags: jest.fn(),
  getFeatureModules: jest.fn(),
  getMentorCountForCollege: jest.fn(),
  updateCollegeFeatureFlag: jest.fn(),
}));
const row = (collegeId, collegeName) => ({ collegeId, collegeName,
  projectsEnabled: true, placementsEnabled: true,
  modules: { projects: true, placements: true } });
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
};
beforeEach(() => {
  jest.clearAllMocks();
  fetchWithErrorHandling.mockImplementation(async (promise) => {
    try { return { success: true, data: await promise }; }
    catch (error) { return { success: false, message: error.message }; }
  });
  getFeatureModules.mockResolvedValue({ projects: "Projects", placements: "Placements" });
});

test("switches immediately hide old tenant rows and ignore slower previous-scope responses", async () => {
  const first = deferred();
  const second = deferred();
  getCollegeFeatureFlags.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
  const { rerender } = render(<FeatureControlsHub selectedCollegeId={1} selectedOrganizationId={4} />);
  await waitFor(() => expect(getCollegeFeatureFlags).toHaveBeenCalledTimes(1));
  rerender(<FeatureControlsHub selectedCollegeId={2} selectedOrganizationId={4} />);
  await waitFor(() => expect(getCollegeFeatureFlags).toHaveBeenCalledTimes(2));
  await act(async () => { second.resolve([row(1, "Wrong tenant"), row(2, "Current tenant")]);
    await second.promise; });
  expect(await screen.findByRole("switch", { name: "Projects for Current tenant" })).toBeInTheDocument();
  expect(screen.queryByRole("switch", { name: "Projects for Wrong tenant" })).not.toBeInTheDocument();
  await act(async () => { first.resolve([row(1, "Old tenant")]); await first.promise; });
  expect(screen.queryByRole("switch", { name: "Projects for Old tenant" })).not.toBeInTheDocument();
  expect(screen.getByRole("switch", { name: "Projects for Current tenant" })).toBeInTheDocument();
});

test("switching scope hides formerly loaded switches until the new response arrives", async () => {
  const second = deferred();
  getCollegeFeatureFlags.mockResolvedValueOnce([row(1, "Old college")])
    .mockReturnValueOnce(second.promise);
  const { rerender } = render(<FeatureControlsHub selectedCollegeId={1} />);
  expect(await screen.findByRole("switch", { name: "Projects for Old college" })).toBeInTheDocument();
  rerender(<FeatureControlsHub selectedCollegeId={2} />);
  expect(screen.queryByRole("switch", { name: "Projects for Old college" })).not.toBeInTheDocument();
  await act(async () => { second.resolve([row(2, "New college")]); await second.promise; });
  expect(await screen.findByRole("switch", { name: "Projects for New college" })).toBeInTheDocument();
});


test("switching Placements off requires a warning confirmation before any write", async () => {
  getCollegeFeatureFlags.mockResolvedValueOnce([row(7, "College Seven")]);
  updateCollegeFeatureFlag.mockResolvedValue({});
  const modal = jest.spyOn(Modal, "confirm").mockImplementation(() => ({ destroy: jest.fn(), update: jest.fn() }));
  try {
    render(<FeatureControlsHub selectedCollegeId={7} />);
    const placementSwitch = await screen.findByRole("switch", { name: "Placements for College Seven" });
    fireEvent.click(placementSwitch);
    expect(modal).toHaveBeenCalledTimes(1);
    const options = modal.mock.calls[0][0];
    expect(options.title).toMatch(/^Turn off Placements/);
    const contentText = typeof options.content === "string"
      ? options.content
      : render(<div>{options.content}</div>).container.textContent;
    expect(contentText).toMatch(/interviews and offers/);
    expect(contentText).toMatch(/Impact data could not be loaded/);
    expect(updateCollegeFeatureFlag).not.toHaveBeenCalled();
    await act(async () => { await options.onOk(); });
    expect(updateCollegeFeatureFlag).toHaveBeenCalledWith(7, "placements", false);
  } finally {
    modal.mockRestore();
  }
});


test("zero active primary mentors must not be described as safe to disable Projects", async () => {
  getCollegeFeatureFlags.mockResolvedValueOnce([row(7, "College Seven")]);
  getMentorCountForCollege.mockResolvedValue({ mentorCount: 0 });
  const modal = jest.spyOn(Modal, "confirm").mockImplementation(() => ({ destroy: jest.fn(), update: jest.fn() }));
  try {
    render(<FeatureControlsHub selectedCollegeId={7} />);
    fireEvent.click(await screen.findByRole("switch", { name: "Projects for College Seven" }));
    await waitFor(() => expect(modal).toHaveBeenCalledTimes(1));
    const options = modal.mock.calls[0][0];
    expect(options.content).toMatch(/not a safety check/);
    expect(options.content).toMatch(/learners, submissions/);
    expect(options.content).not.toMatch(/safe to turn off/);
    expect(options.okButtonProps.danger).toBe(true);
    expect(updateCollegeFeatureFlag).not.toHaveBeenCalled();
  } finally {
    modal.mockRestore();
  }
});
