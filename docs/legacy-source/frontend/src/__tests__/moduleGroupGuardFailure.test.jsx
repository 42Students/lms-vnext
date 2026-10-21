import React from "react";
import { render, screen } from "@testing-library/react";
import ModuleGroupGuard from "@/components/admin/ModuleGroupGuard";
import useCollegeFeatureFlags from "@/utils/useCollegeFeatureFlags";

jest.mock("@/utils/useCollegeFeatureFlags", () => jest.fn());
let mockLoginUser = { id: 31, userType: "FACULTY", facultyType: "ADMIN", collegeId: 6 };
jest.mock("react-redux", () => ({ useSelector: (select) => select({ loginUser: mockLoginUser }) }));

const page = <div>Projects page</div>;

describe("module guard only says 'turned off' when the server said so", () => {
  test("switched off", () => {
    useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: false, modules: { projects: false }, loading: false, failed: false });
    render(<ModuleGroupGuard groupKey="projects">{page}</ModuleGroupGuard>);
    expect(screen.getByText("Projects is turned off for this college")).toBeInTheDocument();
  });

  test("lookup failed: show the page, not a false 'turned off'", () => {
    useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: false, modules: {}, loading: false, failed: true });
    render(<ModuleGroupGuard groupKey="projects">{page}</ModuleGroupGuard>);
    expect(screen.queryByText("Projects is turned off for this college")).not.toBeInTheDocument();
    expect(screen.getByText("Projects page")).toBeInTheDocument();
  });

  test("still loading: no verdict yet", () => {
    useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: false, modules: {}, loading: true, failed: false });
    render(<ModuleGroupGuard groupKey="projects">{page}</ModuleGroupGuard>);
    expect(screen.queryByText("Projects is turned off for this college")).not.toBeInTheDocument();
    expect(screen.queryByText("Projects page")).not.toBeInTheDocument();
  });

  test("on", () => {
    useCollegeFeatureFlags.mockReturnValue({ projectsEnabled: true, modules: { projects: true }, loading: false, failed: false });
    render(<ModuleGroupGuard groupKey="projects">{page}</ModuleGroupGuard>);
    expect(screen.getByText("Projects page")).toBeInTheDocument();
  });
});

// College admin audit CA-H06: only a super admin can switch modules back on.
describe("who is told how to turn a module back on", () => {
  const off = { projectsEnabled: false, modules: { projects: false }, loading: false, failed: false };

  test("a college admin is pointed to the super admin, not to a Module Access page they do not have", () => {
    mockLoginUser = { id: 31, userType: "FACULTY", facultyType: "ADMIN", collegeId: 6 };
    useCollegeFeatureFlags.mockReturnValue(off);
    render(<ModuleGroupGuard groupKey="projects">{page}</ModuleGroupGuard>);
    expect(screen.getByText(/Ask them to turn it on/)).toBeInTheDocument();
    expect(screen.queryByText(/from Module Access/)).not.toBeInTheDocument();
  });

  test("a super admin is sent to Module Access", () => {
    mockLoginUser = { id: 0, userType: "FACULTY" };
    useCollegeFeatureFlags.mockReturnValue(off);
    render(<ModuleGroupGuard groupKey="projects">{page}</ModuleGroupGuard>);
    expect(screen.getByText(/Turn it back on from Module Access/)).toBeInTheDocument();
  });
});
