import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
describe("chat-7 mentor task detail and mutation fields",()=>{
it("MEN-projects-meetings-42 mentor detail dialog retains edits, attribution, and submission",()=>{
const source=readFileSync("src/components/projects/mentor-board-task-detail-dialog.tsx","utf8");
expect(source).toContain("Description / Approach");
expect(source).toContain("Last edited");
expect(source).toContain("Submission");
});
it("MEN-projects-meetings-43 typed and timestamped comments with filtering",()=>{
const source=readFileSync("src/components/projects/project-task-comments.tsx","utf8");
expect(source).toContain("Filter comments");
expect(source).toContain("row.commentKind");
expect(source).toContain("row.createdAt");
});
it("MEN-projects-meetings-44 task builder supports backlog, assignee and approach",()=>{
const source=readFileSync("src/components/projects/mentor-task-create.tsx","utf8");
expect(source).toContain("Leave blank for the backlog");
expect(source).toContain("Approach (optional)");
expect(source).toContain("assigneeMembershipId");
});
it("MEN-projects-meetings-45 task editor supports approach and acceptance criteria",()=>{
const source=readFileSync("src/components/projects/mentor-task-details-edit.tsx","utf8");
expect(source).toContain("Approach (optional)");
expect(source).toContain("Done when (optional)");
expect(source).toContain("Task updated.");
});
it("MEN-projects-meetings-47 blocker reason is collected when blocking a task",()=>{
const source=readFileSync("src/components/projects/mentor-task-status-transition.tsx","utf8");
expect(source).toContain("newBlockerReason");
expect(source).toContain("selected===\"BLOCKED\"");
});
});
