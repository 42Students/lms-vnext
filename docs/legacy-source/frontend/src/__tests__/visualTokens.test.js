import fs from "fs";
import path from "path";

describe("global visual tokens", () => {
  const source = fs.readFileSync(
    path.join(process.cwd(), "src/styles/components/_variables.scss"),
    "utf8"
  );

  test.each([
    ["space-1", "4px"],
    ["space-2", "8px"],
    ["space-3", "12px"],
    ["space-4", "16px"],
    ["space-5", "24px"],
    ["space-6", "32px"],
    ["space-7", "48px"],
    ["space-8", "64px"],
  ])("%s has one canonical definition", (token, value) => {
    const matches = [...source.matchAll(new RegExp(`\\$${token}\\s*:\\s*([^;]+);`, "g"))];
    expect(matches).toHaveLength(1);
    expect(matches[0][1].trim()).toBe(value);
  });

  test("light browser color scheme matches the light LMS shell", () => {
    const globalStyles = fs.readFileSync(
      path.join(process.cwd(), "src/styles/components/_global.scss"),
      "utf8"
    );
    expect(globalStyles).toMatch(/color-scheme:\s*light;/);
    expect(globalStyles).not.toMatch(/prefers-color-scheme:\s*dark/);
  });

  test("canonical card/control radii remain centralized", () => {
    expect(source).toMatch(/\$radius-control\s*:\s*6px;/);
    expect(source).toMatch(/\$radius-card\s*:\s*12px;/);
    expect(source).toMatch(/\$radius-feature\s*:\s*18px;/);
    expect(source).toMatch(/\$radius-pill\s*:\s*999px;/);
  });
});
