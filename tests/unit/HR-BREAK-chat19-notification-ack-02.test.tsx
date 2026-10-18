import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {createHrBellMutationGate} from "@/modules/placements/hr-recruiter-bell-model";
import {hrNotificationReadError} from "@/modules/placements/hr-notification-read-feedback-model";
import {readFileSync} from "node:fs";

vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()})}));
import {HrNotificationReadButton} from "@/components/hr/hr-notification-read-button";

describe("HR-BREAK-NOTIFICATIONS-02: recruiter receipt double submit and revocation UX",()=>{
 it("single flight blocks immediate repeated click until failed/settled request ends",()=>{
  const gate=createHrBellMutationGate();
  expect(gate.tryBegin()).toBe(true);
  expect(gate.tryBegin()).toBe(false);
  expect(gate.tryBegin()).toBe(false);
  gate.end();
  expect(gate.tryBegin()).toBe(true);
 });
 it.each([
  [401,"session has ended"],[403,"no longer have access"],
  [404,"no longer available"],[409,"changed"],
  [429,"Too many requests"],[500,"Unable to mark as read"],
 ])("maps response %i to safe guidance rather than leaking network errors", (status,phrase)=>{
  expect(hrNotificationReadError(status)).toContain(phrase);
  expect(hrNotificationReadError(status)).not.toMatch(/SQL|UnauthorizedError|PLACEMENT_/);
 });
 it("initial button renders a real keyboard-visible 44px action without raw error codes",()=>{
  const html=renderToStaticMarkup(<HrNotificationReadButton
    notificationId="11111111-1111-4111-8111-111111111111"
    expectedCreatedAt="2026-10-18T10:00:00.000Z"
  />);
  expect(html).toContain("Mark as read");
  expect(html).toContain("min-h-11");
  expect(html).toContain("focus-visible:outline-2");
  expect(html).not.toContain("min-h-10");
 });
 it("handler owns a synchronous single-flight and terminal success guard, without changing POST scope",()=>{
  const source=readFileSync("src/components/hr/hr-notification-read-button.tsx","utf8");
  expect(source).toContain("!gate.current.tryBegin()");
  expect(source).toContain("completeRef.current=true");
  expect(source).toContain("gate.current.end()");
  expect(source).toContain("disabled={saving||complete}");
  expect(source).toContain('method:"POST"');
  expect(source).toContain("JSON.stringify({expectedCreatedAt})");
 });
});
