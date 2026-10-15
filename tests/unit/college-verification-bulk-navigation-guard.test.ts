import {describe,it,expect} from "vitest";
import {canNavigateCollegeVerificationQueue} from "@/modules/verification/bulk-action-guard";
describe("College verification bulk processing navigation fence",()=>{
 it("blocks filter or tab navigation while decisions have not returned",()=>{expect(canNavigateCollegeVerificationQueue(true)).toBe(false);});
 it("re-enables navigation after the response is settled",()=>{expect(canNavigateCollegeVerificationQueue(false)).toBe(true);});
});
