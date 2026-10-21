const fs = require("fs");
const path = require("path");

// Lives outside src/pages/ (moved from src/pages/Dashboard/course/syllabus/__tests__/) so
// Next.js/Turbopack doesn't try to bundle this Node-only test file as a route — see
// canonicalResourceView.test.js in this same folder for the full explanation.
//
// Normalize CRLF to LF: syllabus.js is saved with CRLF line endings, so a source-scanning
// assertion that spans a line break (the multi-line "if (...) {\n  return" check below) must
// compare against the same convention the test literals use, or it silently breaks whenever the
// file passes through an editor/OS that flips its line endings.
const source = fs.readFileSync(path.resolve(process.cwd(), "src/pages/Dashboard/course/syllabus/syllabus.js"), "utf8").replace(/\r\n/g, "\n");

describe("Learning Path canonical Resource support", () => {
  test("lists RESOURCE in the Resources bucket with a Resource label and icon", () => {
    expect(source).toContain('import Resource from "./resource";');
    expect(source).toMatch(/\{ key: "resource", label: "Resource", plural: "Resources", icon: FileTextOutlined \}/);
    expect(source).toContain('resources: new Set(["resource"])');
    expect(source).toContain('if (type === "resource") return "Resource";');
  });
  test("routes Resource entries to the multi-material viewer and keeps no retired-type path", () => {
    expect(source).toMatch(/if \(type === "resource"\) \{\n {4}return <Resource content=\{content\} refreshAllContent=\{onContentChanged\} progress=\{progress\} onProgressUpdate=\{onProgressUpdate\} inModal \/>;/);
    expect(source).not.toMatch(/"byo"|"ppt"|"presentation"|"google_meet"|type === "pdf"|type === "lecture"/);
  });
});
