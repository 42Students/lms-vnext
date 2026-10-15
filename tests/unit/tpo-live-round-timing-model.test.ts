import {it,expect} from "vitest";
import {tpoLiveRoundTiming} from "@/modules/placements/tpo-live-round-timing-model";
it("uses the service's fixed snapshot clock and real schedule duration",()=>{
 const round={scheduledAt:"2026-10-15T10:00:00Z",durationMinutes:60};
 expect(tpoLiveRoundTiming(round,"2026-10-15T10:25:00Z")).toEqual({elapsedMinutes:25,remainingMinutes:35});
 expect(tpoLiveRoundTiming({...round,durationMinutes:null},"2026-10-15T10:25:00Z").remainingMinutes).toBeNull();
 expect(tpoLiveRoundTiming(round,"2026-10-15T09:59:00Z").elapsedMinutes).toBeNull();
});
