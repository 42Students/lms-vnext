import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {isExactTpoSelectionReplay,recordSelectionsSchema} from "@/modules/placements/tpo-drive-selection-model";
const a="11111111-1111-4111-8111-111111111111";
const b="22222222-2222-4222-8222-222222222222";
const entries=[
 {applicationId:a,roleTitle:"Backend engineer",annualCtcInr:1_000_000},
 {applicationId:b,roleTitle:"Designer",annualCtcInr:null},
];
const stored=entries.map(row=>({...row,status:"SELECTED"}));
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
describe("PLACEMENTS-SELECTION-IDEMP-01 record retries",()=>{
 it("identical double submit is a true no-op regardless of row order",()=>{
  expect(isExactTpoSelectionReplay(stored,entries)).toBe(true);
  expect(isExactTpoSelectionReplay(stored,[...entries].reverse())).toBe(true);
  expect(isExactTpoSelectionReplay([],[])).toBe(false);
 });
 it("changed salary, role, selected IDs, statuses or missing rows always demand real mutation",()=>{
  const bad=[
   entries.map((e,i)=>i===0?{...e,annualCtcInr:1_000_001}:e),
   entries.map((e,i)=>i===0?{...e,roleTitle:"Backend dev"}:e),
   entries.slice(0,1),
   [{...entries[0],applicationId:"33333333-3333-4333-8333-333333333333"},entries[1]],
  ];
  for(const variant of bad)expect(isExactTpoSelectionReplay(stored,variant)).toBe(false);
  expect(isExactTpoSelectionReplay(stored.map((row,i)=>i===0?{...row,status:"VERIFIED"}:row),entries)).toBe(false);
  expect(isExactTpoSelectionReplay(stored.map((row,i)=>i===0?{...row,status:"RELEASED"}:row),entries)).toBe(false);
 });
 it("new entries require validated identity, strict salary and unique application IDs",()=>{
  expect(recordSelectionsSchema.safeParse({action:"RECORD",entries}).success).toBe(true);
  expect(recordSelectionsSchema.safeParse({action:"RECORD",entries:[entries[0],entries[0]]}).success).toBe(false);
  expect(recordSelectionsSchema.safeParse({action:"RECORD",entries:[{...entries[0],annualCtcInr:NaN}]}).success).toBe(false);
 });
 it("service checks persisted rows under locks and bypasses recordedAt/audit only on exact retry",()=>{
  const service=src("src/modules/placements/tpo-drive-selection-service.ts");
  const start=service.indexOf("const existing = await tx.select()");
  const end=service.indexOf("const now=new Date();",start);
  expect(start).toBeGreaterThan(-1);
  expect(end).toBeGreaterThan(start);
  const before=service.slice(start,end);
  expect(before).toContain('.for("update")');
  expect(before).toContain("isExactTpoSelectionReplay(existing,input.entries)");
  expect(before).toContain("return {recorded:input.entries.length");
  const after=service.slice(end,service.indexOf("return {recorded:recorded.length",end));
  expect(after).toContain("auditTpoJobChange");
  expect(after).toContain("recordedAt:now");
 });
});