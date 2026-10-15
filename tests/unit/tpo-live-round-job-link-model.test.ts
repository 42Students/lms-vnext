import {it,expect} from "vitest";
import {tpoLiveRoundJobHref} from "@/modules/placements/tpo-live-round-job-link-model";
it("navigates to the protected drive detail for the persisted job id",()=>{
 expect(tpoLiveRoundJobHref("job-123")).toBe("/tpo/placements/jobs/job-123");
 expect(tpoLiveRoundJobHref("job/a")).toBe("/tpo/placements/jobs/job%2Fa");
});
