import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Faculty submitted attachment viewer exact legacy copy",()=>{
 const ui=readFileSync("src/components/courses/faculty-submission-file-review.tsx","utf8");
 it("provides exact Uploaded File and Open file copy",()=>{
  expect(ui).toContain("Uploaded File:");
  expect(ui).toContain('"Open file"');
  expect(ui).toContain("Unable to load this submitted file");
 });
 it("issues a private signed inline grant without persisting URL or exposing unverifiable files",()=>{
  expect(ui).toContain('/download-grant');
  expect(ui).toContain('disposition: "inline"');
  expect(ui).toContain("fileStatusDescriptor(file.status).usable");
  expect(ui).toContain("grant.file.submissionId !== submissionId");
  expect(ui).not.toContain("localStorage");
  expect(ui).not.toContain("link.download");
 });
});
