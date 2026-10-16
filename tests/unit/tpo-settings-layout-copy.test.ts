import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
it("TPO-settings-audit-02 uses exact legacy Settings subtitle",()=>{
 const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/settings/layout.tsx",import.meta.url),"utf8");
 expect(source).toContain("How your placement cell runs: its rules, its people, and what students and companies get.");
 expect(source).not.toContain("New settings remain read-only until");
});
