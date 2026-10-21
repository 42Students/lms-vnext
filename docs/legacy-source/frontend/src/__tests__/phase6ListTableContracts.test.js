import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 6 list, table, filter and tab contracts", () => {
  test("raw Ant tables expose hover, keyboard focus, selection, sort and sticky-layer feedback", () => {
    const css = read("src/styles/components/_tables.scss");
    expect(css).toContain(".ant-table-row-selected");
    expect(css).toContain(":focus-within");
    expect(css).toContain(".ant-table-column-sorter-up.active");
    expect(css).toContain(".ant-table-sticky-holder");
    expect(css).toContain(".lms-table-cell-truncate");
  });

  test("shared admin search is debounced instead of refiltering per keypress", () => {
    const toolbar = read("src/components/admin/AdminTableToolbar.js");
    expect(toolbar).toContain("setTimeout(() =>");
    expect(toolbar).toContain("}, 220)");
    expect(toolbar).toContain("typedSearch");
    expect(toolbar).toContain("Clear search");
  });

  test("TPO grids preserve URL search, provide filtered-zero recovery and shape-aware loading", () => {
    const grid = read("src/components/tpo/grid/GridWorkspace.jsx");
    expect(grid).toContain("useDebouncedValue(typed, 200)");
    expect(grid).toContain("router.replace");
    expect(grid).toContain("Clear search and filters");
    expect(grid).toContain("columnWidths={skeletonColumnWidths}");
    expect(grid).toContain("Refreshing table data");
  });

  test("filter panels are mobile-safe and expose reset/clear affordances", () => {
    const filters = read("src/components/tpo/filters/FilterPanel.jsx");
    expect(filters).toContain('placement={phone ? "bottom" : "right"}');
    expect(filters).toContain(">Reset</Button>");
    expect(filters).toContain(">Clear</button>");
    expect(filters).toContain("Clear all");
  });

  test("route-backed tabs keep active URL context and long strips are keyboard-scrollable", () => {
    const shell = read("src/components/Common/PageShell.jsx");
    const courseTabs = read("src/layouts/CourseTabsLayout.js");
    expect(shell).toContain('aria-current={tab.active ? "page" : undefined}');
    expect(shell).toContain("handleTabsKeyDown");
    expect(shell).toContain('event.key === "ArrowRight"');
    expect(shell).toContain("nav.scrollLeft = nav.scrollWidth");
    expect(courseTabs).toContain("new URLSearchParams");
    expect(courseTabs).toContain("sanitizedQuery");
  });

  test("responsive safety net keeps tables and tab strips horizontally operable", () => {
    const responsive = read("src/styles/components/_responsive-hardening.scss");
    expect(responsive).toContain(".ant-table-wrapper .ant-table-content");
    expect(responsive).toContain("overflow-x: auto !important");
    expect(responsive).toContain(".learn-projects__tabs");
    expect(responsive).toContain(".ant-tabs-nav-wrap");
    expect(responsive).toContain("min-height: 44px");
  });

  test("learner jobs demonstrate URL-persisted sort/filter/tab/page state with debounced search", () => {
    const jobs = read("src/components/Placements/JobsListContent.jsx");
    expect(jobs).toContain("SEARCH_DEBOUNCE_MS");
    expect(jobs).toContain("router.replace");
    expect(jobs).toContain("sortBy");
    expect(jobs).toContain("currentPage");
    expect(jobs).toContain("setTabAndUrl");
  });
});
