import {describe,expect,it} from "vitest";
import {
  canAcceptPlacementApplications,
  isPlacementApplicationDeadlinePassed,
  placementJobExpiryAuditKey,
  wasPublishedDriveExpiredForLegacySweep,
} from "@/modules/placements/application-deadline-policy";

describe("Placement job application-deadline expiry audit",()=>{
  const deadline=new Date("2099-05-03T18:30:00.000Z");
  const before=new Date(deadline.getTime()-1);
  const after=new Date(deadline.getTime()+1);

  it("denies apply at the exact deadline without manually closing the drive",()=>{
    expect(isPlacementApplicationDeadlinePassed(deadline,before)).toBe(false);
    expect(isPlacementApplicationDeadlinePassed(deadline,deadline)).toBe(true);
    expect(canAcceptPlacementApplications("PUBLISHED",deadline,before)).toBe(true);
    expect(canAcceptPlacementApplications("PUBLISHED",deadline,deadline)).toBe(false);
    expect(wasPublishedDriveExpiredForLegacySweep("PUBLISHED",deadline,deadline)).toBe(false);
    expect(wasPublishedDriveExpiredForLegacySweep("PUBLISHED",deadline,after)).toBe(true);
    expect(wasPublishedDriveExpiredForLegacySweep("CLOSED",deadline,after)).toBe(false);
  });

  it("deduplicates each job-and-deadline pair but re-audits after an extension",()=>{
    const job="123e4567-e89b-42d3-a456-426614174000";
    const same=placementJobExpiryAuditKey(job,new Date(deadline.getTime()));
    expect(same).toBe(placementJobExpiryAuditKey(job,deadline));
    expect(same).not.toBe(placementJobExpiryAuditKey(job,new Date(deadline.getTime()+1000)));
    expect(same).not.toBe(placementJobExpiryAuditKey("123e4567-e89b-42d3-a456-426614174001",deadline));
    expect(()=>placementJobExpiryAuditKey(job,new Date(Number.NaN))).toThrow();
  });
});
