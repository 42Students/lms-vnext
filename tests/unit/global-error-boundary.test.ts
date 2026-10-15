import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";

const source=readFileSync("src/app/global-error.tsx","utf8");
const view=readFileSync("src/components/public/error-page-view.tsx","utf8");

// The vitest unit project has no JSX transform, so the boundary is verified as a source contract.
describe("Root Custom 500 global-error boundary",()=>{
 it("renders its own html/body with the public 500 view and a retry hook",()=>{
  expect(source).toContain("<html");
  expect(source).toContain("<body");
  expect(source).toContain('code="500"');
  expect(source).toContain('title="Server Error"');
  expect(source).toContain("Something went wrong on our side");
  expect(source).toContain("retry={reset}");
  expect(view).toMatch(/<h1[^>]*>/);
 });
 it("does not expose the error object, message, stack or digest",()=>{
  expect(source).not.toMatch(/error\.(message|stack|digest)/);
  expect(source).not.toContain("{error}");
  expect(source).not.toContain("digest}");
 });
});
