const fs = require("fs");
const path = require("path");

const util = fs.readFileSync(path.resolve(__dirname, "../resourceUploadToR2.js"), "utf8");
const composer = fs.readFileSync(path.resolve(__dirname, "../../components/Global/Offcanvas/Syallabus/ResourceComposer.js"), "utf8");
const admin = fs.readFileSync(path.resolve(__dirname, "../../pages/superadmin/sections/AdminResources.js"), "utf8");

describe("Canonical Resource upload scope", () => {
  test("requires Resource-only presign, never generic fallback", () => {
    expect(util).toContain('Api.post("/api/v1/resource-uploads/presign", payload)');
    expect(util).toContain('type: "resource"');
    expect(util).not.toContain("uploadFileViaBackend");
  });
  test("faculty binds class only when not shared and locks scope after uploading", () => {
    expect(composer).toContain("uploadResourceFile(file");
    expect(composer).toContain("!isShared && hasClass");
    expect(composer).toContain("containsFiles");
  });
  test("admin edits upload against persisted content class, not filter state", () => {
    expect(admin).toContain("const targetClassId = editing ? classIdOf(editing) : classId");
    expect(admin).toContain("uploadResourceFile(file");
    expect(admin).toContain("disabled={!courseId || editorOpen || uploading}");
  });
});
