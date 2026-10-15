import {expect,it} from "vitest";
import {companyShareAuditTotals} from "@/modules/placements/company-share/audit-model";
it("separates view and CSV audit records per capability",()=>{
 const map=companyShareAuditTotals([{shareId:"a",eventKind:"VIEW",count:2},
  {shareId:"b",eventKind:"VIEW",count:4},{shareId:"a",eventKind:"CSV",count:1}]);
 expect(map.get("a")).toEqual({views:2,exports:1});
 expect(map.get("b")).toEqual({views:4,exports:0});
});
