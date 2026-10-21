const fs = require("fs");
const path = require("path");
const ts = require("typescript");

// Lives outside src/pages/ (moved from src/pages/superadmin/sections/__tests__/) so
// Next.js/Turbopack doesn't try to bundle this Node-only test file as a route — see
// canonicalResourceView.test.js in this same folder for the full explanation.
const pagesRoot = path.join(process.cwd(), "src/pages");
const paths = [
  path.join(pagesRoot, "superadmin", "sections", "AdminResources.js"),
  path.join(pagesRoot, "superadmin", "lesson-content.js"),
  path.join(pagesRoot, "college-admin", "lesson-content.js"),
];
const [resources, superadmin, college] = paths.map(p => fs.readFileSync(p, "utf8"));

describe("canonical admin Resource routing and preservation", () => {
  test("Resource screen and both admin routes parse as JSX", () => {
    paths.forEach((file, index) => {
      const source = [resources, superadmin, college][index];
      expect(ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX).parseDiagnostics).toHaveLength(0);
    });
  });

  test("both admin roles route only the resources tab to canonical authoring", () => {
    [superadmin, college].forEach(source => {
      expect(source).toContain('router.query.type === "resources"');
      expect(source).toContain("<AdminResources collegeId=");
      expect(source).toContain("<LessonContent collegeId=");
    });
  });

  test("new and edited Resources write canonical multi-material payloads", () => {
    expect(resources).toContain('content_type: "RESOURCE"');
    expect(resources).toContain("resource_materials: materials");
    expect(resources).toContain("updateLessonContent(contentId(editing), payload)");
    expect(resources).toContain("createLessonContent(payload)");
    expect(resources).toContain("isAllowedResourceFile");
    expect(resources).toContain("isValidResourceLink");
  });

  test("only Resource rows are listed and file cleanup is not invoked", () => {
    expect(resources).toContain('resourceType(row) === "RESOURCE"');
    expect(resources).not.toContain("LEGACY_RESOURCES");
    expect(resources).not.toContain("Read only until migration");
    expect(resources).not.toContain("deleteFileFromR2(");
    // Deleting a Resource row is allowed: the server soft-deletes it and only cleans up a single
    // file_dto object, never resource_materials, so shared files are not removed.
  });

  // BE-0134: every way out of the editor (Cancel, X, Escape) asks before dropping changes; the mask doesn't close it.
  test("closing the editor with changes asks first", () => {
    expect(resources).toContain('window.confirm("Discard the changes to this resource?")');
    expect(resources).toContain("onCancel={closeEditor} maskClosable={false}");
    expect(resources).toContain("onClick={closeEditor}>Cancel</Button>");
  });
});
