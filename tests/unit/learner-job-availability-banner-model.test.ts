import {describe,expect,it} from "vitest";
import {learnerJobAvailabilityBanner} from "@/modules/placements/learner-job-availability-banner-model";
import type {LearnerPlacementJobItem} from "@/components/placements/learner-placement-jobs";
function make(override:Partial<LearnerPlacementJobItem>={}):LearnerPlacementJobItem{
  return {
    job:{id:"job",title:"Campus",description:"",employmentType:"FULL_TIME",workMode:"ONSITE",
      locations:[],openings:1,minimumAnnualCtcInr:null,maximumAnnualCtcInr:null,
      applicationMode:"INTERNAL",externalApplicationUrl:null,applicationDeadline:null},
    roleOption:{id:"role",title:"Engineer",employmentType:"FULL_TIME",workMode:"ONSITE",
      locations:[],openings:1,minimumAnnualCtcInr:null,maximumAnnualCtcInr:null,isPrimary:true},
    company:{id:"company",name:"Employer",websiteUrl:null},
    application:null,
    eligibility:{status:"INELIGIBLE",checks:[],override:null},
    deadlinePassed:false,canApply:false,...override,
  };
}
describe("own published drive application status explanation",()=>{
  it("distinguishes open, submitted, expired and missing evidence",()=>{
    expect(learnerJobAvailabilityBanner([make({canApply:true})])?.kind).toBe("OPEN");
    expect(learnerJobAvailabilityBanner([make({application:{
      id:"app",channel:"INTERNAL",status:"SUBMITTED",eligibilityStatus:"ELIGIBLE",
      submittedAt:"2026-10-14T00:00:00Z",withdrawnAt:null,
    }})])?.kind).toBe("APPLIED");
    expect(learnerJobAvailabilityBanner([make({deadlinePassed:true})])?.kind).toBe("CLOSED");
    expect(learnerJobAvailabilityBanner([make({eligibility:{
      status:"NEEDS_DATA",checks:[{criterion:"CGPA",status:"MISSING",actual:null,
        required:7,detail:"No evidence"}],override:null,
    }})])?.kind).toBe("EVIDENCE");
  });
  it("does not fabricate an employer decision or a state for an unknown job",()=>{
    expect(learnerJobAvailabilityBanner([])).toBeNull();
    expect(learnerJobAvailabilityBanner([make()])?.kind).toBe("NOT_OPEN");
  });
});