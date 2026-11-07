import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicRecruiterJoinForm } from "@/components/placements/public-recruiter-join-form";
import CollegeJoinLoading from "@/app/college-join/[token]/loading";

const token = "sensitive-test-invitation-do-not-display";
const preview = { kind: "READY" as const, collegeName: "Example College", companyDomain: null };

describe("UX-G045 college join recovery and accessible states", () => {
  it("renders the invitation form without showing the bearer link or code controls prematurely", () => {
    const html = renderToStaticMarkup(
      <PublicRecruiterJoinForm token={token} scope="COLLEGE" preview={preview} />,
    );
    expect(html).toContain("Hire from Example College");
    expect(html).toContain("Work email");
    expect(html).toContain("Send me a code");
    expect(html).not.toContain(token);
    expect(html).not.toContain("Change work email");
    expect(html).not.toContain("Join Example College placements");
  });

  it("expired invitations remain sign-in only and never allow code requests", () => {
    const html = renderToStaticMarkup(
      <PublicRecruiterJoinForm token={token} scope="COLLEGE" preview={{ kind: "UNAVAILABLE" }} />,
    );
    expect(html).toContain("This link is no longer valid");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Send me a code");
    expect(html).not.toContain(token);
  });

  it("verification outages offer existing recruiters a safe sign-in path without a live form", () => {
    const html = renderToStaticMarkup(
      <PublicRecruiterJoinForm token={token} scope="COLLEGE" preview={preview}
        blockedReason="Recruiter verification is temporarily unavailable." />,
    );
    expect(html).toContain("verification unavailable");
    expect(html).toContain("Already registered?");
    expect(html).toContain('href="/login"');
    expect(html).not.toContain("Send me a code");
    expect(html).not.toContain(token);
  });

  it("email correction invalidates the previous code and discovered company, guarding pending writes", () => {
    const source = readFileSync("src/components/placements/public-recruiter-join-form.tsx", "utf8");
    const change = source.match(/function changeWorkEmail\(\) \{([\s\S]*?)\n  \}/)?.[1];
    expect(change).toBeTruthy();
    for (const required of [
      "if(submittingRef.current || pending) return;",
      'setSentTo("");', 'setCode("");', 'setKnownCompany(null);',
      'setCompanyName("");', 'setError("");', 'setFieldErrors({});',
      "emailRef.current?.focus();",
    ]) expect(change).toContain(required);
    expect(source).toContain('onClick={changeWorkEmail}');
    expect(source).toContain('disabled={pending}');
    expect(source).toContain('Change work email');
    // Code input is mounted after the successful API response, not during its microtask.
    expect(source).toContain('if(sentTo && !joined) codeRef.current?.focus();');
    expect(source).not.toContain("queueMicrotask(()=>codeRef.current?.focus())");
    expect(source).toContain('readOnly={Boolean(sentTo)}');
    expect(source).toContain('if(submittingRef.current)return;');
  });

  it("loading state is announced while the preview is fetched", () => {
    const html = renderToStaticMarkup(<CollegeJoinLoading />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading college invitation");
    expect(html).not.toContain(token);
  });
});
