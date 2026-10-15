import {it,expect} from "vitest";
import {emptyLearnerProfileDocument} from "@/modules/people/profile-validation";
import {learnerSavedCodingProfiles} from "@/modules/placements/learner-saved-coding-profiles-model";
it("finds valid saved platform URL after malformed duplicate without disclosing spoofed host",()=>{
 const doc={...emptyLearnerProfileDocument,
  metadata:[
   {id:"a",key:"leetcode",type:"url" as const,value:"https://leetcode.com.evil.test/u/person"},
   {id:"b",key:"LeetCode",type:"url" as const,value:"https://leetcode.com/u/person/"}
  ]};
 const rows=learnerSavedCodingProfiles(doc);
 expect(rows.find(row=>row.platform==="LEETCODE")?.href).toBe("https://leetcode.com/u/person");
 expect(rows.some(row=>row.href.includes("evil.test"))).toBe(false);
});
