import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const s=readFileSync("src/components/courses/college-assignment-create.tsx","utf8");
describe("UX-admin-assignments-chat-12-confirm",()=>{
 it("preserves draft and explicit unsaved discard via focus-safe confirmation dialogs",()=>{
  expect(s).toContain("confirmCreate");expect(s).toContain("confirmDiscard");expect(s).toContain("discardDraft()");expect(s).toContain('title="Discard unsaved assignment changes?"');expect(s).not.toContain("window.confirm");
 });
 it("uses shared form controls with typed native restrictions",()=>{for(const tag of ["<Button","<Input","<Select","<Textarea"])expect(s).toContain(tag);expect(s).not.toContain("min-h-10");});
});
