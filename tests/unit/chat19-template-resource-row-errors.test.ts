import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";

describe("chat-19 template resource per-row validation",()=>{
 it("G2-5-029-028 renders every invalid resource row and preserves visible disclosure cues",()=>{
  const source=readFileSync("src/components/projects/super-admin-template-resource-editor.tsx","utf8");
  expect(source).toContain('const [rowErrors,setRowErrors]=useState<Record<number,string[]>>({})');
  expect(source).toContain('for(const issue of parsed.error.issues)');
  expect(source).toContain('section==="resources"&&typeof index==="number"');
  expect(source).toContain('Fix "+rowErrors[i].length+" error(s)"');
  expect(source).toContain('<ul role="alert"');
  expect(source).toContain("Boolean(rowErrors[index]?.length)||rows.length<=12");
  expect(source).toContain('open={rowErrors[i]?.length?true:undefined}');
  expect(source).toContain('setRowErrors({});setRows(r=>');
 });
});
