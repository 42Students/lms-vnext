import {readFileSync} from "node:fs";
import {join} from "node:path";
import {expect,it} from "vitest";
it("provides retry without displaying raw backend errors or bearer tokens",()=>{
 const ui=readFileSync(join(process.cwd(),"src/app/company-share/[token]/error.tsx"),"utf8");
 expect(ui).toContain("onClick={reset}");
 expect(ui).toContain('role="alert"');
 expect(ui).not.toContain("error.message");
 expect(ui).not.toContain("error.stack");
 expect(ui).not.toContain("{token}");
});
