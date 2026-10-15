import {expect,it} from "vitest";
import {hrSentProposalHistoryHref} from "@/modules/placements/hr-drive-proposal-history-links";
it("keeps college and UTF-8 title filters through older/newer proposal pages",()=>{
 const id="11111111-1111-4111-8111-111111111111";
 const href=hrSentProposalHistoryHref({collegeId:id,q:"Data + Analyst",page:2});
 const params=new URL(href,"https://example.test").searchParams;
 expect(params.get("collegeId")).toBe(id);
 expect(params.get("q")).toBe("Data + Analyst");
 expect(params.get("page")).toBe("2");
 expect(()=>hrSentProposalHistoryHref({collegeId:"../../admin"})).toThrow();
});
