import {describe,it,expect} from "vitest";
import {legacyRecruiterGrantExclusiveExpiry,legacyRecruiterGrantEndMapping} from "@/modules/placements/legacy-grant-date-crosswalk";
import {legacySeasonDateCrosswalk} from "@/modules/placements/legacy-season-date-crosswalk";
import {LEGACY_PROJECT_DETAIL_DTO_CROSSWALK,legacyProjectDetailsDisplay} from "@/modules/projects/legacy-project-course-label-crosswalk";

describe("legacy calendar and project DTO crosswalks",()=>{
 it("uses exclusive IST next-day end for inclusive grant validity",()=>{
   expect(legacyRecruiterGrantExclusiveExpiry("2026-10-22")?.toISOString()).toBe("2026-10-22T18:30:00.000Z");
   expect(legacyRecruiterGrantExclusiveExpiry("2026-02-30")).toBeNull();
   expect(legacyRecruiterGrantEndMapping(null).requiresPolicyReview).toBe(true);
 });
 it("never manufactures an end date for an indefinite historical placement season",()=>{
   expect(legacySeasonDateCrosswalk("2026-08-01",null)).toEqual({
     status:"OPEN_ENDED_LEGACY",startDate:"2026-08-01",endDate:null,requiresManualEndDate:true});
   expect(legacySeasonDateCrosswalk("2026-08-01","2026-07-31").status).toBe("INVALID_SOURCE");
 });
 it("retains missing project metadata as explicit nulls",()=>{
   expect(LEGACY_PROJECT_DETAIL_DTO_CROSSWALK).toHaveLength(6);
   expect(legacyProjectDetailsDisplay({})).toMatchObject({courseLabel:null,
    phase:null,createdBy:null,publishedAt:null,isPublished:false,status:"UNKNOWN"});
 });
});
