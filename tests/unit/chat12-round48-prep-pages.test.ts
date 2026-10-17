import {readFileSync} from "node:fs";import {it,expect} from "vitest";
const src=(p:string)=>readFileSync(new URL("../../"+p,import.meta.url),"utf8");
it("TPO-students-10 exposes an assignment picker, same-cohort due-date writer, duplicate skip, learner notice and assigned preparation list",()=>{
 const student=src("src/app/(authenticated)/tpo/students/page.tsx");
 const learner=src("src/app/(authenticated)/learn/my-placements/preparation/page.tsx");
 const writer=src("src/components/tpo/tpo-students-assign-prep.tsx");
 expect(student).toContain("<TpoStudentsAssignPrep/>");
 expect(learner).toContain("<LearnerPrepAssignmentCards/>");
 expect(writer).toContain("Review prep assignments");
 expect(writer).toContain("duplicate");
 expect(src("src/app/api/placements/tpo/students/prep/route.ts")).toContain("isSameOriginRequest(request)");
 expect(src("src/modules/placements/tpo-prep-assignment-service.ts")).toContain("onConflictDoNothing()");
});