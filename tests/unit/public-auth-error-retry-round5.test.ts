import {readFileSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
const src=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-11 public session resilience",()=>{
 it("PUB-auth-public-28 retains legacy workspace failure text without exposing errors",()=>{
  const page=src("src/app/(authenticated)/error.tsx");
  expect(page).toContain("legacyWorkspaceCopy");
  const boundary=src("src/components/public/graceful-error-boundary.tsx");
  expect(boundary).toContain('"Something went wrong."');
  expect(boundary).toContain("Please refresh the page or contact support if the problem persists.");
  expect(boundary).not.toContain("{error.message}");
  expect(boundary).toContain('body: JSON.stringify({');
 });
 it("PUB-auth-public-32 respects bounded Retry-After seconds for login backoff",()=>{
  const fetcher=src("src/lib/api-fetch.ts");
  expect(fetcher).toContain('response.headers.get("Retry-After")');
  expect(fetcher).toContain("rawRetry <= 3600");
  const form=src("src/components/auth/login-form.tsx");
  expect(form).toContain("reason.retryAfterSeconds");
  expect(form).toContain("safeRetry < 120");
  expect(form).toContain("setCooldown(Math.max(cooldown,safeRetry))");
  expect(form).toContain("Too many codes were requested.");
 });
});
