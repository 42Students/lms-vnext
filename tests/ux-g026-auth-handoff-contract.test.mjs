import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const page=readFileSync("src/app/auth/handoff/page.tsx","utf8");
const error=readFileSync("src/app/auth/handoff/error.tsx","utf8");
const loading=readFileSync("src/app/auth/handoff/loading.tsx","utf8");

test("UX-G026 bearer credential handoff is never indexed or forwarded",()=>{
  assert.match(page,/export const dynamic = "force-dynamic"/);
  assert.match(page,/index: false, follow: false, noarchive: true/);
  assert.match(page,/referrer: "no-referrer"/);
  assert.match(page,/safeReturnTo\(requested\)/);
  assert.match(page,/const permitted = new Set\(\["tab", "view", "page", "month"/);
  assert.match(page,/retained\.set\(key,value\)/);
  assert.match(page,/redirect\("\/login\?auth=handoff-retired"/);
  assert.doesNotMatch(page,/\bfetch\(|localStorage|setCookie\(/);
});

test("UX-G026 error recovery uses one public landmark and keeps shared retry reporting",()=>{
  assert.match(error,/<main className=/);
  assert.match(error,/<Card as="section"/);
  assert.match(error,/<PageHeader title="This sign-in link may have expired"/);
  assert.match(error,/insideShell showHeader=\{false\}/);
  assert.match(error,/homeHref="\/\?auth=handoff-retired"/);
  assert.match(error,/GracefulErrorBoundary error=\{error\} reset=\{reset\}/);
  assert.match(loading,/<PublicPageLoading label="Opening secure sign-in\.\.\."/);
});
