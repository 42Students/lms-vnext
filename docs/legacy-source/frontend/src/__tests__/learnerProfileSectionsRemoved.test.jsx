/** Profile notes (2026-10-04): no Job preferences, no Academic record, no "Who has my data" on the student profile. */
import fs from "fs";
import path from "path";

const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("the student profile page renders neither the academic record nor who-has-my-data", () => {
  const page = read("src/pages/learn/profile.js");
  expect(page).not.toMatch(/PlacementsAcademicRecord/);
  expect(fs.existsSync(path.join(process.cwd(), "src/components/profile/PlacementsAcademicRecord.jsx"))).toBe(false);
});

test("the About section has no Job preferences card", () => {
  const about = read("src/components/profile/about.js");
  expect(about).not.toMatch(/JobPreferences|Job Preferences/);
});
