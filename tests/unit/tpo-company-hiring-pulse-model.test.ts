import {describe,it,expect} from "vitest";
import {projectTpoCompanyHiringPulse} from "@/modules/placements/tpo-company-hiring-pulse-model";
describe("company hiring pulse",()=>{
 it("uses unique learners and seasons, excludes withdrawn/unrecorded joins",()=>{
  const input={
   drives:[{status:"PUBLISHED",archivedAt:null},{status:"CLOSED",archivedAt:null},{status:"PUBLISHED",archivedAt:new Date("2026-10-03T00:00:00Z")}],
   seasonIds:["a","a","b",null],
   offers:[{membershipId:"x",status:"ACCEPTED",joiningStatus:"JOINED"},
    {membershipId:"x",status:"ACCEPTED",joiningStatus:"PENDING"},
    {membershipId:"y",status:"ISSUED",joiningStatus:null}],
   timeline:[{at:new Date("2026-10-01T00:00:00Z")},{at:new Date("2026-10-02T00:00:00Z")}],
  };
  expect(projectTpoCompanyHiringPulse(input)).toEqual({
   activeDrives:1,seasonsWithDrives:2,distinctAcceptedLearners:1,
   distinctConfirmedJoinedLearners:1,latestRecordedEventIso:"2026-10-02T00:00:00.000Z",
  });
 });
 it("does not fabricate recency without an event",()=>{
  expect(projectTpoCompanyHiringPulse({drives:[],offers:[],timeline:[],seasonIds:[]}).latestRecordedEventIso).toBeNull();
 });
});
