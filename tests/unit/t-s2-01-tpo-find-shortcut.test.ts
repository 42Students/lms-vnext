import {describe,expect,it} from "vitest";
import {isTpoFindShortcut} from "@/modules/placements/tpo-find-shortcut-model";
const base={key:"k",ctrlKey:true,metaKey:false,altKey:false,shiftKey:false};
describe("T-S2-01 exact legacy TPO Ctrl K shortcut",()=>{
 it("supports Windows and macOS shortcuts",()=>{
  expect(isTpoFindShortcut(base)).toBe(true);
  expect(isTpoFindShortcut({...base,ctrlKey:false,metaKey:true,key:"K"})).toBe(true);
 });
 it("does not steal regular typing or unrelated modified keys",()=>{
  expect(isTpoFindShortcut({...base,ctrlKey:false})).toBe(false);
  expect(isTpoFindShortcut({...base,altKey:true})).toBe(false);
  expect(isTpoFindShortcut({...base,shiftKey:true})).toBe(false);
  expect(isTpoFindShortcut({...base,key:"p"})).toBe(false);
 });
});
