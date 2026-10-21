import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ModuleAccess from "@/pages/superadmin/sections/ModuleAccess";
import {
  explainModuleAccess,
  fetchWithErrorHandling,
  getLearnerModuleOverrides,
  getModuleAccessTree,
} from "@/api/Services/AdminService";
import { searchLearners } from "@/api/Services/LearnerSearchService";

jest.mock("@/api/Services/AdminService", () => ({
  explainModuleAccess: jest.fn(),
  fetchWithErrorHandling: jest.fn(),
  getLearnerModuleOverrides: jest.fn(),
  getModuleAccessTree: jest.fn(),
  setModuleAccess: jest.fn(),
}));

jest.mock("@/api/Services/LearnerSearchService", () => ({
  searchLearners: jest.fn(),
}));

jest.mock("lodash", () => ({
  debounce: (fn) => {
    fn.cancel = jest.fn();
    return fn;
  },
}));

jest.mock("antd", () => {
  const React = require("react");
  const actual = jest.requireActual("antd");
  return {
    ...actual,
    AutoComplete: ({ options = [], onSearch, onSelect }) => (
      <div>
        <button onClick={() => onSearch("old")}>search-old</button>
        <button onClick={() => onSearch("new")}>search-new</button>
        <button onClick={() => onSelect("1")}>select-one</button>
        <button onClick={() => onSelect("2")}>select-two</button>
        <div data-testid="search-options">{options.map((o) => o.label).join("|")}</div>
      </div>
    ),
  };
});

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

const traceResult = (label) => ({
  modules: [{
    module: "projects",
    label,
    enabled: true,
    decidedAtLevel: "DEFAULT",
    locked: false,
    levels: [],
  }],
});

describe("ModuleAccess stale request protection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    fetchWithErrorHandling.mockImplementation(async (promise) => {
      try {
        return { success: true, data: await promise };
      } catch (error) {
        return { success: false, message: error?.message || "request failed" };
      }
    });
    getModuleAccessTree.mockResolvedValue({ canEditCollegeLevel: true, nodes: [] });
    getLearnerModuleOverrides.mockResolvedValue({ students: [] });
  });

  it("ignores an older learner-search response after a newer search has won", async () => {
    const oldSearch = deferred();
    searchLearners
      .mockReturnValueOnce(oldSearch.promise)
      .mockResolvedValueOnce({ data: { data: [{ id: 2, firstName: "Newest", lastName: "Student" }] } });

    render(<ModuleAccess collegeId={7} isSuperAdmin />);

    fireEvent.click(screen.getByText("search-old"));
    fireEvent.click(screen.getByText("search-new"));

    await waitFor(() => expect(screen.getByTestId("search-options")).toHaveTextContent("Newest Student"));

    await act(async () => {
      oldSearch.resolve({ data: { data: [{ id: 1, firstName: "Stale", lastName: "Student" }] } });
      await oldSearch.promise;
    });

    expect(screen.getByTestId("search-options")).toHaveTextContent("Newest Student");
    expect(screen.getByTestId("search-options")).not.toHaveTextContent("Stale Student");
  });

  it("ignores an older access trace after a newer learner is selected", async () => {
    const firstTrace = deferred();
    explainModuleAccess
      .mockReturnValueOnce(firstTrace.promise)
      .mockResolvedValueOnce(traceResult("Newest trace"));

    render(<ModuleAccess collegeId={7} isSuperAdmin />);

    fireEvent.click(screen.getByText("select-one"));
    fireEvent.click(screen.getByText("select-two"));

    expect(await screen.findByText("Newest trace")).toBeInTheDocument();

    await act(async () => {
      firstTrace.resolve(traceResult("Stale trace"));
      await firstTrace.promise;
    });

    expect(screen.getByText("Newest trace")).toBeInTheDocument();
    expect(screen.queryByText("Stale trace")).not.toBeInTheDocument();
  });
});
