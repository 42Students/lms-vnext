import {describe,expect,it} from "vitest";
import {facultyProfileRecordHasManagedDocument} from "@/modules/people/faculty-receipt-row-policy";
describe("Faculty managed document removal guidance",()=>{
 it("prevents removal of entries with private receipts but permits blank ones",()=>{
  expect(facultyProfileRecordHasManagedDocument({id:"a",certificateDocumentId:null})).toBe(false);
  expect(facultyProfileRecordHasManagedDocument({id:"a",certificateDocumentId:"receipt"})).toBe(true);
  expect(facultyProfileRecordHasManagedDocument({id:"a",offerLetterDocumentId:"receipt"})).toBe(true);
 });
});
