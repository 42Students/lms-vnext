import {it,expect} from "vitest";
import {buildTpoEligibilityImportScaffold,tpoEligibilityImportScaffoldHref} from "@/modules/placements/tpo-eligibility-import-scaffold-model";
it("creates a distinct-membership blank-decision import scaffold",()=>{
 const rows=[{membershipId:"a"},{membershipId:"b"},{membershipId:"a"}];
 expect(buildTpoEligibilityImportScaffold(rows)).toBe("studentCode,decision,reason\r\na,,\r\nb,,\r\n");
 expect(buildTpoEligibilityImportScaffold([])).toBe("studentCode,decision,reason\r\n");
});
it("keeps navigation on the current roster page",()=>{
 expect(tpoEligibilityImportScaffoldHref("batch-123",3)).toContain("batch-123/students/import-scaffold?page=3");
});
