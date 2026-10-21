const fs = require("fs");
const path = require("path");
const ts = require("typescript");

const composerPath = path.join(__dirname, "..", "ResourceComposer.js");
const uploadPath = path.join(__dirname, "..", "..", "..", "..", "..", "utils", "uploadToR2.js");
const composer = fs.readFileSync(composerPath, "utf8");
const upload = fs.readFileSync(uploadPath, "utf8");

describe("canonical Resource authoring contracts", () => {
  test("Resource composer and shared upload utility parse", () => {
    for (const [file, source] of [[composerPath, composer], [uploadPath, upload]]) {
      const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JSX);
      expect(parsed.parseDiagnostics).toHaveLength(0);
    }
  });

  test("Resource writes one canonical type with multiple materials", () => {
    expect(composer).toContain('content_type: "RESOURCE"');
    expect(composer).toContain("resource_materials: materials");
    // Materials are now tagged by kind ("FILE"/"LINK"), not the older generic type: "generic"
    // marker this test used to check for uploaded files.
    expect(composer).toContain('kind: "FILE"');
    expect(composer).toContain("getContentTypeFromFile(file)");
  });

  test("file MIME fallback covers all non-video Resource extensions", () => {
    for (const ext of ["txt", "csv", "xls", "xlsx", "pdf", "doc", "docx", "ppt", "pptx"]) {
      expect(upload).toContain(ext + ': "');
    }
  });

  test("regular faculty cannot request generic all-section Resource", () => {
    // The scope selector itself is locked to admins (plus the ordinary uploading/saving/
    // containsFiles busy-states) — a non-admin never sees an enabled "Shared across sections"
    // control to begin with.
    expect(composer).toContain('disabled={!isAdmin || uploading || saving || containsFiles}');
    // isShared is now a named derived value (isAdmin && scope === "SHARED"), reused for both
    // the upload-time classId omission and the save-time class_id: 0 — same admin-only-SHARED
    // guarantee the old inline expression checked, just not duplicated at each call site.
    expect(composer).toContain('const isShared = editing ? !hasClass : isAdmin && scope === "SHARED"');
    expect(composer).toContain('class_id: isShared ? 0 : (hasClass ? classId : 0)');
    expect(composer).toContain("!editing && !isAdmin && !hasClass");
  });
});
