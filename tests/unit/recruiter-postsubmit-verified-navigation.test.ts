import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/components/hr/hr-drive-draft-form.tsx",import.meta.url),"utf8");
describe("Recruiter drive request verified-submission navigation",()=>{
 it("guard checks the verified submission ref at event time for both links and browser unload",()=>{
  const effect=source.slice(source.indexOf("// REC-home-drives-32:"),
   source.indexOf("// REC-home-drives-29:",source.indexOf("// REC-home-drives-32:")));
  expect(effect).toContain("const beforeUnload=(event:BeforeUnloadEvent)=>{\n      if(submittedRef.current)return;");
  expect(effect).toContain("const linkGuard=(event:MouseEvent)=>{");
  expect(effect).toContain('if(submittedRef.current)return;');
  expect(effect).toContain('document.addEventListener("click",linkGuard,true)');
  expect(source).toContain("submittedRef.current=true;");
  expect(source).toContain('Open the request</a>');
  expect(source).toContain('href={"/hr/drives?collegeId="+encodeURIComponent(collegeId)+"&view=WAITING"}');
 });
});
