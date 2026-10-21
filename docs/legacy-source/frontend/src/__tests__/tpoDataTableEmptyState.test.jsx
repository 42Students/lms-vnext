/**
 * UI/UX brutal-audit round 3: every TpoDataTable consumer (Students, RecruiterLeads, Drives list, Audit,
 * Reports) previously fell through to antd's bare "No data" for both "nothing here yet" and "no
 * results for your search" - two very different situations that should never look the same.
 *
 * The decision of which empty state to show is exported as a pure function
 * (isTpoDataTableFiltered) and tested directly here: antd v5's Table with scroll.x runs a
 * column-width "measure" pass via ResizeObserver/getBoundingClientRect that never settles in
 * jsdom (confirmed - even with a ResizeObserver polyfill, the placeholder cell stays an
 * unmeasured, childless placeholder), so asserting the rendered emptyText text through the full
 * antd Table is not something jsdom can prove either way; the actual decision logic is what
 * matters and is what's under test.
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import TpoDataTable, { isTpoDataTableFiltered } from "@/components/tpo/TpoDataTable";

const mockRouter = { query: {}, pathname: "/tpo/drives", replace: jest.fn() };
jest.mock("next/router", () => ({ useRouter: () => mockRouter }));
jest.mock("@/api/Services/TpoHubService", () => ({ getSavedViews: jest.fn(), saveView: jest.fn(), deleteView: jest.fn() }));
jest.mock("@/api/Services/AdminService", () => ({ fetchWithErrorHandling: jest.fn(() => Promise.resolve({ success: true, data: [] })) }));

test("not filtered when there's no search text and no active filters", () => {
  expect(isTpoDataTableFiltered("", undefined)).toBe(false);
  expect(isTpoDataTableFiltered("", {})).toBe(false);
  expect(isTpoDataTableFiltered("", { view: "ALL", branch: null })).toBe(false);
});

test("filtered when there's search text", () => {
  expect(isTpoDataTableFiltered("asha", undefined)).toBe(true);
  expect(isTpoDataTableFiltered("  spaced  ", undefined)).toBe(true);
});

test("filtered when a real filter value is active, ignoring placeholder 'ALL'/empty values", () => {
  expect(isTpoDataTableFiltered("", { branch: "CSE" })).toBe(true);
  expect(isTpoDataTableFiltered("", { view: "REGISTERED" })).toBe(true);
  expect(isTpoDataTableFiltered("", { view: "ALL", branch: "" })).toBe(false);
});

test("page-level filters never masquerade as a genuinely empty dataset", () => {
  const columns = [{ title: "Name", dataIndex: "name", key: "name" }];
  render(
    <TpoDataTable
      columns={columns}
      data={[]}
      rowKey="id"
      exportName="test"
      filters={{ stage: "OPEN" }}
      emptyTitle="No drives yet"
      emptySubtitle="Create the first drive."
    />
  );
  expect(screen.getByText("No rows match the current filters")).toBeInTheDocument();
  expect(screen.getByText("Adjust or clear the page filters to see more rows.")).toBeInTheDocument();
  expect(screen.queryByText("No drives yet")).not.toBeInTheDocument();
});

test("genuinely empty datasets keep the page's domain-specific empty state", () => {
  const columns = [{ title: "Name", dataIndex: "name", key: "name" }];
  render(
    <TpoDataTable
      columns={columns}
      data={[]}
      rowKey="id"
      exportName="test"
      filters={{ view: "ALL" }}
      emptyTitle="No drives yet"
      emptySubtitle="Create the first drive."
    />
  );
  expect(screen.getByText("No drives yet")).toBeInTheDocument();
  expect(screen.getByText("Create the first drive.")).toBeInTheDocument();
  expect(screen.queryByText("No rows match the current filters")).not.toBeInTheDocument();
});

test("long lists are not cut into 25-row pages: every row is in the grid, which scrolls", async () => {
  const columns = [{ title: "Name", dataIndex: "name", key: "name" }];
  const rows = Array.from({ length: 30 }, (_, i) => ({ id: i, name: `Row ${i}` }));
  render(<TpoDataTable columns={columns} data={rows} rowKey="id" exportName="test" />);
  await screen.findByText("Row 0");
  expect(document.querySelector(".ant-pagination")).toBeNull();
  expect(screen.getByTestId("grid-counts")).toHaveTextContent("30 in this view");
});
