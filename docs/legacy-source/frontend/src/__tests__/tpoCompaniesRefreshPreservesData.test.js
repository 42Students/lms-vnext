import fs from "fs";
import path from "path";

describe("TPO companies refresh state", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "src/pages/tpo/recruiters/index.js"), "utf8");

  test("a failed companies refresh preserves last-good rows", () => {
    expect(source).toContain('if (!c.success) { setCompaniesError(errorText(c, "Could not load companies")); return; }');
    expect(source).not.toContain('setCompaniesError(errorText(c, "Could not load companies")); setCompanies([])');
    expect(source).toContain('message="Companies could not be loaded"');
    expect(source).toContain('action={<Button size="small" onClick={refresh}>Retry</Button>}');
  });
});
