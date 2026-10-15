import { describe, expect, it } from "vitest";
import { emptyFacultyProfileDocument } from "@/modules/people/faculty-profile-document";
import { updateFacultyProfileSection } from "@/modules/people/faculty-self-section-model";

describe("Faculty repeatable profile entry identity", () => {
  it("rejects duplicated identifiers without modifying the original", () => {
    const id="00000000-0000-4000-8000-000000000012";
    const lang={id,language:"Telugu",proficiency:"Advanced"};
    expect(() => updateFacultyProfileSection(emptyFacultyProfileDocument,{
      section:"languages",value:[lang,lang],expectedVersion:0,
    })).toThrow();
    expect(emptyFacultyProfileDocument.languages).toEqual([]);
  });
  it("never accepts arbitrary document-field names", () => {
    expect(() => updateFacultyProfileSection(emptyFacultyProfileDocument,{
      section:"identitySummary",value:[],expectedVersion:0,
    })).toThrow();
  });
});
