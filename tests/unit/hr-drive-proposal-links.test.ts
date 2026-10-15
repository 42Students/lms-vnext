import {expect,it} from "vitest";
import {hrSentProposalsHref} from "@/modules/placements/hr-drive-proposal-links-model";
it("preserves only a validated employer college in the proposal history URL",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 expect(hrSentProposalsHref(id)).toBe("/hr/drives/proposals?collegeId="+id);
 expect(()=>hrSentProposalsHref("../foreign")).toThrow();
});
