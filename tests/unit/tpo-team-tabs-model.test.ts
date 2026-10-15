import {it,expect} from "vitest";
import {parseTpoTeamTab} from "@/modules/placements/tpo-team-tabs-model";
it("keeps internal-only tabs",()=>{expect(parseTpoTeamTab("people")).toBe("people");expect(parseTpoTeamTab("external")).toBe("conversations")});
