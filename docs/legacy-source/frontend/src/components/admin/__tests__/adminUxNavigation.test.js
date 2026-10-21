const fs = require("fs");
const path = require("path");
const read = (name) => fs.readFileSync(path.join(process.cwd(), "src", name), "utf8");

describe("shared administrator navigation guardrails", () => {
  test("both sidebars keep a visible scroll affordance and active item visible", () => {
    for (const file of ["components/Sidebar/AdminSidebar.js", "components/Sidebar/SuperAdminSidebar.js"]) {
      const source = read(file);
      expect(source).toContain('scrollbarWidth: "thin"');
      expect(source).toContain("viewport.scrollTop");
      expect(source).toContain('<li className="fl-panel-module-list__indicator"');
    }
  });
  test("long shared tab strips scroll their active item into view", () => {
    const source = read("components/Common/PageShell.jsx");
    expect(source).toContain('nav.scrollLeft += selected.right - viewport.right + 8');
    expect(source).toContain('overflowX: "auto"');
    expect(source).toContain('tabIndex={tabs.length > 6 ? 0 : undefined}');
  });
  test("college and super admin academic groups have next-step context", () => {
    for (const file of ["components/admin/AdminGroupShell.jsx", "components/admin/SuperAdminGroupShell.jsx"]) {
      expect(read(file)).toContain('<AdminWorkflowGuide group={group}');
    }
  });
});
