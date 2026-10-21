import fs from "fs";
import path from "path";

// Sharing lesson content across all sections is an administrator action (college admin / super admin). The server
// refuses it for faculty, so faculty must not be offered the choice at all: they always add to their own class.
// Prod log 2026-10-09: a faculty member picked "Shared to all sections" and got 403 "Faculty is not assigned to this
// course/class".
const read = (name) => fs.readFileSync(path.join(process.cwd(), "src/components/Global/Offcanvas/Syallabus", name), "utf8");

describe("only administrators can share content across sections", () => {
  test.each(["videoform.js", "youtube.js", "liveclass.js"])("%s hides Visibility from faculty and never sends a shared item for them", (name) => {
    const source = read(name);
    expect(source).toContain('const canShareAcrossSections = String(loginUser?.facultyType || "").toUpperCase() === "ADMIN"');
    expect(source).toMatch(/contentScope === "SHARED" && canShareAcrossSections \? 0 :/);
    expect(source).toMatch(/\{canShareAcrossSections \? \(\s*<>[\s\S]*?contentScope[\s\S]*?<\/>\s*\) : null\}/);
  });

  test("the Resource composer shows Visibility only to administrators", () => {
    const source = read("ResourceComposer.js");
    expect(source).toContain("{!editing && isAdmin && (");
    expect(source).not.toContain("Only an administrator can publish a Resource across sections.");
  });
});
