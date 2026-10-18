import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {superAdminJoiningIntegrityNote} from "@/modules/admin-ui/super-admin-joining-integrity-model";

describe("SA-JOINING-ANOMALY-09 Super Admin persisted offer and joining integrity",()=>{
  it("warns on every recorded JOINED outcome without an accepted offer",()=>{
    for(const offer of ["ISSUED","DECLINED","WITHDRAWN","EXPIRED","UNKNOWN",""]){
      expect(superAdminJoiningIntegrityNote("JOINED",offer),offer)
        .toBe("Review required: joining is recorded without an accepted offer.");
    }
    expect(superAdminJoiningIntegrityNote("JOINED","ACCEPTED")).toBeNull();
  });
  it("does not imply a completed joining for pending or cancelled outcomes",()=>{
    for(const status of ["PENDING","DID_NOT_JOIN","DEFERRED","UNKNOWN"]){
      for(const offer of ["ISSUED","ACCEPTED","WITHDRAWN"]){
        expect(superAdminJoiningIntegrityNote(status,offer)).toBeNull();
      }
    }
  });
  it("retains tenant restriction, status filtering and audit copy in joining list",()=>{
    const source=readFileSync("src/modules/admin-ui/super-admin-placement-joining-service.ts","utf8");
    expect(source).toContain('requireSuperAdminSelectedCollege(context,"placements.read")');
    expect(source).toContain("eq(placementJobs.collegeId,scope.collegeId)");
    expect(source).toContain("eq(collegeMemberships.collegeId,scope.collegeId)");
    expect(source).toContain("offerStatus:placementOffers.status");
    expect(source).toContain("superAdminJoiningIntegrityNote(r.status,r.offerStatus)");
    expect(source).toContain("Offer status: "+'"+r.offerStatus');
    expect(source).toContain("Only persisted joining outcomes are shown");
  });
});
