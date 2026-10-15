import {expect,it} from "vitest";
import {hrDriveMessagesHref} from "@/modules/placements/hr-drive-messages-link-model";
it("creates canonical recruiter conversation links only for validated job ids",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(hrDriveMessagesHref(id)).toBe("/recruiter/drives/"+id+"/messages");
 expect(()=>hrDriveMessagesHref("../foreign")).toThrow();
});
