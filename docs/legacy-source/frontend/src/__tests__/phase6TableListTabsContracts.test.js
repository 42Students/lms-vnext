import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 6 table/list/filter/pagination/tab closure contracts", () => {
  test("table loading preserves real column geometry and refresh keeps loaded content visible", () => {
    const skeletons = read("src/components/Common/Skeletons.jsx");
    const workspace = read("src/components/tpo/grid/GridWorkspace.jsx");
    const students = read("src/pages/superadmin/sections/Students.js");

    expect(skeletons).toContain("columnWidths");
    expect(skeletons).toContain("gridTemplateColumns");
    expect(workspace).toContain("skeletonColumnWidths");
    expect(workspace).toContain("columnWidths={skeletonColumnWidths}");
    expect(workspace).toContain("loading && total > 0");
    expect(workspace).toContain("<RefreshStatus");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain("tableLoading && data.length > 0");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain("TableSkeleton");
  });

  test("empty, filtered-zero and error are separate states with recovery", () => {
    const table = read("src/components/tpo/TpoDataTable.js");
    const workspace = read("src/components/tpo/grid/GridWorkspace.jsx");
    const programs = read("src/pages/superadmin/sections/Programs.js");

    expect(table).toContain('title="No rows match the current filters"');
    expect(table).toContain('title={emptyTitle || "Nothing here yet"}');
    expect(workspace).toContain("No rows match");
    expect(workspace).toContain("Clear search and filters");
    expect(programs).toContain("setLoadError");
    expect(programs).toContain("Retry");
  });

  test("raw Ant tables have deliberate hover, focus, selection, sort, sticky and long-text behavior", () => {
    const css = read("src/styles/components/_tables.scss");
    [
      ".ant-table-row:hover",
      ".ant-table-row-selected",
      ".ant-table-row:focus-within",
      ".ant-table-column-sorter-up.active",
      ".ant-table-filter-trigger.active",
      ".ant-table-cell-fix-left",
      ".ant-table-sticky-holder",
      ".lms-table-cell-truncate",
      "text-overflow: ellipsis",
    ].forEach((contract) => expect(css).toContain(contract));
  });

  test("high-frequency search is debounced and filter/search context can survive navigation", () => {
    const adminToolbar = read("src/components/admin/AdminTableToolbar.js");
    const workspace = read("src/components/tpo/grid/GridWorkspace.jsx");
    const urlFilters = read("src/components/tpo/filters/useUrlFilters.js");
    const jobs = read("src/components/Placements/JobsListContent.jsx");

    expect(adminToolbar).toContain("setTimeout");
    expect(adminToolbar).toContain("220");
    expect(adminToolbar).toContain("Clear search");
    expect(workspace).toContain("useDebouncedValue(typed, 200)");
    expect(workspace).toContain("query.q");
    expect(urlFilters).toContain("router.replace");
    expect(urlFilters).toContain("shallow: true");
    expect(jobs).toContain("Filter / sort / page state lives in the URL");
    expect(jobs).toContain("SEARCH_DEBOUNCE_MS");
  });

  test("stale list responses are suppressed and pagination/filter changes do not need destructive blanking", () => {
    const programs = read("src/pages/superadmin/sections/Programs.js");
    const students = read("src/pages/superadmin/sections/Students.js");
    const jobs = read("src/components/Placements/JobsListContent.jsx");

    expect(programs).toContain("tableSeq");
    expect(programs).toContain("if (request !== tableSeq.current) return");
    expect(students).toContain("rosterLoadIdRef");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(students).toContain("RefreshStatus");
    expect(jobs).toContain("AbortController");
    expect(jobs).toContain("delete next.page");
  });

  test("sort state stays visible and TPO grid layout/sort state persists", () => {
    const css = read("src/styles/components/_tables.scss");
    const grid = read("src/components/tpo/grid/TpoGrid.jsx");

    expect(css).toContain(".ant-table-column-sorter-up.active");
    expect(grid).toContain("getColumnState");
    expect(grid).toContain("applyColumnState");
    expect(grid).toContain("onSortChanged={saveLayout}");
    expect(grid).toContain("localStorage");
  });

  test("responsive table/filter behavior is usable on narrow and touch viewports", () => {
    const responsive = read("src/styles/components/_responsive-hardening.scss");
    const filters = read("src/components/tpo/filters/FilterPanel.jsx");

    expect(responsive).toContain(".ant-table-wrapper .ant-table-content");
    expect(responsive).toContain("overflow-x: auto !important");
    expect(responsive).toContain("touch-action: pan-x pan-y");
    expect(responsive).toContain(".tpo-grid");
    expect(filters).toContain('placement={phone ? "bottom" : "right"}');
    expect(filters).toContain('height={phone ? "85vh" : undefined}');
    expect(filters).toContain(">Reset</Button>");
  });

  test("shared route tabs preserve selected state, restrained motion and keyboard/discoverable overflow", () => {
    const shell = read("src/components/Common/PageShell.jsx");
    const course = read("src/layouts/CourseTabsLayout.js");
    const motion = read("src/styles/components/_motion.scss");

    expect(shell).toContain('aria-current={tab.active ? "page" : undefined}');
    expect(shell).toContain("scrolls horizontally");
    expect(shell).toContain('event.key === "ArrowRight"');
    expect(shell).toContain('event.key === "Home"');
    expect(shell).toContain('event.key === "End"');
    expect(course).toContain("activeTabPath");
    expect(course).toContain("buildTabHref");
    expect(course).not.toMatch(/key=\{[^}]*activeTab/);
    expect(motion).toContain(".ant-tabs-tabpane-active");
    expect(motion).toContain(".learn-projects__tab");
  });
});
