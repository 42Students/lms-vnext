import {expect,it} from "vitest";
import {projectCompanyShareAudit} from "@/modules/placements/company-share/audit-history-model";
it("shows only action/time and non-identifying link prefix",()=>{
 const result=projectCompanyShareAudit([{shareId:"a".repeat(36),eventKind:"VIEW",
  occurredAt:new Date("2026-10-15T00:00:00Z")}]);
 expect(result).toEqual([{sharePrefix:"aaaaaaaa",kind:"Page view",at:"2026-10-15T00:00:00.000Z"}]);
 expect(JSON.stringify(result)).not.toContain("tokenHash");
});
