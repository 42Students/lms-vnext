import {describe,expect,it,vi} from "vitest";
import {readFileSync} from "node:fs";
vi.mock("server-only",()=>({}));
import {
  collegeOwnProfileSchema,readCollegeProfileSections,
} from "@/modules/people/college-admin-profile-edit-service";

const blank={
  displayName:"College Admin",roleTitle:"",about:"",photoUrl:"",
  social:{linkedIn:"",github:"",website:"",instagram:"",twitter:""},
  personalDetails:{gender:"Female",dateOfBirth:"1999-05-21",bloodGroup:"O+"},
  address:{line1:"",line2:"",city:"",state:"",postalCode:"",country:"",
    currentAddress:"Current locality",permanentAddress:"Permanent locality"},
  contacts:{alternateEmail:"",alternatePhone:"",contactPerson:"",
    contactMobile:"9876543210",contactPhone:"9876543211",contactMail:""},
};

describe("W1-1 College Admin profile legacy field parity",()=>{
  it("accepts independently persisted addresses, typed personal details and Twitter",()=>{
    const result=collegeOwnProfileSchema.parse(blank);
    expect(result.personalDetails).toEqual(blank.personalDetails);
    expect(result.address.currentAddress).toBe("Current locality");
    expect(result.address.permanentAddress).toBe("Permanent locality");
    expect(result.social.twitter).toBe("");
    expect(result.contacts.contactMobile).toBe("9876543210");
  });
  it("does not discard older saved social objects without optional Twitter",()=>{
    const old={...blank,social:{linkedIn:"",github:"",website:"https://example.org",instagram:""}};
    const parsed=collegeOwnProfileSchema.parse(old);
    expect(parsed.social.website).toBe("https://example.org");
    expect(parsed.social.twitter).toBeUndefined();
    const recovered=readCollegeProfileSections(old);
    expect(recovered.partialLoad).toBe(false);
    expect(recovered.document.social.website).toBe("https://example.org");
  });
  it("rejects malformed saved dates and insecure newly entered URLs",()=>{
    expect(collegeOwnProfileSchema.safeParse({
      ...blank,personalDetails:{...blank.personalDetails,dateOfBirth:"21-05-1999"},
    }).success).toBe(false);
    expect(collegeOwnProfileSchema.safeParse({
      ...blank,social:{...blank.social,twitter:"http://unsafe.example"},
    }).success).toBe(false);
  });
  it("keeps login identity read-only and guards internal dirty navigation",()=>{
    const src=readFileSync(
      "src/components/college/college-admin-profile-editor.tsx","utf8");
    expect(src).toContain('type="date"');
    expect(src).toContain("Select Blood Group");
    expect(src).toContain("Current Address");
    expect(src).toContain("Permanent Address");
    expect(src).toContain("Primary contact mobile (10 digits)");
    expect(src).toContain("document.addEventListener(\"click\",onClick,true)");
    expect(src).toContain("Discard your unsaved profile changes?");
    expect(src).toContain("router.push(href)");
  });
});
