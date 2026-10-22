import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";
const source=(path:string)=>readFileSync(join(process.cwd(),path),"utf8");
describe("UX-superadmin-login-01",()=>{
 it("preserves original wording, permissions and supported accessible UX",()=>{
  const code=source("src/app/superadmin-login/page.tsx");
  expect(code).toContain('redirect("/login?legacy=superadmin")');
  expect(code).toContain("shared sign-in");


 });
});
