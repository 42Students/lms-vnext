import { describe, expect, it, vi } from "vitest";
import { checkedAssignmentFileDeclaration, uploadStagedAssignmentFile } from "@/components/courses/assignment-staged-file-transfer";
const uuid=(n:number)=>"00000000-0000-4000-8000-"+String(n).padStart(12,"0");
const record={ id:uuid(1),assignmentId:uuid(2),deliveryId:uuid(3),submissionId:null,sequence:null,
 originalName:"note.txt",contentType:"text/plain",sizeBytes:4,status:"UPLOADING",failureCode:null,
 createdAt:"2026-10-16T10:00:00Z",completedAt:null };
const headers={ "content-type":"text/plain", "x-amz-meta-upload-token":"secret",
 "x-amz-meta-owner-membership-id":uuid(4),"x-amz-meta-college-id":uuid(5),
 "x-amz-meta-expected-size":"4","x-amz-meta-malware-scan-status":"PENDING" };
describe("staged assignment file transfer",()=>{
 it("checks the shared storage policy before requesting a grant",()=>{
   const good=new File(["note"],"note.txt",{type:""});
   expect(checkedAssignmentFileDeclaration(good,uuid(3))).toMatchObject({ok:true,value:{contentType:"text/plain"}});
   expect(checkedAssignmentFileDeclaration(new File(["x"],"bad.exe"),uuid(3)).ok).toBe(false);
 });
 it("performs grant, private PUT and completion without submitting assignment",async()=>{
   const file=new File(["note"],"note.txt",{type:"text/plain"});
   const expiresAt=new Date(Date.now()+600_000).toISOString();
   const fetcher=vi.fn<typeof fetch>()
     .mockResolvedValueOnce(Response.json({file:record,grant:{receiptId:record.id,method:"PUT",uploadUrl:"https://storage.example.test/private?sig=1",expiresAt,requiredHeaders:headers,originalName:"note.txt"}},{status:201}))
     .mockResolvedValueOnce(Response.json({file:{...record,status:"READY"}}, {status:200}));
   const put=vi.fn().mockResolvedValue(undefined);
   const result=await uploadStagedAssignmentFile(uuid(2),uuid(3),file,new AbortController().signal,()=>{},fetcher,put);
   expect(result.status).toBe("READY");
   expect(fetcher.mock.calls.map(c=>c[0])).toEqual([
     `/api/courses/assignments/${uuid(2)}/submission-files`,
     `/api/courses/assignments/${uuid(2)}/submission-files/${uuid(1)}/complete`
   ]);
   expect(put).toHaveBeenCalledWith("https://storage.example.test/private?sig=1",headers,file,expect.any(AbortSignal),expect.any(Function));
   expect(fetcher.mock.calls[0]?.[1]).toMatchObject({credentials:"same-origin",method:"POST"});
 });
 it("never sends bytes if the backend grant identity mismatches the selected file",async()=>{
   const file=new File(["note"],"note.txt",{type:"text/plain"});
   const fetcher=vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json({file:{...record,deliveryId:uuid(9)},grant:{
     receiptId:uuid(1),method:"PUT",uploadUrl:"https://storage.example.test/private",expiresAt:new Date(Date.now()+600_000).toISOString(),
     requiredHeaders:headers,originalName:"note.txt"
   }}));
   const put=vi.fn().mockResolvedValue(undefined);
   await expect(uploadStagedAssignmentFile(uuid(2),uuid(3),file,new AbortController().signal,()=>{},fetcher,put)).rejects.toThrow("did not match");
   expect(put).not.toHaveBeenCalled();
 });
});
