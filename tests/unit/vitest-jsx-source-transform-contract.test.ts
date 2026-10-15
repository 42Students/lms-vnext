import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
describe("Vitest TSX source transform configuration",()=>{
 it("converts source JSX before import analysis despite Next.js preserve mode",()=>{
  const config=readFileSync("vitest.config.ts","utf8");
  expect(config).toContain('enforce: "pre"');
  expect(config).toContain("ts.transpileModule");
  expect(config).toContain("ts.JsxEmit.ReactJSX");
  expect(config).toContain('endsWith(".tsx")');
 });
});
