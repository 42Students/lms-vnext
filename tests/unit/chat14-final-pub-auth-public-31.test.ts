import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {publicNetworkNotice} from "@/modules/auth/public-network-notice-model";
const read=(p:string)=>readFileSync(p,"utf8");
describe("chat-14 final sprint",()=>{
 it("PUB-auth-public-31 distinguishes exact legacy timeout, network and server copy",()=>{
  expect(publicNetworkNotice({status:504})).toBe("Request timed out");
  expect(publicNetworkNotice({status:408})).toBe("Request timed out");
  expect(publicNetworkNotice({status:0})).toBe("Connection problem");
  expect(publicNetworkNotice({status:503})).toBe("Server Error");
  expect(publicNetworkNotice({status:403})).toBe(null);
 });
 it("PUB-auth-public-31 failed refresh/session mutations do not claim logout",()=>{
  expect(publicNetworkNotice({status:0,isSessionChange:true})).toBe("Your session has not been cleared.");
  expect(publicNetworkNotice({status:503,isSessionChange:true})).toBe("Your session has not been cleared.");
 });
 it("PUB-auth-public-31 broadcasts safe API failure globally and keeps the offline banner",()=>{
  expect(read("src/lib/api-fetch.ts")).toContain('new CustomEvent("lms:network-notice"');
  const banner=read("src/components/auth/connection-failure-notice.tsx");
  expect(banner).toContain('<InlineNotice tone="error"');
  expect(read("src/components/ui/inline-notice.tsx")).toContain('role={tone === "error" ? "alert" : "status"}');
  expect(read("src/app/(authenticated)/layout.tsx")).toMatch(/<ConnectionFailureNotice\s*\/>/);
  const shell=read("src/components/shell/shell-connectivity-notice.tsx");
  expect(shell).toContain("offline");
  expect(shell).toContain("online");
 });
});