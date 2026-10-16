import { describe, expect, it } from "vitest";
import { publicJoinFormSchema } from "@/modules/placements/public-join/form-model";

const input = {
  email: "recruiter@business.example", name: "Recruiter Name",
  designation: "", phone: "", companyName: "Business",
};

describe("TPO-campaigns-public-18 and 26 recruiter form validation", () => {
  it("accepts a work email and required name", () => {
    expect(publicJoinFormSchema.safeParse(input).success).toBe(true);
  });
  it("denies personal email, blank name, or a client-supplied college scope", () => {
    expect(publicJoinFormSchema.safeParse({ ...input, email: "person@gmail.com" }).success).toBe(false);
    expect(publicJoinFormSchema.safeParse({ ...input, name: "" }).success).toBe(false);
    expect(publicJoinFormSchema.safeParse({ ...input, collegeId: "user-controlled" }).success).toBe(false);
  });
});
