import {it,expect} from "vitest";
import {readFileSync} from "node:fs";
it("PUB-auth-public-55 blocks resume ZIP until signed malware-scanned file delivery is registered",()=>{
 const model=readFileSync("src/modules/placements/company-share/column-model.ts","utf8");
 expect(model).toContain("RESUME:null");
 const decision=readFileSync("docs/audit/owner-decisions-resolved.md","utf8");
 expect(decision).toContain("Resumes ZIP waits for storage.");
 const page=readFileSync("src/app/company-share/[token]/page.tsx","utf8");
 expect(page).not.toContain("Download all resumes (ZIP)");
});
