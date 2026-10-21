import { renderHook, waitFor } from "@testing-library/react";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";
import Api from "@/api/ApiMethod";

jest.mock("@/api/ApiMethod", () => ({ __esModule: true, default: { get: jest.fn() } }));
jest.mock("@/utils/authUtils", () => ({ getAccessToken: jest.fn(() => null) }));

afterEach(() => { jest.clearAllMocks(); });

describe("optional module availability is never guessed ON", () => {
  it("hides optional modules during loading and after a failed settings request", async () => {
    Api.get.mockRejectedValueOnce(new Error("settings unavailable"));
    const { result, unmount } = renderHook(() => useCollegeFeatureFlags());
    expect(result.current.projectsEnabled).toBe(false);
    expect(result.current.placementsEnabled).toBe(false);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projectsEnabled).toBe(false);
    expect(result.current.placementsEnabled).toBe(false);
    unmount();
  });

  it("does not infer enablement from missing/garbled flags or retired Courses state", async () => {
    Api.get.mockResolvedValueOnce({ data: { data: { modules: { courses: false, projects: "yes" } } } });
    const { result, unmount } = renderHook(() => useCollegeFeatureFlags());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projectsEnabled).toBe(false);
    expect(result.current.placementsEnabled).toBe(false);
    expect(result.current.modules).not.toHaveProperty("courses");
    unmount();
  });

  it("shows optional modules only after a successful boolean ON response", async () => {
    Api.get.mockResolvedValueOnce({ data: { data: {
      projectsEnabled: true, placementsEnabled: true,
      modules: { projects: true, placements: true, courses: false }
    } } });
    const { result, unmount } = renderHook(() => useCollegeFeatureFlags());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.projectsEnabled).toBe(true);
    expect(result.current.placementsEnabled).toBe(true);
    expect(result.current.modules).not.toHaveProperty("courses");
    unmount();
  });
});
