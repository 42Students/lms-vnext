import {describe,it,expect} from "vitest";
import {verificationDocumentManifest} from "@/modules/verification/document-manifest";
const uuid="68b00b08-aafb-44e5-8be0-81ef27f56ab9";
describe("private document manifest",()=>{it("exposes only receipt IDs, never client-provided URLs",()=>{
 expect(verificationDocumentManifest({aadhaarDocumentId:uuid,panDocumentId:"https://unsafe.example",education:[{marksheetDocumentId:uuid}]}))
 .toEqual([{purpose:"AADHAAR",receiptId:uuid},{purpose:"MARKSHEET",receiptId:uuid}]);
});});