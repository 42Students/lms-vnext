import {describe,it,expect} from "vitest";
import {safeTpoShellCounters,shellUnreadBadge} from "../../src/components/shell/shell-counts-model";
describe("TPO shell unread counters",()=>{
 it("TPO-inbox-team-28 validates distinct Messages and Team unread counts without fabricating zero",()=>{
  expect(safeTpoShellCounters({requests:2,messages:4,notifications:1,team:3}))
   .toEqual({requests:2,messages:4,notifications:1,team:3});
  expect(safeTpoShellCounters({requests:2,messages:"4",notifications:1,team:3})).toBeNull();
  expect(safeTpoShellCounters({requests:2,messages:-1,notifications:1,team:3})).toBeNull();
 });
 it("TPO-inbox-team-63 and TPO-requests-verification-06 preserve unknown badges instead of treating failure as empty",()=>{
  expect(safeTpoShellCounters({requests:9,messages:0,notifications:0,team:null})?.team).toBeNull();
  expect(shellUnreadBadge(null)).toBeNull();
  expect(shellUnreadBadge(0)).toBeNull();
  expect(shellUnreadBadge(120)).toBe("99+");
  expect(shellUnreadBadge(5)).toBe("5");
 });
 it("GR-75 suppresses invalid realtime counters without leaking provider errors",()=>{
  expect(safeTpoShellCounters(null)).toBeNull();
  expect(safeTpoShellCounters({requests:1,messages:1,notifications:Infinity,team:0})).toBeNull();
 });
});