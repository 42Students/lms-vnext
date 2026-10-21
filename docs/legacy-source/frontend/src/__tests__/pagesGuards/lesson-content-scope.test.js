const fs = require("fs");
const path = require("path");
const ts = require("typescript");

// Lives outside src/pages/ (moved from src/pages/superadmin/__tests__/) so Next.js/Turbopack
// doesn't try to bundle this Node-only test file as a route — see canonicalResourceView.test.js
// in this same folder for the full explanation.
const source = fs.readFileSync(path.join(process.cwd(), "src/pages/superadmin/lesson-content.js"), "utf8");

// A restored UI selection can precede the new scoped JWT. Both editor routes
// must remain unmounted while scope restoration or synchronization is pending.
describe("superadmin lesson-content scope", () => {
  test("page parses as JSX", () => {
    const file = ts.createSourceFile("lesson-content.jsx", source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
    expect(file.parseDiagnostics).toHaveLength(0);
  });

  test("both editors are behind the same scope gate", () => {
    expect(source).toMatch(/!scopeLoaded\s*\|\|\s*scopeApplying\s*\|\|\s*scopeOutOfSync\s*\|\|\s*scopeApplyError/);
    const gate = source.indexOf("if (!scopeLoaded");
    const resource = source.indexOf("<AdminResources collegeId={selectedCollegeId}");
    const legacy = source.indexOf("<LessonContent collegeId={selectedCollegeId}");
    expect(gate).toBeGreaterThan(0);
    expect(resource).toBeGreaterThan(gate);
    expect(legacy).toBeGreaterThan(gate);
    expect(source).toContain("if (selectedCollegeId == null)");
  });
});
