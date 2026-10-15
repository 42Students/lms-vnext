import {describe,it,expect} from "vitest";
import {verificationSnapshotComparison} from "@/modules/verification/snapshot-comparison";
describe("nested education comparison",()=>{
 it("reveals individual education fields without leaking receipt IDs",()=>{
 const newer={education:[{institution:"New college",grade:"9.0",marksheetDocumentId:"id"}],aadhaarNumber:"XXXXXXXX1234"};
 const older={education:[{institution:"Old college",grade:"9.0"}],aadhaarNumber:"XXXXXXXX1234"};
 const rows=verificationSnapshotComparison(newer,older);
 expect(rows.find(r=>r.key==="education [1] · institution")).toMatchObject({submitted:"New college",previouslyVerified:"Old college",changed:true});
 expect(rows.some(r=>r.key.includes("DocumentId"))).toBe(false);
 expect(rows.find(r=>r.key==="aadhaarNumber")?.submitted).toBe("XXXXXXXX1234");
 });
 it("drops malformed unmasked identity values",()=>{
 expect(verificationSnapshotComparison({panNumber:"RAWIDENTITY123"},null)).toEqual([]);
 });
});