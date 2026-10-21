import fs from "fs";
import path from "path";

const read = (rel) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

// antd closes a Modal.confirm when onOk resolves; it stays open (for a retry) only when onOk rejects.
describe("destructive confirmations stay open when the server refuses (BE-0094, BE-0112, BE-0210)", () => {
  test("recruiter account lifecycle actions", () => {
    const s = read("src/pages/superadmin/sections/RecruiterAccounts.js");
    const failure = s.slice(s.indexOf('message.error(errorText(res, "Action failed"));'));
    expect(failure.slice(0, 200)).toContain('throw new Error("action failed")');
  });

  test("drive deletion", () => {
    const s = read("src/pages/superadmin/sections/Jobs.js");
    expect(s).toContain("const deleted = await handleDelete(jobId);");
    expect(s).toContain('if (!deleted) throw new Error("delete failed");');
  });

  test("moving a college's web address", () => {
    const s = read("src/pages/superadmin/sections/CollegeSubdomain.js");
    expect(s).toContain("onOk: () => doAllot(true)");
    expect(s).toContain("if (fromConfirm) throw e;");
  });
});
