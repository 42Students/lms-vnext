import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

describe("TPO report unknown-route recovery",()=>{
 it("TPO-calendar-reports-53 announces Refreshing report instead of an unlabeled skeleton",()=>{
  const code=readFileSync(join(process.cwd(),
   "src/app/(authenticated)/tpo/reports/loading.tsx"),"utf8");
  expect(code).toContain('GracefulPageLoading label="Refreshing report…"');
  const skeleton=readFileSync(join(process.cwd(),
    "src/components/ui/skeleton.tsx"),"utf8");
  const graceful=readFileSync(join(process.cwd(),
    "src/components/ui/graceful-page-loading.tsx"),"utf8");
  expect(skeleton).toContain('role="status"');
  expect(skeleton).toContain('aria-live="polite"');
  expect(graceful).toContain("This is taking longer than expected. Please try again.");
  expect(graceful).toContain("window.location.reload()");
 });

 it("TPO-calendar-reports-53 shows Unknown report and return to reports only for authorized TPO members",()=>{
  const code=readFileSync(join(process.cwd(),
   "src/app/(authenticated)/tpo/reports/[slug]/page.tsx"),"utf8");
  expect(code).toContain('title="Unknown report"');
  expect(code).toContain("Back to reports");
  expect(code).toContain('href="/tpo/reports"');
  expect(code).toContain('hasMembershipRole(context, "TPO")');
  expect(code).toContain('redirect("/dashboard")');
 });
});
