import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {learnerRoadmapShouldOpenItem} from "@/modules/courses/learner-roadmap-item-focus-model";
import {resolveLearnerRoadmapFocusFilter} from "@/modules/courses/learner-roadmap-focus-filter-model";
const read=(p:string)=>readFileSync(join(process.cwd(),p),"utf8");
describe("chat-9 final sprint",()=>{
 it("LEARNER-course-detail-18 preserves verified functionality and safe failure states",()=>{
 expect(learnerRoadmapShouldOpenItem("lesson-one","item-one","lesson-two","item-one")).toBe(false);
 expect(learnerRoadmapShouldOpenItem("lesson-one","item-one","lesson-one","unknown")).toBe(false);
 expect(learnerRoadmapShouldOpenItem("lesson-one","item-one","lesson-one","item-one")).toBe(true);
 const lessons=[{id:"lesson-one",items:[{id:"item-one",kind:"CONTENT" as const}],contents:[{id:"item-one",type:"RESOURCE"}]}];
 expect(resolveLearnerRoadmapFocusFilter("all","lesson-one","unknown",lessons)).toBe("all");
 expect(resolveLearnerRoadmapFocusFilter("all","lesson-one","item-one",lessons)).toBe("resources");
 const ui=read("src/components/courses/learner-course-workspace.tsx");
 expect(ui).toContain("Lesson not found.");
 expect(ui).toContain("Content locked or unavailable. This item is not published in the selected lesson.");
 const schema=read("src/db/schema/courses.ts");
 expect(schema).toContain("lessonContents");
 });
});
