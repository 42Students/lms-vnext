import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-14 final sprint",()=>{
 it("PUB-auth-public-38 server logout clears shared-device browser storage without nuking unrelated cookies",()=>{
  const route=readFileSync("src/app/api/auth/session/route.ts","utf8");
  expect(route).toContain('response.headers.set("Clear-Site-Data", \'"storage"\')');
  expect(route).toContain('response.headers.set("Cache-Control", "no-store")');
  expect(route).toContain("revokeSessionByToken(token)");
  expect(route).toContain("SESSION_COOKIE_NAME");
  expect(route).not.toContain('Clear-Site-Data", \'"cookies"');
 });
});