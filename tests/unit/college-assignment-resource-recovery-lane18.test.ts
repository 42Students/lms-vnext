import {readFileSync} from "node:fs";
import {describe,expect,it} from "vitest";

describe("college assignment resource error recovery",()=>{
 it("does not swallow failed API operations behind a fabricated empty error",()=>{
  const source=readFileSync("src/components/courses/faculty-assignment-material-links.tsx","utf8");
  expect(source).not.toContain("error instanceof Error?friendlyApiError({})");
  expect(source).toContain("error instanceof FriendlyFetchError");
  expect(source).toContain("friendlyApiError({status:error.status,code:error.code})");
  expect(source).toContain("Retry loading resources");
  expect(source).toContain('role="alert"');
  expect(source).toContain("cannot be published from a public Drive link");
 });
});
