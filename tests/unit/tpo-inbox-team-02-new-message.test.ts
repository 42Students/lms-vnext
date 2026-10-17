import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("TPO-inbox-team-02 New message sends first message",()=>{
 it("requires body and commits thread then sends explicitly",()=>{
  const source=readFileSync("src/components/tpo/tpo-new-recruiter-conversation.tsx","utf8");
  expect(source).toContain("message.trim()");
  expect(source).toContain('"/messages"');
  expect(source).toContain("if(!sent.ok)");
  expect(source).toContain("Retry or open the conversation.");
 });
 it("matches legacy form text and guards unsent drafts",()=>{
  const source=readFileSync("src/components/tpo/tpo-new-recruiter-conversation.tsx","utf8");
  expect(source).toContain("New message to a recruiter");
  expect(source).toContain("This starts their General thread.");
  expect(source).toContain("Discard draft");
 });
});
