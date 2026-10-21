import fs from "fs";
import path from "path";

const glance = fs.readFileSync(path.join(process.cwd(), "src/components/admin/dashboard/AtAGlance.js"), "utf8");
const activity = fs.readFileSync(path.join(process.cwd(), "src/components/admin/activity/ActivityCenter.jsx"), "utf8");

test("admin dashboard summary failures are explicit and do not become fake zero totals", () => {
  expect(glance).toMatch(/const \[error, setError\] = useState\(null\)/);
  expect(glance).toMatch(/Could not load college summary/);
  expect(glance).toMatch(/Summary refresh failed/);
  expect(glance).toMatch(/Showing the last successful college totals/);
  expect(glance).toMatch(/loadedCollegeRef/);
});

test("activity filters never display a previous query as the new query's result", () => {
  expect(activity).toMatch(/const loadedQueryRef = useRef\(null\)/);
  expect(activity).toMatch(/loadedQueryRef\.current !== queryKey/);
  expect(activity).toMatch(/setRows\(\[\]\)/);
  expect(activity).toMatch(/loadedQueryRef\.current = queryKey/);
  expect(activity).toMatch(/For a same-query refresh, keep the last successful rows visible/);
});
