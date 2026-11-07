import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync } from "node:fs";
import PrivacyPage, { metadata } from "@/app/privacy-policy/page";

describe("UX-G078 canonical indexed policy accessibility", () => {
  it("renders all 13 original legal sections, stable contact links and date", async () => {
    const rendered = renderToStaticMarkup(await PrivacyPage());
    const legal = readFileSync("public/assets/static/privacy-policy-view.html", "utf8");
    const allAnchors = [
      "overview","data-we-collect","how-we-use","how-we-share","retention",
      "security","choices","children","changes","contact","cookies","transfers","ads-analytics",
    ];
    expect((rendered.match(/<section id="/g) ?? []).length).toBe(13);
    for (const id of allAnchors) {
      expect(rendered).toContain('href="#' + id + '"');
      expect(rendered).toContain('id="' + id + '"');
      expect(legal).toContain('id="' + id + '"');
    }
    expect(rendered).toContain("Effective date: April 20, 2026");
    expect(rendered).toContain('href="mailto:privacy@42lms.com"');
    expect(rendered).toContain("Skip to policy content");
    expect(rendered).toContain("min-height:44px");
    expect(rendered).not.toContain("Sign in to continue");
  });
  it("preserves canonical indexing and the authored policy as the only legal body", () => {
    expect(metadata).toMatchObject({
      title: "Privacy Policy | 42LMS",
      alternates: { canonical: "https://42lms.com/privacy-policy" },
      robots: { index: true, follow: true },
    });
    const s = readFileSync("src/app/privacy-policy/page.tsx", "utf8");
    expect(s).toContain("readFile(join(process.cwd()");
    expect(s).toContain("dangerouslySetInnerHTML={{__html:documentBody}}");
    expect(s).not.toContain('redirect(');
  });
});
