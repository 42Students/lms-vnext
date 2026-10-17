import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const path = "src/components/courses/";
describe("faculty submitted files review", () => {
  const reviewer = readFileSync(path+"faculty-submission-file-review.tsx","utf8");
  const drawer = readFileSync(path+"faculty-assignment-review.tsx","utf8");
  it("is reachable from the existing faculty grade drawer for FILE submissions", () => {
    expect(drawer).toContain('submission.submissionType === "FILE" && filesEnabled');
    expect(drawer).toMatch(/<FacultySubmissionFileReview submissionId=\{submission\.id\}\s*\/>/);
  });
  it("gets server-scoped submission files and checks their persisted submission ID", () => {
    expect(reviewer).toContain("/api/courses/assignment-submissions/");
    expect(reviewer).toContain("/files");
    expect(reviewer).toContain("file.submissionId !== submissionId");
    expect(reviewer).toContain("parseSubmissionFiles");
  });
  it("only exposes a READY download through a matching short-lived grant", () => {
    expect(reviewer).toContain("fileStatusDescriptor(file.status).usable");
    expect(reviewer).toContain("/download-grant");
    expect(reviewer).toContain("parseFileDownloadGrant");
    expect(reviewer).toContain("grant.file.submissionId !== submissionId");
    expect(reviewer).not.toContain("localStorage");
  });
});
