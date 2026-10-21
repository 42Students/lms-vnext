import fs from "fs";
import path from "path";

const read = (relative) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("profile dropdown accessibility", () => {
  test.each([
    "src/components/Dropdowns/Profile/profiledropdown.js",
    "src/components/Dropdowns/Profile/SuperAdminProfileDropdown.js",
  ])("%s uses a keyboard-operable labeled trigger", (file) => {
    const source = read(file);
    expect(source).toContain('trigger={["click"]}');
    expect(source).toContain('type="button"');
    expect(source).toContain('aria-label="Open account menu"');
    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain("aria-expanded={openDropdown}");
  });

  test("My Account is one interactive link rather than a nested link/button pair", () => {
    const source = read("src/components/Dropdowns/Profile/profiledropdown.js");
    expect(source).toMatch(/<Link[\s\S]*ln-account-info__item[\s\S]*>\s*<Image/);
    expect(source).not.toMatch(/<Link[\s\S]{0,300}<button[\s\S]{0,300}My Account/);
  });
});
