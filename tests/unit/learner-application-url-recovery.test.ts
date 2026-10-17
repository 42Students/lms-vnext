import {expect,it} from "vitest";
import {readLearnerApplicationUrl,updateLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
it("recovers valid application filters without admitting duplicated or forged selectors",()=>{
 const id="8e5e5063-6aac-4fcb-98af-2a4f18f3fb7d";
 const r=readLearnerApplicationUrl("view=completed&page=NaN&applicationId="+id+"&collegeId=foreign");
 expect(r.view).toBe("completed");
 expect(r.page).toBe(1);
 expect(r.applicationId).toBe(id);
 const d=readLearnerApplicationUrl("view=all&view=completed&stage=SHORTLISTED");
 expect(d.view).toBe("progress");
 expect(d.stage).toBe("SHORTLISTED");
 const changed=updateLearnerApplicationUrl("view=all&view=completed&stage=SHORTLISTED",{sort:"company"});
 expect(changed).toBe("stage=SHORTLISTED&sort=company");
});
