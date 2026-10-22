import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import HomeMarketingPage, { metadata } from "@/app/home/page";

describe("chat-16 public marketing route rendering and truthful feature contract", () => {
  it("UX-public-marketing-01 renders learning, Projects and placements without removed AI claims", () => {
    const page = renderToStaticMarkup(createElement(HomeMarketingPage));
    expect(page).toContain("One connected platform for learning, hands-on projects, mentoring and placements");
    expect(page).toContain("One connected team developing talent");
    expect(page).toContain("Create stronger talent pipelines");
    expect(page).toContain("Run team projects with tasks, milestones, submissions and reviews.");
    expect(page).toContain("Manage readiness, eligibility and student verification.");
    expect(page).toContain("Bring mentors and learners together around project progress and feedback.");
    expect(page).not.toMatch(/AI-first|AI-enabled|AI grading/i);
    expect(metadata).toMatchObject({title:{absolute:"42 LMS — Learning, Projects and Placements"}});
    expect(metadata.description).not.toMatch(/AI-first|AI-enabled/i);
  });

  it("UX-public-marketing-02 keeps accessible first-party demo, sign-in and privacy paths", () => {
    const page = renderToStaticMarkup(createElement(HomeMarketingPage));
    expect(page).toContain('aria-label="Product"');
    expect(page).toContain('aria-label="Get started"');
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
