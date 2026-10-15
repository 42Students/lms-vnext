import {it,expect} from "vitest";
import {companyJoinEmailCandidate as c} from "@/modules/placements/public-join/company-preview-policy";
it("rejects spoofing and non-work email",()=>{
 expect(c("Recruiter@Example.com","example.com")).toBe(true);
 expect(c("recruiter@example.com.evil.test","example.com")).toBe(false);
 expect(c("student@gmail.com","gmail.com")).toBe(false);
});
