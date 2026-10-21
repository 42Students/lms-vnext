import {
  getSafeInternalReturnPath,
  withReturnTo,
} from "../navigationContext";

describe("navigation return context", () => {
  test("keeps internal list state including query and hash", () => {
    expect(
      getSafeInternalReturnPath(
        "/college-admin/jobs?q=acme#active",
        { fallback: "/college-admin/jobs", allowedPrefixes: ["/college-admin/jobs"] }
      )
    ).toBe("/college-admin/jobs?q=acme#active");
  });

  test("rejects external, protocol-relative and out-of-scope paths", () => {
    const opts = {
      fallback: "/college-admin/jobs",
      allowedPrefixes: ["/college-admin/jobs"],
    };

    expect(getSafeInternalReturnPath("//evil.example", opts)).toBe(opts.fallback);
    expect(getSafeInternalReturnPath("https://evil.example", opts)).toBe(opts.fallback);
    expect(getSafeInternalReturnPath("/learn/jobs", opts)).toBe(opts.fallback);
  });

  test("adds an encoded return path without dropping existing query", () => {
    expect(withReturnTo(
      "/college-admin/jobs/42/applications?status=APPLIED",
      "/college-admin/jobs?q=acme"
    )).toBe(
      "/college-admin/jobs/42/applications?status=APPLIED&returnTo=%2Fcollege-admin%2Fjobs%3Fq%3Dacme"
    );
  });
});
