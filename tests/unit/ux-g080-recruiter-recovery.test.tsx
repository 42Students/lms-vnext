import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import RecruiterNotFound from "@/app/(authenticated)/recruiter/not-found";
import RecruiterRootError from "@/app/(authenticated)/recruiter/error";
import RecruiterCalendarError from "@/app/(authenticated)/recruiter/calendar/error";
import RecruiterCollegesError from "@/app/(authenticated)/recruiter/colleges/error";
import RecruiterCompanyError from "@/app/(authenticated)/recruiter/company/error";
import RecruiterDrivesError from "@/app/(authenticated)/recruiter/drives/error";
import RecruiterCalendarLoading from "@/app/(authenticated)/recruiter/calendar/loading";
import RecruiterCollegesLoading from "@/app/(authenticated)/recruiter/colleges/loading";
import RecruiterCompanyLoading from "@/app/(authenticated)/recruiter/company/loading";
import RecruiterDrivesLoading from "@/app/(authenticated)/recruiter/drives/loading";
import RecruiterRootLoading from "@/app/(authenticated)/recruiter/loading";

describe("UX-G080 recruiter route recovery and transition states", () => {
  it("keeps not-found navigation on the recruiter entrypoint", () => {
    const html = renderToStaticMarkup(<RecruiterNotFound />);
    expect(html).toContain('href="/recruiter/home"');
    expect(html).not.toContain('href="/hr/home"');
    expect(html).toContain("Go to recruiter Today");
  });
  it("recovers within recruiter Today instead of cross-account HR aliases", () => {
    const error = Object.assign(new Error("SECRET_PROVIDER_ERROR"), {digest:"private-digest"});
    for (const Component of [RecruiterRootError,RecruiterCalendarError,RecruiterCollegesError,
      RecruiterCompanyError,RecruiterDrivesError]) {
      const html=renderToStaticMarkup(<Component error={error} reset={() => {}} />);
      expect(html).toContain('href="/recruiter/home"');
      expect(html).toContain("Try again");
      expect(html).not.toContain("SECRET_PROVIDER_ERROR");
      expect(html).not.toContain("private-digest");
    }
  });
  it("names every alias loading state without pretending a redirect is a college directory", () => {
    const html=[RecruiterCalendarLoading,RecruiterCollegesLoading,RecruiterCompanyLoading,
      RecruiterDrivesLoading,RecruiterRootLoading].map(Component=>renderToStaticMarkup(<Component />));
    expect(html.every(s=>s.includes("Loading")||s.includes("Opening"))).toBe(true);
    expect(html[1]).toContain("Opening recruiter Today");
    expect(html[3]).toContain("Loading recruiter drives");
    expect(html.every(s=>s.includes('role="status"'))).toBe(true);
  });
});
