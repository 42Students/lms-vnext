const fs = require("fs");
const path = require("path");

// Lives outside src/pages/ (moved from src/pages/Dashboard/course/syllabus/__tests__/) so
// Next.js/Turbopack doesn't try to bundle this Node-only test file as a route — see
// canonicalResourceView.test.js in this same folder for the full explanation.
const viewer = fs.readFileSync(path.resolve(process.cwd(), "src/pages/Dashboard/course/syllabus/resource.js"), "utf8");

describe("canonical Resource exact-file access", () => {
  test("requests a fresh signed URL on every file click, not when the page mounts", () => {
    expect(viewer).toContain("const openFile = async index => {");
    expect(viewer).toContain("/api/v1/resource-files/${encodeURIComponent(contentId)}/materials/${index}/url");
    expect(viewer).toContain("onClick={() => openFile(index)}");
    expect(viewer).not.toContain("useEffect(");
    expect(viewer).not.toContain("getFileUrl(");
    expect(viewer).not.toContain("/api/v1/upload/file/get");
  });
  test("never exposes storage keys or unsafe links as clickable URLs", () => {
    expect(viewer).toContain("safeHttpsUrl(response?.data?.data?.url)");
    expect(viewer).toContain('const link = kind === "LINK" ? safeHttpsUrl(material?.url) : null;');
    expect(viewer).toContain('rel="noopener noreferrer"');
    expect(viewer).not.toContain('href={material?.file_dto?.cloud_storage_object}');
  });
});
