import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {learnerDriveAvailability,type BrowseJobShape} from "@/modules/placements/learner-jobs-browse-model";
describe("legacy learner drive browse sections",()=>{
 it("LEARNER-placements-15 groups unavailable cards without hiding recorded applications",()=>{
  const s=readFileSync(new URL("../../src/components/placements/learner-jobs-browse.tsx",import.meta.url),"utf8");
  expect(s).toContain("learnerDriveAvailability(item)===\"not-open\"");
  expect(s).toContain("learnerDriveAvailability(item)===\"closed\"");
  expect(s).toContain("const expiredRoleCards=savedOnly?[]:expiredAll");
  expect(s).toContain("const notOpenRoleCards=savedOnly?[]:notOpenAll");
  expect(s).toContain('ariaLabel="Not open to you"');
  expect(s).toContain('defaultOpen={filters.availability==="not-open"}');
  expect(s).toContain("See reasons");
  expect(s).toContain("ordinaryRoleCards.length>0");
  expect(s).toContain("notOpenRoleCards.length>0");
  const example:BrowseJobShape={
   job:{id:"drive-1",title:"Campus drive",description:"",status:"PUBLISHED",applicationDeadline:null},
   company:{name:"Employer"},
   roleOption:{id:"role-1",title:"Analyst",employmentType:"FULL_TIME",locations:[],minimumAnnualCtcInr:null,maximumAnnualCtcInr:null},
   canApply:false,deadlinePassed:false,
  };
  expect(learnerDriveAvailability(example)).toBe("not-open");
  expect(learnerDriveAvailability({...example,canApply:true})).toBe("open");
  expect(learnerDriveAvailability({...example,deadlinePassed:true})).toBe("closed");
  expect(learnerDriveAvailability({...example,job:{...example.job,status:"CLOSED"}})).toBe("closed");
 });
});
