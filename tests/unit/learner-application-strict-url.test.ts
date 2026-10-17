import {it,expect} from "vitest";
import {readLearnerApplicationUrl,updateLearnerApplicationUrl} from "@/modules/placements/learner-application-url-model";
it("rejects ambiguous repeated and non-decimal application selectors",()=>{
 const id="8e5e5063-6aac-4fcb-98af-2a4f18f3fb7d";
 expect(readLearnerApplicationUrl("page=1e3").page).toBe(1);
 expect(readLearnerApplicationUrl("page=0x20").page).toBe(1);
 expect(readLearnerApplicationUrl("page=01").page).toBe(1);
 expect(readLearnerApplicationUrl("page=10").page).toBe(10);
 expect(readLearnerApplicationUrl("applicationId="+id+"&applicationId="+id).applicationId).toBeUndefined();
 expect(readLearnerApplicationUrl("view=progress&view=completed").view).toBe("progress");
 expect(updateLearnerApplicationUrl("page=99&view=progress",{sort:"company"})).toBe("view=progress&sort=company");
});
