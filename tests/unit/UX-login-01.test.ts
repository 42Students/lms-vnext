import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("UX-login-01 secure OTP entry",()=>{
 it("preserves canonical sign-in route, metadata and identity checks",()=>{
  expect(read("src/app/login/page.tsx")).toContain('export { default, generateMetadata } from "../page"');
  const page=read("src/app/page.tsx");
  expect(page).toContain("<LoginForm");
  expect(page).toContain('safeReturnTo(');
  expect(page).toContain("effectiveCollegeSignInCapabilities");
  const form=read("src/components/auth/login-form.tsx");
  expect(form).toContain("useGuardedAction");
  expect(form).toContain('import { Input }');
  expect(form).toContain('import { Button }');
 });
 it("provides phone-first bounded skeleton and public rather than dashboard-only error recovery",()=>{
  const loading=read("src/app/login/loading.tsx");
  const error=read("src/app/login/error.tsx");
  expect(loading).toContain("min-h-dvh");
  expect(loading).toContain("max-w-xl");
  expect(loading).toContain("<GracefulPageLoading");
  expect(error).toContain('homeHref="/"');
  expect(error).toContain("<GracefulErrorBoundary");
 });
});