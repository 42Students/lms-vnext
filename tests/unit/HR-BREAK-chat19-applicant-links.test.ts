import {describe,expect,it} from "vitest";
import {safeRecruiterExternalLink} from "@/modules/placements/recruiter-applicant-shared-links-model";
describe("HR-BREAK-APPLICANT-LINK-51 learner-supplied links must not endorse private hosts",()=>{
 it.each([
  "http://github.com/42students","javascript:alert(1)","data:text/html,hi",
  "https://127.0.0.1/private","https://10.0.0.6/",
  "https://192.168.1.9/","https://172.20.1.4/",
  "https://169.254.169.254/latest/meta-data/",
  "https://[::]/","https://[::1]/",
  "https://[fc00::1]/","https://[fd00::1]/","https://[fe80::1]/",
  "https://[::ffff:127.0.0.1]/",
  "https://localhost/", "https://dev.local/",
  "https://person:password@github.com/unsafe",
 ])("rejects private/unsafe learner destination %s",url=>{
  expect(safeRecruiterExternalLink(url)).toBeNull();
 });
 it("accepts ordinary public HTTPS but strips tracking fragments",()=>{
  expect(safeRecruiterExternalLink(" https://example.org/projects/demo#private "))
   .toBe("https://example.org/projects/demo");
 });
 it("restricts declared GitHub links to github.com and www.github.com",()=>{
  expect(safeRecruiterExternalLink("https://github.com/42Students/lms-vnext",true))
   .toBe("https://github.com/42Students/lms-vnext");
  expect(safeRecruiterExternalLink("https://www.github.com/42Students",true))
   .toBe("https://www.github.com/42Students");
  expect(safeRecruiterExternalLink("https://github.com.evil.invalid/path",true)).toBeNull();
  expect(safeRecruiterExternalLink("https://github.example.com/",true)).toBeNull();
 });
 it("rejects nonstrings, overlong URLs and embedded credentials",()=>{
  expect(safeRecruiterExternalLink(null)).toBeNull();
  expect(safeRecruiterExternalLink(123)).toBeNull();
  expect(safeRecruiterExternalLink("https://example.org/"+"a".repeat(2100))).toBeNull();
  expect(safeRecruiterExternalLink("https://bob@example.org/private")).toBeNull();
 });
});
