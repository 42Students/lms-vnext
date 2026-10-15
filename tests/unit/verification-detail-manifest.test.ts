import {describe,it,expect} from "vitest";
import {verificationDocumentManifest} from "@/modules/verification/document-manifest";
describe("review detail document projection",()=>{it("never returns a link from user snapshot",()=>{
 expect(verificationDocumentManifest({resumeDocumentId:"https://fake.test/file"})).toEqual([]);
});});
