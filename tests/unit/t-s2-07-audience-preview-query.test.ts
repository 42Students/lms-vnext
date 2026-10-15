import {describe,expect,it} from "vitest";
import {announcementPreviewScope,tpoAudiencePreviewQuery} from "@/modules/announcements/tpo-audience-preview-query";
const id="165836cb-d3e0-4b11-b6f6-e41726db561c";
describe("T-S2-07 audience previews",()=>{
 it("makes the legacy COLLEGE preview explicit without extra query",()=>{
   expect(announcementPreviewScope({audience:"COLLEGE"})).toBeNull();
   expect(announcementPreviewScope({audience:"PLACEMENTS"})).toEqual({kind:"PLACEMENTS"});
 });
 it("maps batch, branch and drive to exact constrained audiences",()=>{
   expect(announcementPreviewScope({audience:"BATCHES",targetId:id})).toEqual({kind:"BATCHES",cohortIds:[id]});
   expect(announcementPreviewScope({audience:"BRANCHES",targetId:id})).toEqual({kind:"BRANCHES",departmentIds:[id]});
   expect(announcementPreviewScope({audience:"DRIVE",targetId:id})).toEqual({kind:"DRIVE",jobId:id});
 });
 it("rejects missing, mismatched and cross-field audience values",()=>{
   expect(tpoAudiencePreviewQuery.safeParse({audience:"DRIVE"}).success).toBe(false);
   expect(tpoAudiencePreviewQuery.safeParse({audience:"COLLEGE",targetId:id}).success).toBe(false);
   expect(tpoAudiencePreviewQuery.safeParse({audience:"BATCHES",targetId:"not-uuid"}).success).toBe(false);
   expect(tpoAudiencePreviewQuery.safeParse({audience:"OTHER"}).success).toBe(false);
 });
});
