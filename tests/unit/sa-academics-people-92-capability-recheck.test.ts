import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {
  indianMobileToE164,legacyPersonName,
} from "@/modules/people/college-onboard-mobile-model";

const read=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("SA-academics-people-92 Super Admin identity onboarding parity",()=>{
  it("accepts India-local ten-digit login mobiles and refuses malformed numbers",()=>{
    expect(indianMobileToE164("98765 43210")).toBe("+919876543210");
    expect(indianMobileToE164("+91-98765 43210")).toBe("+919876543210");
    expect(indianMobileToE164("987654321")).toBeNull();
    expect(indianMobileToE164("12abc67890")).toBeNull();
    expect(indianMobileToE164("+1 2025550123")).toBeNull();
  });
  it("preserves separate first/last legal identity, optional details and nonempty display name",()=>{
    expect(legacyPersonName(" Ada "," Lovelace ")).toBe("Ada Lovelace");
    const form=read("src/components/college/college-student-register-form.tsx");
    for(const label of ["First Name","Last Name","Mobile Number","Gender","Date of Birth","Address"]){
      expect(form).toContain(label);
    }
    expect(form).toContain("indianMobileToE164(phoneE164)");
    expect(form).toContain("gender,dateOfBirth,address");
    expect(form).toContain("legacyPersonName(firstName,lastName)");
  });
  it("makes onboarding available in selected-college super admin scope, not global unauthorized scope",()=>{
    const page=read("src/app/(authenticated)/admin/students/page.tsx");
    expect(page).toContain("context.adminScope?.collegeId?");
    expect(page).toContain("<CollegeStudentRegisterForm choices={choices}/>");
    const svc=read("src/modules/people/college-directory-person-editor-service.ts");
    expect(svc).toContain("resolveActingCollege");
    expect(svc).toContain("personalDetails");
    expect(svc).toContain("profileDocument");
  });
});
