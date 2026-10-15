import {expect,it} from "vitest";
import {initialResourceUploadUi,transitionResourceUploadUi as go} from "@/modules/projects/resource-file-upload-state";
it("requires backend verification before reporting a successful upload",()=>{
 const selected=go(initialResourceUploadUi,{type:"SELECT"});
 const started=go(selected,{type:"START"});
 const transferred=go(started,{type:"TRANSFER_COMPLETE"});
 expect(transferred.stage).toBe("VERIFYING");
 expect(go(started,{type:"VERIFIED"})).toBe(started);
 expect(go(transferred,{type:"VERIFIED"}).stage).toBe("SUCCEEDED");
});
it("clamps progress and rejects nonfinite or regressing updates",()=>{
 const started=go(go(initialResourceUploadUi,{type:"SELECT"}),{type:"START"});
 const p=go(started,{type:"PROGRESS",value:65});
 expect(go(p,{type:"PROGRESS",value:15}).progress).toBe(65);
 expect(go(p,{type:"PROGRESS",value:Infinity}).progress).toBe(65);
 expect(go(p,{type:"PROGRESS",value:120}).progress).toBe(99);
});
it("never reflects private backend error text to the learner",()=>{
 const started=go(initialResourceUploadUi,{type:"SELECT"});
 expect(go(started,{type:"FAIL",message:"secret object key"}).message).not.toContain("secret");
});
