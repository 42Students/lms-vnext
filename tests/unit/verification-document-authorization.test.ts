import {describe,it,expect} from "vitest";
import {verificationDocumentManifest} from "@/modules/verification/document-manifest";
describe("verification document authorization",()=>{it("uses only immutable submitted receipt IDs",()=>{
 const id="68b00b08-aafb-44e5-8be0-81ef27f56ab9";
 const receipts=verificationDocumentManifest({panDocumentId:id});
 expect(receipts.some(r=>r.receiptId==="other")).toBe(false);
});});
