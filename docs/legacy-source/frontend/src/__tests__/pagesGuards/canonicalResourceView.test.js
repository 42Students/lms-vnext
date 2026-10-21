const fs = require("fs");
const path = require("path");
const ts = require("typescript");

// Lives outside src/pages/ (moved from src/pages/Dashboard/course/syllabus/__tests__/) so
// Next.js/Turbopack doesn't try to bundle this Node-only test file as a route — it previously
// broke `next build` with "Module not found: Can't resolve 'fs'" once Turbopack became the
// default bundler, since every .js under pages/ is scanned as a route candidate. Resolves paths
// from the project root instead of __dirname so the file can move freely.
const detailPath = path.join(process.cwd(), "src/pages/Dashboard/course/syllabus/syllabusDetail.js");
const resourcePath = path.join(process.cwd(), "src/pages/Dashboard/course/syllabus/resource.js");
const detail = fs.readFileSync(detailPath, "utf8");
const resource = fs.readFileSync(resourcePath, "utf8");

describe("canonical Resource learner view", () => {
  test("both JSX files parse", () => {
    for (const [file, source] of [[detailPath, detail], [resourcePath, resource]]) {
      const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
      expect(parsed.parseDiagnostics).toHaveLength(0);
    }
  });

  test("Resource renders through the lesson view and no retired-type renderer remains", () => {
    expect(detail).toContain('import Resource from "./resource"');
    expect(detail).toContain('case "resource":');
    expect(detail).toContain('<Resource content={lessonContent}');
    for (const retired of ['case "pdf":', 'case "ppt":', 'case "lecture":', 'case "byo":', 'case "google_meet":']) {
      expect(detail).not.toContain(retired);
    }
  });

  test("viewer resolves each file individually and rejects non-HTTPS links", () => {
    expect(resource).toContain("materials.map((material, index)");
    // Resolves through the dedicated per-material authorized endpoint (see
    // fix(course-content): resolve Resource files through exact authorized material endpoint,
    // commit 1661bb47), not the older raw-key getFileUrl(key) pattern this test used to check.
    expect(resource).toContain("/materials/${index}/url");
    expect(resource).toContain("safeHttpsUrl(material?.url)");
    expect(resource).toContain('rel="noopener noreferrer"');
  });
});
