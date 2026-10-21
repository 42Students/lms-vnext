import { issueToMarkdown } from "../trackerMarkdown";

const base = {
  publicId: "LMS-0001",
  reporterName: "Phanindra",
  accountRole: "MENTOR",
  environment: "PRODUCTION",
  page: "Settings",
  screen: "Tenants",
  section: "Domain / Branding",
  issueType: "Other",
  description: "Testing the tracker page",
  severity: "NOT_SURE",
  status: "NEW",
  createdAt: [2026, 9, 28, 5, 9, 4, 0],
  evidenceLink: null,
  rootCause: null,
  fixNotes: null,
  regressionTestStatus: "NOT_REVIEWED",
  retestStatus: "NOT_RETESTED",
};

describe("issueToMarkdown", () => {
  test("renders the heading, summary line, description and link", () => {
    const md = issueToMarkdown(base, { url: "https://42lms.com/tracker/issues/LMS-0001" });
    expect(md.startsWith("## LMS-0001 — Settings › Tenants › Domain / Branding")).toBe(true);
    expect(md).toContain("**Status:** New");
    expect(md).toContain("**Reported by:** Phanindra (");
    expect(md).toContain("2026");
    expect(md).toContain("**Link:** https://42lms.com/tracker/issues/LMS-0001");
    expect(md).toContain("### What went wrong\nTesting the tracker page");
  });

  test("omits empty sections rather than printing blanks", () => {
    const md = issueToMarkdown(base);
    expect(md).not.toContain("### Engineering");
    expect(md).not.toContain("**Link:**");
    expect(md).toContain("- Issue type: Other");
  });

  test("includes engineering details once they exist", () => {
    const md = issueToMarkdown({
      ...base,
      status: "CLOSED",
      resolution: "FIXED",
      rootCause: "  Missing null check  ",
      fixNotes: "Added guard",
      frontendCommitSha: "4ba276e4",
      retestStatus: "PASSED",
      productionVerified: true,
    });
    expect(md).toContain("### Engineering");
    expect(md).toContain("- Root cause: Missing null check");
    expect(md).toContain("- Frontend commit: `4ba276e4`");
    expect(md).toContain("- Retest: passed");
    expect(md).toContain("- Verified in production");
  });

  test("handles a missing issue and attachments count", () => {
    expect(issueToMarkdown(null)).toBe("");
    expect(issueToMarkdown(base, { attachmentCount: 2 })).toContain("- Attachments: 2");
  });
});
