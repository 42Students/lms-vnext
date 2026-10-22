import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {recruiterInviteHref} from "@/modules/placements/recruiter-invite-alias-model";
const read=(path:string)=>readFileSync(path,"utf8");

describe("UX-hr-invite-token-01 legacy HR invitation",()=>{
 it("validates the legacy token and redirects to the single canonical recruiter invite",()=>{
  const page=read("src/app/hr-invite/[token]/page.tsx");
  expect(page).toContain('redirect(recruiterInviteHref(token))');
  expect(page).toContain("error instanceof z.ZodError");
  expect(page).toContain("notFound()");
  expect(recruiterInviteHref("valid-token_123")).toBe("/recruiter-invite/valid-token_123");
  expect(()=>recruiterInviteHref("//evil.test/path")).toThrow();
  expect(()=>recruiterInviteHref("")).toThrow();
  expect(page).not.toContain("fetch(");
 });
 it("uses bounded public loading and public-safe recovery instead of a duplicate form",()=>{
  const loading=read("src/app/hr-invite/[token]/loading.tsx");
  const failure=read("src/app/hr-invite/[token]/error.tsx");
  expect(loading).toContain('<PublicPageLoading label="Loading invitation..."');
  const shared=read("src/components/public/public-page-loading.tsx");
  expect(shared).toContain('<GracefulPageLoading label={label}');
  expect(shared).toContain('role="status"');
  expect(failure).toContain('<GracefulErrorBoundary error={error} reset={reset} homeHref="/"');
 });
});