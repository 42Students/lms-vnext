import fs from "fs";
import path from "path";
import {
  adminNavigationMenuFlat,
  adminNavigationMenuForSidebar,
  superAdminNavigationMenuFlat,
  superAdminNavigationMenuForSidebar,
} from "../lists";

const adminMenus = [
  adminNavigationMenuFlat,
  adminNavigationMenuForSidebar,
  superAdminNavigationMenuFlat,
  superAdminNavigationMenuForSidebar,
];

describe("Deleted Items feature removal", () => {
  test.each(adminMenus)("does not expose the removed page in either admin navigation", (buildMenu) => {
    const menu = buildMenu();
    expect(menu.some((item) => item.path === "deleted-items" || item.modulename === "Deleted Items")).toBe(false);
  });

  test("preserves the college-admin divider after Activity Log", () => {
    const menu = adminNavigationMenuForSidebar();
    const auditIndex = menu.findIndex((item) => item.path === "audit");
    expect(auditIndex).toBeGreaterThanOrEqual(0);
    expect(menu[auditIndex + 1]).toEqual({ divider: true });
    expect(menu[auditIndex + 2].path).toBe("departments");
    expect(menu[0].divider).not.toBe(true);
    expect(menu[menu.length - 1].divider).not.toBe(true);
    expect(menu.every((item, i) => !item.divider || !menu[i + 1]?.divider)).toBe(true);
  });

  test.each([
    "src/pages/college-admin/deleted-items.js",
    "src/pages/superadmin/deleted-items.js",
    "src/pages/superadmin/sections/DeletedItems.js",
  ])("does not leave an accessible page or unused screen at %s", (relativePath) => {
    expect(fs.existsSync(path.join(process.cwd(), relativePath))).toBe(false);
  });
});
