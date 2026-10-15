import {expect,it} from "vitest";
import {tpoRegistrationHistoryChangeLabel,tpoRegistrationHistorySourceLabel} from "@/modules/placements/tpo-registration-history-model";
it("labels only stored transitions and explicitly distinguishes recorded source",()=>{
 expect(tpoRegistrationHistoryChangeLabel(null,"PLACEMENTS")).toBe("NOT_RECORDED → PLACEMENTS");
 expect(tpoRegistrationHistoryChangeLabel("PLACEMENTS","HIGHER_STUDIES")).toBe("PLACEMENTS → HIGHER_STUDIES");
 expect(tpoRegistrationHistorySourceLabel("SELF")).toBe("Learner self-service");
 expect(tpoRegistrationHistorySourceLabel("BACKFILL")).toBe("Historical backfill");
 expect(tpoRegistrationHistorySourceLabel("INVALID")).toBe("Recorded source unavailable");
});
