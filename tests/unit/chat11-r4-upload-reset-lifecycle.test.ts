import {expect,it} from "vitest";
import {initialResourceUploadUi as idle,transitionResourceUploadUi as go} from "@/modules/projects/resource-file-upload-state";
it("keeps transfer and verification state visible until the backend settles",()=>{
 const selected=go(idle,{type:"SELECT"}),uploading=go(selected,{type:"START"});
 const verifying=go(uploading,{type:"TRANSFER_COMPLETE"});
 expect(go(uploading,{type:"RESET"})).toBe(uploading);
 expect(go(verifying,{type:"CANCEL"})).toBe(verifying);
 expect(go(verifying,{type:"RESET"})).toBe(verifying);
 expect(go(verifying,{type:"VERIFIED"}).stage).toBe("SUCCEEDED");
});
it("permits cancellation of a selected or transferring file without allowing late success",()=>{
 const uploading=go(go(idle,{type:"SELECT"}),{type:"START"});
 const cancelled=go(uploading,{type:"CANCEL"});
 expect(cancelled.stage).toBe("CANCELLED");
 expect(go(cancelled,{type:"VERIFIED"})).toBe(cancelled);
 expect(go(cancelled,{type:"RESET"})).toEqual(idle);
});
