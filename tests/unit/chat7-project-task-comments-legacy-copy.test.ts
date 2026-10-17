import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("Mentor and Learner 0090 task comments exact legacy copy",()=>{
 const source=readFileSync("src/components/projects/project-task-comments.tsx","utf8");
 it("uses TaskDetailsModal dev comment labels, empty and button strings",()=>{
   for(const label of ["Comments","Notes and progress updates people on this task have written.",
     "No comments yet.","Message","Share a progress update or note...","Post comment"]){
      expect(source).toContain(label);
   }
 });
 it("keeps writes gated by canPost and a versioned mutation",()=>{
   expect(source).toContain("canPost?<Button");
   expect(source).toContain("expectedTaskUpdatedAt:currentToken");
   expect(source).toContain('credentials:"same-origin"');
   expect(source).toContain('disabled={busy||!body.trim()}');
 });
});
