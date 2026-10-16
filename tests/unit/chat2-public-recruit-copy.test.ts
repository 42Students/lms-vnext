import { describe,expect,it } from "vitest";
import { PUBLIC_RECRUIT_COPY,publicRecruitThanks } from "@/modules/placements/public-enquiry/public-copy";
describe("TPO-campaigns-public-31 exact legacy recruit-from-us text",()=>{
 it("preserves all form labels and actions",()=>{
  expect(PUBLIC_RECRUIT_COPY.workEmail).toBe("Work email");
  expect(PUBLIC_RECRUIT_COPY.name).toBe("Your name");
  expect(PUBLIC_RECRUIT_COPY.company).toBe("Company");
  expect(PUBLIC_RECRUIT_COPY.mobile).toBe("Mobile (optional)");
  expect(PUBLIC_RECRUIT_COPY.hiringFor).toBe("What are you hiring for? (optional)");
  expect(PUBLIC_RECRUIT_COPY.send).toBe("Send me a code");
  expect(PUBLIC_RECRUIT_COPY.submit).toBe("Send to the placement cell");
 });
 it("provides correct received message",()=>{
  expect(publicRecruitThanks("Example College")).toBe("The placement cell at Example College has your details and will get in touch.");
 });
 it("does not silently hide unset CRM gate",()=>{
  expect(PUBLIC_RECRUIT_COPY.unavailable).toContain("temporarily unavailable");
 });
});
