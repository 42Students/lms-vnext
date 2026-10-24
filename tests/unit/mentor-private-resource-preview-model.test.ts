import {describe,expect,it} from "vitest";
import {mentorPrivatePreviewKind,mentorPrivatePreviewGrantValid} from
 "@/modules/projects/mentor-private-resource-preview-model";
describe("Private Mentor resource preview policy",()=>{
 it("allows only explicitly browser-renderable file content",()=>{
  expect(mentorPrivatePreviewKind("application/pdf")).toBe("PDF");
  expect(mentorPrivatePreviewKind("IMAGE/PNG; charset=UTF-8")).toBe("IMAGE");
  expect(mentorPrivatePreviewKind("image/jpeg")).toBe("IMAGE");
  for(const type of ["text/html","image/svg+xml","application/vnd.ms-excel",
    "application/javascript","application/octet-stream","", "text/csv"]){
   expect(mentorPrivatePreviewKind(type)).toBeNull();
  }
 });
 it("requires a valid signed URL and future non-expired time",()=>{
  const now=Date.parse("2026-10-24T00:00:00.000Z");
  const safe=(url:string)=>url==="https://storage.example/signed";
  expect(mentorPrivatePreviewGrantValid({
   url:"https://storage.example/signed",expiresAt:"2026-10-24T00:01:00Z",
  },now,safe)).toBe(true);
  expect(mentorPrivatePreviewGrantValid({
   url:"https://other.example/bypass",expiresAt:"2026-10-24T00:01:00Z",
  },now,safe)).toBe(false);
  expect(mentorPrivatePreviewGrantValid({
   url:"https://storage.example/signed",expiresAt:"2026-10-24T00:00:04Z",
  },now,safe)).toBe(false);
 });
 it("never trusts an unparseable expiry",()=>{
  expect(mentorPrivatePreviewGrantValid({
   url:"https://storage.example/signed",expiresAt:"tomorrow",
  },Date.now(),()=>true)).toBe(false);
 });
});
