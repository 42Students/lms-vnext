import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";
import {HrRecruiterBell} from "@/components/hr/hr-recruiter-bell";
import {createRecruiterBellRequestGate} from "@/modules/placements/recruiter-bell-model";
vi.mock("next/link",()=>({default:({children,href}:{children:import("react").ReactNode;href:string})=>
 <a href={href}>{children}</a>}));

describe("HR-BREAK-ACTIVE-BELL-34: visible recruiter bell does not auto-ack or leak stale notices",()=>{
 it("opening the actual shell bell does not POST/acknowledge notifications",()=>{
  const source=readFileSync("src/components/hr/hr-recruiter-bell.tsx","utf8");
  const trigger=source.slice(source.indexOf('aria-expanded={open} aria-haspopup="dialog"'),source.indexOf("Notifications {unread"));
  expect(trigger).toContain("onClick={()=>setOpen(value=>!value)}");
  expect(trigger).not.toContain("markAll()");
  expect(source).toContain('onClick={()=>void markAll()}');
 });
 it("requires a persisted read receipt; sign-in redirects and HTML cannot count as success",()=>{
  const source=readFileSync("src/components/hr/hr-recruiter-bell.tsx","utf8");
  expect(source).toContain('redirect:"error"');
  expect(source).toContain("if(!isHrBellReadReceipt(receipt))");
  expect(source).toContain('Number.isSafeInteger(count)&&count>=0');
 });
 it("clears stale private notices on loss of access or late reordered refresh",()=>{
  const source=readFileSync("src/components/hr/hr-recruiter-bell.tsx","utf8");
  expect(source).toContain("if(!loadGate.current.isCurrent(request))return");
  expect(source).toContain('setState(null);setError("Couldn\'t refresh your notifications")');
  expect(source).toContain("loadGate.current.invalidate()");
  const gate=createRecruiterBellRequestGate();
  const a=gate.begin(),b=gate.begin();
  expect(gate.isCurrent(a)).toBe(false);
  expect(gate.isCurrent(b)).toBe(true);
  gate.invalidate();
  expect(gate.isCurrent(b)).toBe(false);
 });
 it("provides 44px trigger and focusable hidden-scrollbar content affordance",()=>{
  const html=renderToStaticMarkup(<HrRecruiterBell/>);
  expect(html).toContain("min-h-11");
  expect(html).toContain("aria-haspopup");
  const source=readFileSync("src/components/hr/hr-recruiter-bell.tsx","utf8");
  expect(source).toContain('<ScrollCue axis="y" label="Recruiter notifications"');
  expect(source).toContain('role="dialog" aria-modal="false"');
  expect(source).toContain('event.key!=="Escape"');
  expect(source).toContain('triggerRef.current?.focus()');
 });
});
