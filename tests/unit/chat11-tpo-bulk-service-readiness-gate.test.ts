import {expect,it} from "vitest";
import {requireTpoBulkRegistered,TpoBulkApplicationsUnavailable} from "@/modules/placements/tpo-bulk-workflow-model";
it("enforces DB09 from the service layer, not only API route flags",()=>{
 expect(()=>requireTpoBulkRegistered("STUDENTS",false)).not.toThrow();
 expect(()=>requireTpoBulkRegistered("APPLICATIONS",true)).not.toThrow();
 expect(()=>requireTpoBulkRegistered("APPLICATIONS",false)).toThrow(TpoBulkApplicationsUnavailable);
});
