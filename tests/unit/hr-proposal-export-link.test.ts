import {expect,it} from "vitest";
import {hrSentProposalExportHref} from "@/modules/placements/hr-drive-proposal-history-links";
it("links export to the exact selected college, order and role-title filter",()=>{
 const u=new URL(hrSentProposalExportHref({
  collegeId:"11111111-1111-4111-8111-111111111111",
  sort:"OLDEST",q:"Data + QA",page:2,
 }),"https://test.example");
 expect(u.pathname).toBe("/api/placements/recruiter/drives/proposals/export");
 expect(u.searchParams.get("q")).toBe("Data + QA");
 expect(u.searchParams.get("page")).toBe("2");
 expect(u.searchParams.get("sort")).toBe("OLDEST");
});
