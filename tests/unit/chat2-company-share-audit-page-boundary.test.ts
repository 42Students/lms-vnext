import {describe,it,expect} from "vitest";
import {clampCompanyShareAuditPage} from "../../src/modules/placements/company-share/audit-page-model";
describe("company-share registered audit event pagination",()=>{
 it("preserves complete second pages",()=>expect(clampCompanyShareAuditPage(2,26)).toEqual({page:2,totalPages:2}));
 it("clamps a stale page rather than rendering an apparently empty history",()=>expect(clampCompanyShareAuditPage(1000,3)).toEqual({page:1,totalPages:1}));
 it("handles zero events",()=>expect(clampCompanyShareAuditPage(3,0)).toEqual({page:1,totalPages:1}));
});
