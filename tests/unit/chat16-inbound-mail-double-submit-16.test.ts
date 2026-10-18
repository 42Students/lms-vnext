import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {createInboundMailTriageGate} from "@/modules/inbound-mail/triage-submit-model";

describe("chat-16 inbound-mail exactly-once browser action guards",()=>{
 it("inbound-mail-double-submit-16 blocks two PATCH attempts made before a React rerender",()=>{
  const gate=createInboundMailTriageGate();
  expect(gate.tryBegin()).toBe(true);
  expect(gate.tryBegin()).toBe(false);
  expect(gate.tryBegin()).toBe(false);
  gate.end();
  expect(gate.tryBegin()).toBe(true);
 });
 it("inbound-mail-double-submit-17 does not lock unrelated inbox tabs or instances",()=>{
  const first=createInboundMailTriageGate();
  const second=createInboundMailTriageGate();
  expect(first.tryBegin()).toBe(true);
  expect(second.tryBegin()).toBe(true);
  expect(first.tryBegin()).toBe(false);
  first.end();
  expect(first.tryBegin()).toBe(true);
  expect(second.tryBegin()).toBe(false);
  second.end();
 });
 it("inbound-mail-double-submit-18 wires the same-tick gate into client CAS and releases it on failure",()=>{
  const code=readFileSync("src/components/admin/inbound-mail-list.tsx","utf8");
  expect(code).toContain("useRef(createInboundMailTriageGate())");
  expect(code).toContain("if(!triageGate.current.tryBegin())return;");
  expect(code).toContain("finally{triageGate.current.end();setBusy(false);}");
  expect(code).toContain('method:"PATCH",credentials:"same-origin"');
  expect(code).toContain("expectedStatus:current.status,expectedVersion:current.version");
  expect(code).toContain("Message was changed elsewhere. Refresh before retrying.");
  expect(code).toContain("disabled={busy}");
  expect(code).toContain('role="status"');
 });
});
