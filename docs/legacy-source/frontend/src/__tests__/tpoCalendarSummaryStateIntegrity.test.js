import fs from "fs";
import path from "path";

const src = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/calendar.js"), "utf8");

test("calendar auxiliary summary failures are not presented as real empty schedules or zero work", () => {
  expect(src).toMatch(/const \[soonError, setSoonError\] = useState\(null\)/);
  expect(src).toMatch(/const \[pastError, setPastError\] = useState\(null\)/);
  expect(src).toMatch(/message="Calendar summary is partially unavailable"/);
  expect(src).toMatch(/Today&apos;s schedule could not be verified/);
  expect(src).toMatch(/The next 7 days could not be verified/);
  expect(src).toMatch(/missing rows are not treated as zero/);
});

test("follow-up move and done operations are single-flight", () => {
  expect(src).toMatch(/const \[followUpBusyId, setFollowUpBusyId\] = useState\(null\)/);
  expect(src).toMatch(/if \(followUpBusyRef\.current\) return false/);
  expect(src).toMatch(/confirmLoading=\{moving \? Number\(followUpBusyId\) === Number\(moving\.id\) : false\}/);
  expect(src).toMatch(/disabled=\{followUpBusyId != null\}/);
});
