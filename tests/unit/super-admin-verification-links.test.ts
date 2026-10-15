import {describe,it,expect} from "vitest";
import {superAdminVerificationHref} from "@/modules/verification/admin-links";
const id="11111111-1111-4111-8111-111111111111";
describe("Super Admin verification tenant links",()=>{
 it("only routes to an active authorized tenant reference",()=>{
 expect(superAdminVerificationHref(id,"ACTIVE","ACTIVE")).toBe(`/admin/colleges/${id}/verification`);
 expect(superAdminVerificationHref(id,"ARCHIVED","ACTIVE")).toBeNull();
 expect(superAdminVerificationHref(id,"ACTIVE","ARCHIVED")).toBeNull();
 expect(superAdminVerificationHref("../../foreign","ACTIVE","ACTIVE")).toBeNull();
 });
});
