import {expect,it} from "vitest";
import {signTpoBulkPreview,verifyTpoBulkPreview,TPO_BULK_PREVIEW_TTL_MS}
 from "@/modules/placements/tpo-bulk-preview-token";
import {tpoBulkPreviewRequestSchema} from "@/modules/placements/tpo-bulk-workflow-model";
const id="11111111-1111-4111-8111-111111111111";
const p=tpoBulkPreviewRequestSchema.parse({target:"STUDENTS",action:"ELIGIBLE",ids:[id]});
const selections=[{id,version:"hashed-snapshot"}];
it("binds 5-minute preview to actor, action, record set and versions without PII",()=>{
 const token=signTpoBulkPreview("test-secret","actor1",p,selections,1000000000000);
 expect(verifyTpoBulkPreview("test-secret","actor1",p,selections,token,1000000000010)).toBe(true);
 expect(verifyTpoBulkPreview("test-secret","actor2",p,selections,token,1000000000010)).toBe(false);
 expect(verifyTpoBulkPreview("test-secret","actor1",{...p,action:"CLEAR_OVERRIDE"},selections,token,1000000000010)).toBe(false);
 expect(verifyTpoBulkPreview("test-secret","actor1",p,[{id,version:"changed"}],token,1000000000010)).toBe(false);
 expect(verifyTpoBulkPreview("test-secret","actor1",p,selections,token,1000000000000+TPO_BULK_PREVIEW_TTL_MS)).toBe(false);
 expect(token).not.toContain(id);
 expect(token).not.toContain("ELIGIBLE");
});
