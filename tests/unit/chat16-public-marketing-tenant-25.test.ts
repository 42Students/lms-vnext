import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomeMarketingPage, { metadata } from "@/app/home/page";

describe("chat-16 public marketing route rendering and truthful feature contract", () => {
  it("UX-public-marketing-01 renders learning, Projects and placements without removed AI claims", () => {
    const page = renderToStaticMarkup(createElement(HomeMarketingPage));
    expect(page).toContain("One connected platform for learning, projects and placements");
    expect(page).toContain("Connected talent development");
    expect(page).toContain("A connected campus and employer team");
    expect(page).toContain("Team projects with mentors");
    expect(page).toContain("Eligibility, opportunities");
    expect(page).not.toMatch(/AI-first|AI-enabled|AI grading/i);
    expect(metadata).toMatchObject({
      title: "42 LMS | Talent development",
    });
    expect(metadata.description).not.toMatch(/AI-first|AI-enabled/i);
  });

  it("UX-public-marketing-02 keeps accessible first-party demo, sign-in and privacy paths", () => {
    const page = renderToStaticMarkup(createElement(HomeMarketingPage));
    expect(page).toContain('aria-label="Public navigation"');
    expect(page).toContain('href="/login"');
    expect(page).toContain('href="/request-demo"');
    expect(page).toContain('href="/privacy-policy"');
    expect(page).toContain('href="/platform"');
    expect(page).not.toContain('href="javascript:');
  });

  it("UX-public-marketing-03 page and marketing cards have responsive phone layout constraints", () => {
    const page = renderToStaticMarkup(createElement(HomeMarketingPage));
    expect(page).toContain("min-w-0");
    expect(page).toContain("min-h-11");
    expect(page).toContain("sm:grid-cols-2");
    expect(page).toContain("sm:flex-row");
  });
});
