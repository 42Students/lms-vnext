/** Applying uses the resume on the profile; there is no per-drive upload any more. */
import fs from "fs";
import path from "path";

const src = fs.readFileSync(path.join(process.cwd(), "src/components/Placements/JobDetailContent.jsx"), "utf8");

test("the apply card has no resume upload and points to the profile instead", () => {
  expect(src).not.toMatch(/<Upload\b/);
  expect(src).not.toMatch(/UploadFromLinkButton/);
  expect(src).not.toMatch(/Upload a different resume/);
  expect(src).toMatch(/Your profile resume is sent with this application/);
  expect(src).toMatch(/href="\/learn\/profile"/);
});
