import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Phase 12 role workflow accessibility closure", () => {
  test("every persistent role shell exposes a skip link and routed main target", () => {
    const standard = read("src/layouts/layout.js");
    const admin = read("src/layouts/AdminLayout.js");
    const superAdmin = read("src/layouts/SuperAdminLayout.js");

    for (const source of [standard, admin, superAdmin]) {
      expect(source).toContain('className="lms-skip-link"');
      expect(source).toContain('href="#main-content"');
      expect(source).toContain('id="main-content"');
      expect(source).toContain("tabIndex={-1}");
      expect(source).toContain("aria-busy={isRouteTransitioning}");
    }

    expect(standard).toContain('mainContent.focus({ preventScroll: true })');
    expect(admin).toContain('mainContent.focus({ preventScroll: true })');
    expect(superAdmin).toContain('mainContent.focus({ preventScroll: true })');
  });

  test("TPO/recruiter data rows provide keyboard activation parity", () => {
    const grid = read("src/components/tpo/grid/TpoGrid.jsx");
    expect(grid).toContain('key === "enter"');
    expect(grid).toContain("onRowClicked(e.node.data, ev)");
    expect(grid).toContain("!isInteractive(ev.target)");
    expect(grid).toContain("ensureDomOrder");
    expect(grid).toContain("enableCellTextSelection");
  });

  test("admin sortable rows support keyboard reorder instead of pointer-only drag", () => {
    const sortable = read("src/components/admin/SortableTableRow.js");
    expect(sortable).toContain("KeyboardSensor");
    expect(sortable).toContain("sortableKeyboardCoordinates");
    expect(sortable).toContain('aria-label="Reorder row.');
    expect(sortable).toContain('type="button"');
  });

  test("shared async and failure states announce without making decorative placeholders noisy", () => {
    const skeletons = read("src/components/Common/Skeletons.jsx");
    const states = read("src/components/Common/PanelStates.jsx");
    expect(skeletons).toContain('role="status"');
    expect(skeletons).toContain('aria-busy="true"');
    expect(skeletons).toContain('aria-hidden="true"');
    expect(states).toContain('role="alert"');
    expect(states).toContain('aria-atomic="true"');
    expect(states).toContain('className="lms-status-badge__dot" aria-hidden="true"');
    expect(states).toContain("<span>{presentation.label}</span>");
  });

  test("shared overlays and controls preserve focus and expose popup/expanded semantics", () => {
    const drawer = read("src/components/Global/RightDrawer/DrawerWidget.js");
    const modal = read("src/components/Global/ModalContainer/ModalContainer.jsx");
    const actionMenu = read("src/components/Global/ActionMenu/actionMenu.js");
    const shell = read("src/components/Common/PageShell.jsx");

    expect(drawer).toContain("trigger.focus()");
    expect(modal).toContain("focusTriggerAfterClose");
    expect(actionMenu).toContain('aria-haspopup="menu"');
    expect(actionMenu).toContain("aria-expanded={open}");
    expect(shell).toContain('aria-current={tab.active ? "page" : undefined}');
    expect(shell).toContain('tabIndex={tabs.length > 6 ? 0 : undefined}');
  });

  test("global focus, invalid-field and skip-link treatments remain visible", () => {
    const styles = read("src/styles/components/_accessibility.scss");
    expect(styles).toContain(":focus-visible");
    expect(styles).toContain(".lms-skip-link");
    expect(styles).toContain('[aria-invalid="true"]:focus-visible');
    expect(styles).toContain(".tpo-grid .ag-root-wrapper:focus-within");
    expect(styles).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("mobile role navigation uses real links, labels and current-page state", () => {
    const footer = read("src/components/MobileFooter/MobileFooter.jsx");
    expect(footer).toContain('<nav aria-label="Mobile navigation">');
    expect(footer).toContain("aria-current={id ===");
    expect(footer).toContain('alt=""');
    expect(footer).toContain('aria-label="Projects"');
    expect(footer).toContain('aria-label="Profile"');
  });
});
