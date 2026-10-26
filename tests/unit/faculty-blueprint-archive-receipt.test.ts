import {describe,expect,it} from "vitest";
import {facultyBlueprintArchiveReceiptMatches} from "../../src/modules/courses/faculty-blueprint-archive-receipt-model";

const id="f06e44ce-1770-4f52-8bcc-947d20b8ef57";
describe("Faculty Blueprint archive response receipts",()=>{
 it.each([
  ["CONTENT",{content:{id,status:"ARCHIVED"}}],
  ["ASSIGNMENT",{assignment:{id,status:"ARCHIVED"}}],
  ["QUIZ",{quiz:{id,status:"ARCHIVED"}}],
 ] as const)("confirms an authorized archived %s", (kind,body)=>{
  expect(facultyBlueprintArchiveReceiptMatches(kind,id,body)).toBe(true);
 });
 it.each(["CONTENT","ASSIGNMENT","QUIZ"] as const)(
  "does not confirm %s with an unrelated response, different ID or draft status",kind=>{
   const key=kind==="CONTENT"?"content":kind==="ASSIGNMENT"?"assignment":"quiz";
   expect(facultyBlueprintArchiveReceiptMatches(kind,id,null)).toBe(false);
   expect(facultyBlueprintArchiveReceiptMatches(kind,id,{error:"ARCHIVE_FAILED"})).toBe(false);
   expect(facultyBlueprintArchiveReceiptMatches(kind,id,{[key]:{id:"foreign",status:"ARCHIVED"}})).toBe(false);
   expect(facultyBlueprintArchiveReceiptMatches(kind,id,{[key]:{id,status:"DRAFT"}})).toBe(false);
   expect(facultyBlueprintArchiveReceiptMatches(kind,id,{[key]:[{id,status:"ARCHIVED"}]})).toBe(false);
  },
 );
});