import {expect,it} from "vitest";
import {parseTpoTeamTab} from "@/modules/placements/tpo-team-tabs-model";
it("never treats employer messaging as an internal team tab",()=>{
 expect(parseTpoTeamTab("employer")).toBe("conversations");
 expect(parseTpoTeamTab("people")).toBe("people");
});
