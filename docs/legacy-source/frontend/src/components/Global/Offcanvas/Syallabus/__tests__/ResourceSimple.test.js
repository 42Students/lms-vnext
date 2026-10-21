const fs = require("fs");
const path = require("path");

const dir = path.resolve(__dirname, "..");
const legacyEntry = fs.readFileSync(path.join(dir, "ResourceSimple.js"), "utf8");
const canonicalComposer = fs.readFileSync(path.join(dir, "ResourceComposer.js"), "utf8");
const drawer = fs.readFileSync(path.join(dir, "AddNewLessonContentDrawer.js"), "utf8");

// Every maintained Resource authoring entry should converge on one canonical
// RESOURCE contract. An old import must not silently create legacy content.
describe("Resource authoring entry points", () => {
  test("older ResourceSimple callers use the canonical composer", () => {
    expect(legacyEntry).toMatch(/export\s*\{\s*default\s*\}\s*from\s*["']\.\/ResourceComposer["']/);
    expect(legacyEntry).not.toMatch(/createLessonContent|content_type\s*:/);
  });

  test("canonical composer writes one Resource containing all materials", () => {
    expect(canonicalComposer).toContain('content_type: "RESOURCE"');
    expect(canonicalComposer).toContain("resource_materials: materials");
    expect(canonicalComposer).toContain("isAllowedResourceFile");
    expect(canonicalComposer).toContain("isValidResourceLink");
  });

  test("faculty picker opens the canonical composer", () => {
    expect(drawer).toContain('import ResourceComposer from "./ResourceComposer"');
    expect(drawer).toMatch(/<ResourceComposer key=\{childResetKey\} back=\{requestCloseChild\}/);
  });
});
