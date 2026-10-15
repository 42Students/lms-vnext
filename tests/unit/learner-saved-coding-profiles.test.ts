import {it,expect} from "vitest";
import {emptyLearnerProfileDocument} from "@/modules/people/profile-validation";
import {learnerSavedCodingProfiles} from "@/modules/placements/learner-saved-coding-profiles-model";
it("shows only allowlisted user-authored HTTPS coding links",()=>{
 const doc={...emptyLearnerProfileDocument,
  socialProfiles:{...emptyLearnerProfileDocument.socialProfiles,githubUrl:"https://github.com/demo"},
  metadata:[
   {id:"1",key:"LeetCode",type:"url" as const,value:"https://leetcode.com/u/demo/"},
   {id:"2",key:"CodeChef",type:"text" as const,value:"https://codechef.com/users/demo"},
   {id:"3",key:"Codeforces",type:"url" as const,value:"https://codeforces.com.evil.test/demo"},
  ]};
 expect(learnerSavedCodingProfiles(doc).map(p=>p.platform)).toEqual(["GITHUB","LEETCODE"]);
});
