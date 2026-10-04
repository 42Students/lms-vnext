import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("learner self profile parity surface", () => {
  it("keeps the learner Profile route, shell entry and independent placement sections", () => {
    const shell = fs.readFileSync(
      path.join(process.cwd(), "src/components/shell/shell-model.ts"),
      "utf8",
    );
    const page = fs.readFileSync(
      path.join(process.cwd(), "src/app/(authenticated)/learn/profile/page.tsx"),
      "utf8",
    );
    const workspace = fs.readFileSync(
      path.join(process.cwd(), "src/components/profile/learner-profile-workspace.tsx"),
      "utf8",
    );

    expect(shell).toContain('href: "/learn/profile"');
    expect(page).toContain('title="Profile"');
    expect(page).toContain("Promise.allSettled");
    expect(workspace).toContain('id="job-preferences"');
    expect(workspace).toContain('id="academic-record"');
    expect(workspace).toContain("/api/profile/me");
  });
});
