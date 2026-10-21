const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const file = path.join(__dirname, "..", "AddNewLessonContentDrawer.js");
const source = fs.readFileSync(file, "utf8");

describe("faculty course-content authoring categories", () => {
  test("drawer parses as JSX", () => {
    const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
    expect(parsed.parseDiagnostics).toHaveLength(0);
  });

  test("one canonical picker exposes exactly five categories", () => {
    expect(source).toMatch(/const CONTENT_CATEGORIES = \["Videos", "Resources", "Quizzes", "Assignments", "Live Sessions"\]/);
    expect(source).toContain("visibleCategories = CONTENT_CATEGORIES");
    expect(source).not.toContain("lessonContentList");
    expect(source).not.toContain("Build Your Own");
    expect(source).not.toContain("Lecture Notes");
    expect(source).not.toContain("Presentation");
  });

  test("both faculty Resource entries use the multi-material composer", () => {
    expect(source).toContain('import ResourceComposer from "./ResourceComposer"');
    expect(source).toMatch(/active === "Resources" && <ResourceComposer key=\{childResetKey\} back=\{requestCloseChild\}/);
    expect(source).toMatch(/isResourcesMode\s*\?\s*\(\s*<ResourceComposer/);
    expect(source).not.toContain("ResourceSimple");
  });

  test("video sources and assessments retain their dedicated editors", () => {
    expect(source).toContain('setVideoSource("UPLOAD")');
    expect(source).toContain('setVideoSource("YOUTUBE")');
    expect(source).toContain('open={active === "Quizzes"}');
    expect(source).toContain('open={active === "Assignments"}');
    expect(source).toContain('active === "Live Sessions" && <LiveClass');
  });

  // Prod 2026-10-09: the Lectures tab's "Add Video" stacked two "Add Video" drawers (a one-item "1. Videos" list, then
  // the Upload/YouTube choice). Video-only mode now shows the choice in the one drawer.
  test("video-only mode shows the Upload / YouTube choice in a single drawer", () => {
    expect(source).toContain('visibleCategories.length === 1 && visibleCategories[0] === "Videos"');
    expect(source).toContain(") : isVideoOnlyMode ? (");
    expect(source).toContain("{!isResourcesMode && !isLiveMode && !isVideoOnlyMode && (");
  });
});
