import { describe, expect, it } from "vitest";
import { summarizePlacementReportDetails } from "@/modules/placements/report-model";

const learner={membershipId:"learner-1",displayName:"Learner",departmentId:null,departmentName:"Branch"};
const offer={id:"offer-1",membershipId:"learner-1",jobId:"job-1",jobTitle:"Job",
  companyId:"company",companyName:"Company",employmentType:"FULL_TIME",countsAsPlaced:true,kind:"OFFER",
  status:"ISSUED",releasedAt:new Date("2026-10-15T10:00:00Z"),annualCtcInr:1_200_000,expiresAt:null,joiningStatus:null};
const base={registeredLearners:[learner],offers:[offer],asOf:"2026-10-16T00:00:00.000Z"};

describe("P-S2-08 unplaced pool obeys the selected college rule", () => {
  it("marks released full-time offers placed at OFFER_RELEASED only", () => {
    expect(summarizePlacementReportDetails({...base,countsAsPlacedAt:"OFFER_RELEASED"}).unplaced).toHaveLength(0);
    expect(summarizePlacementReportDetails({...base,countsAsPlacedAt:"OFFER_ACCEPTED"}).unplaced).toHaveLength(1);
  });
  it("does not count internships or letters of intent as placements", () => {
    expect(summarizePlacementReportDetails({...base,
      offers:[{...offer,employmentType:"INTERNSHIP",countsAsPlaced:false}],
      countsAsPlacedAt:"OFFER_RELEASED",
    }).unplaced).toHaveLength(1);
    expect(summarizePlacementReportDetails({...base,
      offers:[{...offer,kind:"LOI"}],countsAsPlacedAt:"OFFER_RELEASED",
    }).unplaced).toHaveLength(1);
  });
});
