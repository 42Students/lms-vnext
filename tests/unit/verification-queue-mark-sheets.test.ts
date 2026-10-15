import {describe,it,expect} from "vitest";
import {submittedMarksheets} from "@/modules/verification/queue-mark-sheets";
describe("marksheet filter",()=>{it("detects incomplete education evidence",()=>{
 expect(submittedMarksheets({education:[{id:"a",marksheetDocumentId:"doc"},{id:"b"}]})).toEqual({count:2,missing:1});
 expect(submittedMarksheets({})).toEqual({count:0,missing:0});
});});