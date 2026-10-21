import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("Applicants read-only mode blocks shortcuts and underlying move/review mutations", () => {
  const src = read("src/components/tpo/drive/ApplicantsTab.js");
  expect(src).toMatch(/const moveOne = \(row, to\) => \{\s*if \(readOnly\) return;/);
  expect(src).toMatch(/const reviewShortlist = async \(row\) => \{\s*if \(readOnly\) return false;/);
  expect(src).toMatch(/const reviewReject = async \(row\) => \{\s*if \(readOnly\) return false;/);
  expect(src).toMatch(/data-testid="applicants\.suggest-do"[^>]*disabled=\{readOnly\}|disabled=\{readOnly\}[^>]*data-testid="applicants\.suggest-do"/);
});

test("Offers read-only mode blocks row actions and underlying mutation helpers", () => {
  const src = read("src/components/tpo/drive/OffersTab.js");
  expect(src).toMatch(/const openRecording = \(ids\) => \{\s*if \(readOnly\) return;/);
  expect(src).toMatch(/const act = async \(label, call, offerId\) => \{\s*if \(readOnly \|\| busyRef\.current\) return null;/);
  expect(src).toMatch(/const verifyMany = async \(list\) => \{\s*if \(readOnly \|\| busyRef\.current\) return;/);
  expect(src).toMatch(/const menuFor = \(o\) => \{\s*if \(readOnly\) return \{ items: \[\] \};/);
  expect(src).toMatch(/<Dropdown disabled=\{readOnly\}[^>]*menu=\{menuFor\(o\)\}/);
  expect(src).toMatch(/<Button size="small" disabled=\{readOnly\} loading=\{busyId === o\.offerId\}>Actions<\/Button>/);
});
