import {expect,it} from "vitest";
import {newResourceUploadAttempt,acceptsResourceUploadCallback} from "@/modules/projects/resource-file-upload-session-model";
const projectId="11111111-1111-4111-8111-111111111111",resourceId="22222222-2222-4222-8222-222222222222";
const one="33333333-3333-4333-8333-333333333333",two="44444444-4444-4444-8444-444444444444";
it("ignores late status callbacks from a previous upload attempt",()=>{
 const active=newResourceUploadAttempt({projectId,resourceId,attemptId:two,selectedName:"report.pdf"});
 expect(acceptsResourceUploadCallback(active,{projectId,resourceId,attemptId:one})).toBe(false);
 expect(acceptsResourceUploadCallback(active,{projectId,resourceId,attemptId:two})).toBe(true);
 expect(acceptsResourceUploadCallback(null,{projectId,resourceId,attemptId:two})).toBe(false);
});
it("does not accept secret storage URLs or arbitrary browser flags as an upload attempt",()=>{
 expect(()=>newResourceUploadAttempt({projectId,resourceId,attemptId:one,selectedName:"x.pdf",signedUrl:"https://secret"})).toThrow();
 expect(()=>newResourceUploadAttempt({projectId,resourceId:one,attemptId:"bad",selectedName:"x"})).toThrow();
});
