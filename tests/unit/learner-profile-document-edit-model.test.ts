import {describe,expect,it} from "vitest";
import {emptyLearnerProfileDocument} from "@/modules/people/profile-validation";
import {learnerProfileDocumentEditInputSchema,learnerProfileDocumentIsStale,learnerProfileChangedFields} from "@/modules/people/learner-profile-document-edit-model";
const initial=emptyLearnerProfileDocument;
describe("whole learner profile edit baseline",()=>{
  it("requires a complete parsed saved snapshot and rejects caller scope fields",()=>{
    expect(learnerProfileDocumentEditInputSchema.safeParse({document:initial,expectedDocument:initial}).success).toBe(true);
    expect(learnerProfileDocumentEditInputSchema.safeParse({document:initial}).success).toBe(false);
    expect(learnerProfileDocumentEditInputSchema.safeParse({document:initial,expectedDocument:initial,collegeId:"other"}).success).toBe(false);
  });
  it("detects concurrent edits including different profile sections without retaining private values",()=>{
    const updated={...initial,headline:"Engineer",contacts:{...initial.contacts,alternatePhone:"+919876543210"}};
    expect(learnerProfileDocumentIsStale(updated,initial)).toBe(true);
    expect(learnerProfileChangedFields(initial,updated)).toEqual(["headline","contacts"]);
    expect(JSON.stringify(learnerProfileChangedFields(initial,updated))).not.toContain("9876543210");
    expect(learnerProfileDocumentIsStale(updated,updated)).toBe(false);
    expect(learnerProfileChangedFields(initial,initial)).toEqual([]);
  });
});
