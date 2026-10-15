import {it,expect} from "vitest";
import {facultyProfileRepeatableIssue} from "@/modules/people/faculty-profile-repeatable-actions";
const id="317458a6-9f8b-4f48-862b-91a270e12bb1";
it("finds reversed dates and invalid required values before a network request",()=>{
 expect(facultyProfileRepeatableIssue("education",[{id,institutionName:"University",startYear:"2025",endYear:"2020"}])).toMatch(/precede/);
 expect(facultyProfileRepeatableIssue("education",[{id,institutionName:"University",startYear:"2020",endYear:"2025"}])).toBeNull();
 expect(facultyProfileRepeatableIssue("certifications",[{id,name:"A",certificationDate:"2026-10-15",validityDate:"2026-10-14"}])).toMatch(/Validity/);
 expect(facultyProfileRepeatableIssue("languages",[{id,language:""}])).not.toBeNull();
 expect(facultyProfileRepeatableIssue("about",[])).not.toBeNull();
});
