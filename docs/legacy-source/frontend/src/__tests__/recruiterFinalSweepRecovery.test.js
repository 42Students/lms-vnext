import fs from "fs";
import path from "path";

const read = (relative) => fs.readFileSync(path.join(process.cwd(), relative), "utf8");

describe("Recruiter final-sweep recovery contracts", () => {
  test("drive nested write failures stay persistent and recoverable", () => {
    const source = read("src/pages/recruiter/drives/[jobId].js");
    [
      // Retired in the ui-hardening merge (2026-10-07): the kept (dev) version of this page words or structures this differently.
      "Message was not sent",
      "Could not load interview slots",
    ].forEach((copy) => expect(source).toContain(copy));
    expect(source).toContain("maskClosable={!busy}");
    expect(source).toContain("cancelButtonProps={{ disabled: busy }}");
    // Retired in the ui-hardening merge (2026-10-07): the kept (dev) page reports failures without rethrowing.
    // expect(source).toContain("throw e;");
  });

  test("profile save failure is inline and the form stays present for retry", () => {
    const source = read("src/pages/recruiter/profile.js");
    expect(source).toContain("Profile was not saved");
    expect(source).toContain("Your changes are still here; try again.");
    expect(source).toContain('disabled={saving}');
    expect(source).not.toContain('message.error(code === "INVALID_EMAIL"');
  });
});
