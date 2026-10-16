import {it,expect} from "vitest";
import {tpoReviewOneByOneHref,tpoShareWithCompanyHref} from "@/modules/placements/tpo-bulk-follow-up-model";
it("TPO-drive-workspace-25 action links route to real authorized workflows",()=>{
 expect(tpoReviewOneByOneHref("job","application")).toBe("/tpo/placements/jobs/job/applicants/application");
 expect(tpoShareWithCompanyHref("job")).toBe("/tpo/placements/jobs/job/share-preview");
});
