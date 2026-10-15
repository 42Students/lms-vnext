import {it,expect} from "vitest";
import {collegeJoinCopy} from "@/modules/placements/public-join/college-preview-copy";
it("never indicates that a GET grants recruiter access",()=>{
 expect(collegeJoinCopy(true,"Example College").canGrantAccess).toBe(false);
 expect(collegeJoinCopy(false,"Other College").title).toBe("Invitation unavailable");
});
