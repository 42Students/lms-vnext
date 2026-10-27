import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {generalRequestBulkBlockReason,planGeneralRequestBulk,MAX_GENERAL_REQUEST_BULK_DECISIONS,
 type GeneralRequestBulkRow} from "@/modules/placements/tpo-general-request-bulk-model";
const src=(path:string)=>readFileSync(new URL("../../"+path,import.meta.url),"utf8");
const row=(id:string,kind="ABSENCE_DISPUTE",proofUrl="https://college.example/evidence"):GeneralRequestBulkRow=>({
 id,kind,status:"PENDING",version:"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",studentName:"Learner "+id,
 payload:{proofUrl,applicationId:"application",roundId:"round"},
});
describe("TPO general request bounded bulk review",()=>{
 it("accepts only same-kind, pending, bounded selections",()=>{
  expect(planGeneralRequestBulk([row("one"),row("two")],["one","two"],"APPROVE").valid).toBe(true);
  expect(planGeneralRequestBulk([row("one"),row("two","REGISTRATION_CHANGE")],
   ["one","two"],"REJECT").valid).toBe(false);
  expect(planGeneralRequestBulk([row("one")],["one","stale"],"REJECT").valid).toBe(false);
  expect(planGeneralRequestBulk([row("one")],[], "REJECT").valid).toBe(false);
  const eleven=Array.from({length:11},(_,i)=>row(String(i)));
  expect(planGeneralRequestBulk(eleven,eleven.map(x=>x.id),"REJECT").valid).toBe(false);
  expect(MAX_GENERAL_REQUEST_BULK_DECISIONS).toBe(10);
 });
 it("skips proofless or unsupported positive decisions, but permits rejecting them",()=>{
  expect(generalRequestBulkBlockReason(row("a","ABSENCE_DISPUTE",""),"APPROVE")).toContain("Proof");
  expect(generalRequestBulkBlockReason(row("a","OFF_CAMPUS_OFFER","javascript:alert(1)"),"APPROVE")).toContain("Proof");
  expect(generalRequestBulkBlockReason(row("a","CORRECTION_WITH_PROOF"),"APPROVE")).toContain("specialist");
  expect(generalRequestBulkBlockReason(row("a","PLACEMENT_AFTER_PLACEMENT"),"APPROVE")).toContain("specialist");
  expect(generalRequestBulkBlockReason(row("a","ABSENCE_DISPUTE",""),"REJECT")).toBeNull();
  expect(generalRequestBulkBlockReason({...row("a"),status:"APPROVED"},"REJECT")).toContain("waiting");
 });
 it("exposes multi-row review using the existing authenticated CAS decision endpoint",()=>{
  const panel=src("src/components/placements/tpo-general-requests-panel.tsx");
  const bulk=src("src/components/placements/tpo-general-requests-bulk-decision.tsx");
  expect(panel).toContain("<TpoGeneralRequestsBulkDecision rows={pendingRows} onReviewed={load}/>");
  expect(bulk).toContain("/api/placements/tpo/requests/general/");
  expect(bulk).toContain("version:row.version");
  expect(bulk).toContain("encodeURIComponent(row.id)");
  expect(bulk).toContain("inFlight.current=true");
  expect(bulk).toContain("await onReviewed()");
  expect(bulk).toContain("Verify status before retrying");
  expect(bulk).toContain("if(!rows.length&&!outcomes.length&&!pending)return null;");
  expect(panel).not.toContain("!loading&&pendingRows.length>0?");
  expect(bulk).toContain('acknowledged}');
  expect(bulk).not.toContain("Promise.all(");
 });
});
describe("Authenticated topbar record search",()=>{
 it("Enter prefers real scoped TPO and recruiter results over generic links",()=>{
  const topbar=src("src/components/shell/topbar/command-search.tsx");
  const tpo=src("src/components/shell/topbar/tpo-find-suggestions.tsx");
  const recruiter=src("src/components/shell/topbar/recruiter-find-suggestions.tsx");
  const start=topbar.indexOf("  function submit()");
  const fallback=topbar.indexOf("    if (query.trim() && courseMatches[0])",start);
  const prefix=topbar.slice(start,fallback);
  expect(prefix).toContain('config.portal==="tpo"||config.portal==="hr"');
  expect(prefix).toContain('section[aria-label="Matching TPO records"] button[data-tpo-result]');
  expect(prefix).toContain('section[aria-label="Matching recruiter drives"] button[role="option"]');
  expect(prefix).toContain("if(suggestion){suggestion.click();return;}");
  expect(tpo).toContain('data-tpo-result=""');
  expect(recruiter).toContain('role="option"');
 });
});
