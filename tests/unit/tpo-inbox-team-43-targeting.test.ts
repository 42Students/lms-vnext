import {describe,it,expect} from "vitest";
import {tpoNoticeAudienceSelectionSchema,freezeTpoNoticeRecipients,
 canPublishTpoNoticeWithCurrentStorage} from "@/modules/announcements/tpo-notice-audience-snapshot-model";
describe("TPO-inbox-team-43 targeted announcements",()=>{
 it("does not publish a targeted preview to the whole college",()=>{
  expect(canPublishTpoNoticeWithCurrentStorage("PLACEMENTS")).toBe(false);
  expect(canPublishTpoNoticeWithCurrentStorage("DRIVE")).toBe(false);
  expect(canPublishTpoNoticeWithCurrentStorage("COLLEGE")).toBe(true);
 });
 it("requires an explicit saved drive selector",()=>{
  expect(tpoNoticeAudienceSelectionSchema.safeParse({kind:"DRIVE",jobId:"bad",applicants:"ALL_APPLICANTS"}).success).toBe(false);
  expect(tpoNoticeAudienceSelectionSchema.safeParse({kind:"BATCHES",cohortIds:[]}).success).toBe(false);
 });
 it("deterministically de-duplicates recipient UUIDs",()=>{
  const a="11c36214-c1a8-45b4-a6ab-9af7bd4ff249",b="39bfc6a0-1a5e-4d74-b64d-72cc28a92950";
  expect(freezeTpoNoticeRecipients([b,a,a])).toEqual([a,b]);
 });
});
