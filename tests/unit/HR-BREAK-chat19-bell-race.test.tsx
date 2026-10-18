import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {createRecruiterBellRequestGate} from "@/modules/placements/recruiter-bell-model";
import {RecruiterNotificationBell} from "@/components/hr/recruiter-notification-bell";

vi.mock("next/link",()=>({default:({children,...props}:{children:import("react").ReactNode;href:string})=>
  <a href={props.href}>{children}</a>}));

describe("HR-BREAK-BELL-RACE-30: selected college and revoked session cannot show stale notices",()=>{
 it("allows only latest request across out-of-order asynchronous fetch completions",()=>{
  const gate=createRecruiterBellRequestGate();
  const first=gate.begin(),second=gate.begin();
  expect(gate.isCurrent(first)).toBe(false);
  expect(gate.isCurrent(second)).toBe(true);
  gate.invalidate();
  expect(gate.isCurrent(second)).toBe(false);
  const third=gate.begin();
  expect(gate.isCurrent(third)).toBe(true);
 });
 it("mounts a compact, labelled and keyboard-accessible bell trigger",()=>{
  const html=renderToStaticMarkup(<RecruiterNotificationBell/>);
  expect(html).toContain('aria-label="Notifications"');
  expect(html).toContain("min-h-11");
  expect(html).toContain("focus-visible:outline-2");
 });
 it("drops expired/foreign response instead of retaining a cached tenant list",()=>{
  const source=readFileSync("src/components/hr/recruiter-notification-bell.tsx","utf8");
  expect(source).toContain("requestGate.current.begin()");
  expect(source).toContain("if(!requestGate.current.isCurrent(request))return");
  expect(source).toContain('payload.collegeId!==collegeId');
  expect(source).toContain('setData(null);setError("Couldn\'t load notifications. Try again.")');
  expect(source).toContain('requestGate.current.invalidate();setData(null);setError("")');
  expect(source).toContain('return ()=>{window.clearInterval(interval);requestGate.current.invalidate();};');
 });
});
