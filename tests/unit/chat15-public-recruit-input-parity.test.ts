import {describe,expect,it} from "vitest";
import {publicRecruitEnquirySchema,publicRecruitLeadActivityNote} from "@/modules/placements/public-enquiry/recruit-input-model";

describe("G2-4-026-029 public recruiter enquiry legacy input",()=>{
  const base={email:"recruiter@acme-corp.example",code:"123456",name:"<b>Asha</b> Sharma"};

  it("accepts legacy optional company, phone, and message",()=>{
    const result=publicRecruitEnquirySchema.parse(base);
    expect(result.name).toBe("Asha Sharma");
    expect(result.company).toBe("");
    expect(result.mobile).toBeUndefined();
    expect(result.hiringFor).toBe("");
  });

  it("sanitizes and truncates recruiter, company and hiring note to legacy bounds",()=>{
    const result=publicRecruitEnquirySchema.parse({...base,
      name:"N".repeat(180),company:"<i>"+"C".repeat(210)+"</i>",
      mobile:"",hiringFor:"<script>note</script>"+"H".repeat(1200),
    });
    expect(result.name).toHaveLength(150);
    expect(result.company).toHaveLength(200);
    expect(result.hiringFor.length).toBeLessThanOrEqual(1000);
    expect(result.mobile).toBeNull();
    expect(publicRecruitLeadActivityNote(result.hiringFor,result.company,result.name))
      .toContain("Asked to recruit through your placements page");
  });

  it("keeps a name mandatory even when sanitized input is empty",()=>{
    expect(publicRecruitEnquirySchema.safeParse({...base,name:"  <b></b> "}).success).toBe(false);
  });
});
