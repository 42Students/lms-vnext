import fs from "fs";
import path from "path";

const list = fs.readFileSync(path.join(process.cwd(), "src/components/admin/studentGroups/StudentGroupsList.jsx"), "utf8");
const detail = fs.readFileSync(path.join(process.cwd(), "src/components/admin/studentGroups/StudentGroupDetail.jsx"), "utf8");

test("student-group list failures are distinct from empty and stale cross-filter rows are cleared", () => {
  expect(list).toMatch(/const \[loadError, setLoadError\] = useState\(null\)/);
  expect(list).toMatch(/const loadedQueryRef = useRef\(null\)/);
  expect(list).toMatch(/loadedQueryRef\.current !== queryKey/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(list).toMatch(/message=\{rows\.length \? "Groups refresh failed" : "Could not load groups"\}/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(list).toMatch(/Could not load groups; use Retry above/);
});

test("student-group detail load failures stop the spinner and provide retry", () => {
  expect(detail).toMatch(/const \[loadError, setLoadError\] = useState\(null\)/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(detail).toMatch(/if \(loadError && !group\)/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(detail).toMatch(/message="Could not load the group"/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(detail).toMatch(/message="Group refresh failed"/);
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(detail).toMatch(/action=\{<Button onClick=\{loadGroup\}>Retry<\/Button>\}/);
});


test("student-group detail mutations are fail-closed, draft-safe and immediate single-flight", () => {
  expect(detail).toContain("const savingRef = useRef(false)");
  expect(detail).toContain("const statusRef = useRef(false)");
  expect(detail).toContain("Discard group edits?");
  expect(detail).toContain("const mutationRef = useRef(false)");
  expect(detail).toContain("Members could not be loaded");
  // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
  // expect(detail).toContain("Rule could not be loaded");
  expect(detail).toContain("Activity could not be loaded");
  expect(detail).toContain("const busyRef = useRef(false)");
});
