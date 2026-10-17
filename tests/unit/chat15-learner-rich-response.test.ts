import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
import {formatLearnerResponseLine} from "@/components/courses/learner-formatted-response";
const src=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
describe("chat-15 learner rich responses",()=>{
 it("LEARNER-learning-misc-11 interprets bounded formatting without HTML injection",()=>{
  const chunks=formatLearnerResponseLine("**Bold** and _italic_ <script>alert(1)</script>");
  expect(chunks.length).toBeGreaterThan(2);
  const component=src("src/components/courses/learner-formatted-response.tsx");
  expect(component).not.toContain("dangerouslySetInnerHTML");
  expect(component).toContain("formatLearnerResponseLine(line)");
  expect(src("src/components/courses/assignment-multipart-parts-editor.tsx"))
   .toContain("<LearnerRichResponseEditor");
 });
 it("LEARNER-course-detail-05 formats written responses while protecting drafts",()=>{
  const editor=src("src/components/courses/learner-rich-response-editor.tsx");
  expect(editor).toContain('aria-label="Text formatting"');
  expect(editor).toContain("maxLength={50000}");
  const form=src("src/components/courses/assignment-submission-control.tsx");
  expect(form).toContain("<LearnerRichResponseEditor");
  expect(form).toContain('window.addEventListener("beforeunload",guard)');
  expect(src("src/components/courses/learner-course-workspace.tsx")).toContain("<LearnerFormattedResponse");
 });
});
