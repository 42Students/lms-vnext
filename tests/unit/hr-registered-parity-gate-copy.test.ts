import {readFileSync} from "node:fs";
import {expect,it} from "vitest";
it("does not call registered 0078/0079 persistence unregistered",()=>{
 const spec=readFileSync("docs/parity/hr.md","utf8");
 expect(spec).toContain("migration **0078**");
 expect(spec).toContain("migration **0079**");
 expect(spec).not.toContain("NOT_REGISTERED");
 expect(spec).not.toContain("**Missing registered table**");
});
