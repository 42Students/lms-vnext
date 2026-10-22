import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {driveChangeCommandSchema} from "@/modules/placements/tpo-drive-change-request-model";

describe("chat-19 TPO change request decline flow",()=>{
 it("G2-5-023-029 opens the decline dialog before a reason is entered",()=>{
  const source=readFileSync("src/components/placements/tpo-drive-change-requests.tsx","utf8");
  expect(source).toContain('disabled={busy||(action==="ANSWER"&&(notes[item.id]??"").trim().length<1)}');
  expect(source).toContain('confirmation.action==="DECLINE"||confirmation.action==="ANSWER"');
  expect(source).toContain('confirmation.note.trim()');
  expect(source).toContain('value={confirmation.note}');
 });
 it("refuses empty reason and permits a separate typed decline reason",()=>{
  const base={action:"DECLINE",requestId:"11111111-1111-4111-8111-111111111111",
   expectedUpdatedAt:"2026-10-22T13:20:00.000Z"};
  expect(driveChangeCommandSchema.safeParse({...base,note:""}).success).toBe(false);
  expect(driveChangeCommandSchema.safeParse({...base,note:"Not aligned with the agreed job terms."}).success).toBe(true);
 });
});
