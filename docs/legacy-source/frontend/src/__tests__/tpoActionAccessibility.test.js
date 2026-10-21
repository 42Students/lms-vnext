import fs from "fs";
import path from "path";

const read = (relative) =>
  fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("TPO action controls use native keyboard-operable elements", () => {
  test.each([
    "src/components/tpo/StudentPanel.js",
    "src/components/tpo/drive/ApplicantsTab.js",
    "src/components/tpo/drive/OffersTab.js",
    "src/components/tpo/drive/RoundsTab.js",
    "src/components/tpo/drive/ShareModal.js",
  ])("%s has no anchor used only as an onClick action", (file) => {
    const source = read(file);
    const actionAnchors = source.match(/<a(?![^>]*\bhref=)[^>]*\bonClick=/g) || [];
    expect(actionAnchors).toEqual([]);
  });

  test("real resume navigation remains a genuine href link", () => {
    const source = read("src/components/tpo/drive/ApplicantsTab.js");
    expect(source).toContain('<a href={safeHref(r.resumeUrl)}');
  });
});
