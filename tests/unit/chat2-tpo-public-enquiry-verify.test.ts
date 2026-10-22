import { describe,expect,it } from "vitest";
import { publicRecruitEnquirySchema,publicRecruitLeadActivityNote } from "@/modules/placements/public-enquiry/recruit-service";
import {joinFieldForCode,publicJoinResponseMessage} from "@/modules/placements/public-join/error-copy";
const good={email:"recruiter@business.example",code:"010101",
 name:"Recruiter Name",company:"Business",mobile:"",hiringFor:""};
describe("TPO-campaigns-public-31 recruiter confirmation validation",()=>{
 it("requires a six-digit code and immutable email scope",()=>{
  expect(publicRecruitEnquirySchema.safeParse(good).success).toBe(true);
  expect(publicRecruitEnquirySchema.safeParse({...good,code:"1010"}).success).toBe(false);
  expect(publicRecruitEnquirySchema.safeParse({...good,email:"gmail@gmail.com"}).success).toBe(false);
 });
 it("rejects arbitrary college, source, grant and owner overrides",()=>{
  expect(publicRecruitEnquirySchema.safeParse({...good,collegeId:"forged"}).success).toBe(false);
  expect(publicRecruitEnquirySchema.safeParse({...good,source:"MANUAL"}).success).toBe(false);
  expect(publicRecruitEnquirySchema.safeParse({...good,ownerMembershipId:"forged"}).success).toBe(false);
 });
});

describe("verify2 public recruiter legacy field and note parity",()=>{
 it("routes legacy server field errors without converting them to summary-only failures",()=>{
   for(const code of ["EMAIL_REQUIRED","COMPANY_EMAIL_REQUIRED","OTHER_COMPANY_EMAIL","EMAIL_PERSONAL"])
     expect(joinFieldForCode(code)).toBe("email");
   for(const code of ["WRONG_CODE","CODE_EXPIRED","CODE_LOCKED"])expect(joinFieldForCode(code)).toBe("code");
   for(const code of ["FIRST_NAME_REQUIRED","NAME_REQUIRED"])expect(joinFieldForCode(code)).toBe("name");
   for(const code of ["COMPANY_NAME_REQUIRED","COMPANY_EXISTS"])expect(joinFieldForCode(code)).toBe("companyName");
   expect(joinFieldForCode("INVALID_MOBILE")).toBe("phone");
   expect(joinFieldForCode("UNKNOWN")).toBeNull();
 });
 it("preserves safe field messages while suppressing raw server failure text",()=>{
   expect(publicJoinResponseMessage({message:"Use the work email linked to this company."},422,"Fallback"))
     .toBe("Use the work email linked to this company.");
   expect(publicJoinResponseMessage({message:"INTERNAL_SQL_ERROR"},500,"Please retry")).toBe("Please retry");
   expect(publicJoinResponseMessage({message:123},400,"Please retry")).toBe("Please retry");
   expect(publicJoinResponseMessage({message:"x".repeat(301)},422,"Please retry")).toBe("Please retry");
 });
 it("records the quoted cleaned hiring note using the legacy activity label",()=>{
   const normalized=publicRecruitEnquirySchema.parse({...good,
     hiringFor:"<script>noise</script> Hiring software interns"});
   const activity=publicRecruitLeadActivityNote(normalized.hiringFor,normalized.company,normalized.name);
   expect(activity).toContain('Asked to recruit through your placements page: "');
   expect(activity).toContain("Hiring software interns");
   expect(activity).not.toContain("<script>");
   expect(activity.endsWith('"')).toBe(true);
 });
});
