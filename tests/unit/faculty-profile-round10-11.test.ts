import {it,expect} from "vitest";
import {facultyProfileMetadataMatches} from "@/modules/people/faculty-profile-draft-actions";
it("matches editable key and value case insensitively",()=>{
 const entry={key:"teachingInterests",value:"Systems engineering"};
 expect(facultyProfileMetadataMatches(entry,"TEACH")).toBe(true);
 expect(facultyProfileMetadataMatches(entry,"engineering")).toBe(true);
 expect(facultyProfileMetadataMatches(entry,"private")).toBe(false);
 expect(facultyProfileMetadataMatches(entry,"")).toBe(true);
});
