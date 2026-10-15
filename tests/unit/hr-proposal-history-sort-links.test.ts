import {expect,it} from "vitest";
import {hrSentProposalHistoryHref} from "@/modules/placements/hr-drive-proposal-history-links";
it("preserves sort, role-title search, college and page",()=>{
 const url=new URL(hrSentProposalHistoryHref({
  collegeId:"11111111-1111-4111-8111-111111111111",
  page:3,q:"Analyst",sort:"OLDEST",
 }),"https://example.test");
 expect(url.searchParams.get("sort")).toBe("OLDEST");
 expect(url.searchParams.get("q")).toBe("Analyst");
 expect(url.searchParams.get("page")).toBe("3");
});
