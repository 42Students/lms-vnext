import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {tpoStudentProfileFacts} from "@/modules/placements/tpo-student-profile-facts";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-29 supplies PG, degree, entrance and profile-owned links while masking contact and preserving academic verification",()=>{
 const facts=tpoStudentProfileFacts({personalDetails:{mobileNumber:"+919876543210",gender:"Female"},
  education:[{educationType:"POSTGRADUATE",degreeName:"M.Tech",percentage:89.25}],
  entranceExam:"GATE",socialProfiles:{githubUrl:"https://github.com/example",linkedinUrl:"http://unsafe.example"}});
 expect(facts.pgPercentage).toBe(89.25);
 expect(facts.degree).toBe("M.Tech");
 expect(facts.entranceExam).toBe("GATE");
 expect(facts.phoneMasked).toBe("••••3210");
 expect(facts.linkedIn).toBeNull();
 expect(src("src/components/tpo/tpo-students-spreadsheet.tsx")).toContain("PG % (profile entry)");
});
it("TPO-students-31 exposes a per-student readiness note and eligibility provenance without inventing prep test averages",()=>{
 const grid=src("src/components/tpo/tpo-students-spreadsheet.tsx");
 for(const term of ["Readiness note","No resume","Academics incomplete","Eligibility set by","Eligibility set at"])expect(grid).toContain(term);
 expect(src("src/components/tpo/tpo-student-quick-panel.tsx")).toContain('"Prep %","Not recorded"');
});