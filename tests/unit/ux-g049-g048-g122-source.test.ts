import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const read=(path:string)=>readFileSync(path,"utf8");

describe("UX-G049 retired E2E sign-in non-escalation and recovery",()=>{
  const path="src/app/e2e/superadmin-login/";
  it("preserves development-only signed administrator gate and no session mint",()=>{
    const source=read(path+"page.tsx");
    expect(source).toContain('process.env.NODE_ENV === "development"');
    expect(source).toContain('process.env["E2E_AUTH_ENABLED"] === "true"');
    expect(source).toContain('isSuperAdmin(await getCurrentRequestContext())');
    expect(source).toContain('robots: { index: false, follow: false, noarchive: true }');
    expect(source).toContain('referrer: "no-referrer"');
    expect(source).not.toMatch(/createSession|setSessionCookie|issueSessionToken/);
    expect(source).toContain('href="/login"');
    expect(source).toContain('href="/home"');
  });
  it("shows a responsive, non-disclosing error and loading state",()=>{
    const error=read(path+"error.tsx"), loading=read(path+"loading.tsx");
    expect(error).toContain('role="alert"');
    expect(error).toContain("onClick={reset}");
    expect(error).toContain('href="/login"');
    expect(error).not.toMatch(/error\.message|error\.digest/);
    expect(error).toContain("min-h-11");
    expect(loading).toContain("Opening retired test sign-in guidance");
  });
});
describe("UX-G048 dashboard role-aware overview",()=>{
  it("keeps privileged metrics scoped and improves responsive navigation",()=>{
    const source=read("src/app/(authenticated)/dashboard/page.tsx");
    expect(source).toContain('if (!collegeId)');
    expect(source).toContain("isSuperAdmin(context)");
    expect(source).toContain("listMembershipChoices(context.user.identityUid)");
    expect(source).toContain('aria-label="Dashboard summary metrics"');
    expect(source).toContain("sm:grid-cols-2 xl:grid-cols-4");
    expect(source).toContain('aria-label="More college administration"');
  });
  it("has matched loading skeletons and a route-independent recovery destination",()=>{
    const loading=read("src/app/(authenticated)/dashboard/loading.tsx");
    const error=read("src/app/(authenticated)/dashboard/error.tsx");
    expect(loading).toContain('aria-busy="true"');
    expect(loading).toContain("SkeletonBlock");
    expect(loading).toContain("Array.from({length:4}");
    expect(error).toContain('insideShell homeHref="/home"');
  });
});
describe("UX-G122 tracker access, list/detail and degraded states",()=>{
  it("retains exact named Super Admin gate and negative audit",()=>{
    const source=read("src/app/(authenticated)/tracker/logs/page.tsx");
    expect(source).toContain('!isSuperAdmin(context)');
    expect(source).toContain('context.adminScope?.collegeId || context.adminScope?.organizationId');
    expect(source).toContain("platform.tracker.logs_access_denied");
    expect(source).toContain("platform.tracker.logs_viewed");
    expect(source).toContain('aria-label="Log tools"');
    expect(read("src/app/(authenticated)/tracker/logs/loading.tsx")).toContain('title="Logs"');
  });
  it("keeps reporter-only private reports, safe retries and noindex detail",()=>{
    const dir="src/app/(authenticated)/tracker/mine/";
    const list=read(dir+"page.tsx"), detail=read(dir+"[publicId]/page.tsx");
    expect(list).toContain('if(context.user.platformStatus!=="ACTIVE")redirect("/dashboard")');
    expect(list).toContain("listMyTrackerReports(context)");
    expect(list).toContain('aria-label="Your reported issues"');
    expect(list).toContain("Try loading reports again");
    expect(detail).toContain("getMyTrackerReport(context,publicId)");
    expect(detail).toContain('trackerPublicIdSchema.safeParse(canonical)');
    expect(detail).toContain("robots:{index:false,follow:false}");
    expect(detail).toContain("Try loading this report again");
    expect(detail).toContain("Retry screenshots");
  });
});
