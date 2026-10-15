import {it,expect} from "vitest";
import {recruiterInviteHref} from "@/modules/placements/recruiter-invite-alias-model";
it("moves old invitation links only to the canonical confirmation route",()=>{
 expect(recruiterInviteHref("sample-token_123")).toBe("/recruiter-invite/sample-token_123");
 expect(()=>recruiterInviteHref("../admin")).toThrow();
});
