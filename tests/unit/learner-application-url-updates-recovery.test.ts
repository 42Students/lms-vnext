import {expect,it} from "vitest";
import {readLearnerApplicationUrl,updateLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
it("keeps valid facets and removes stale malicious fields when editing one filter",()=>{
 const url=updateLearnerApplicationUrl("view=progress&stage=SHORTLISTED&page=NaN&sort=bad&collegeId=other",{sort:"company"});
 expect(url).toBe("view=progress&stage=SHORTLISTED&sort=company");
 expect(readLearnerApplicationUrl(url).view).toBe("progress");
 expect(updateLearnerApplicationUrl("q=interview&q=wrong&view=completed",{sort:"oldest"})).toBe("view=completed&sort=oldest");
});
