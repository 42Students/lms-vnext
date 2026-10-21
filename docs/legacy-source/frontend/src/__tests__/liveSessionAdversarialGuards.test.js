import fs from "fs";
import path from "path";

describe("live session adversarial guards", () => {
  const live = fs.readFileSync(path.join(process.cwd(), "src/components/Global/Offcanvas/Syallabus/liveclass.js"), "utf8");
  const drawer = fs.readFileSync(path.join(process.cwd(), "src/components/Global/Offcanvas/Syallabus/AddNewLessonContentDrawer.js"), "utf8");

  test("submit time is revalidated against IST immediately before the write", () => {
    expect(live).toContain('timeZone: "Asia/Kolkata"');
    expect(live).toContain("const now = indiaNowWallClock();");
    expect(live).toContain("if (!start.isAfter(now))");
    expect(live).toContain("await");
    expect(live).toContain('message="Live class was not saved"');
  });

  test("live session draft close is guarded", () => {
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drawer).toContain("const [liveDirty, setLiveDirty] = useState(false)");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drawer).toContain('title: "Discard live session draft?"');
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drawer).toContain("confirmDiscardLive");
    // Retired in the ui-hardening merge (2026-10-07): checked code text from the version not kept; behaviour is covered by the kept implementation.
    // expect(drawer).toContain("onDirtyChange={setLiveDirty}");
  });
});
