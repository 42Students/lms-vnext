import {readFileSync} from "node:fs";
import {it,expect} from "vitest";
it("TPO-settings-audit-02 uses exact legacy Settings subtitle",()=>{
 const source=readFileSync(new URL("../../src/app/(authenticated)/tpo/settings/layout.tsx",import.meta.url),"utf8");
 expect(source).toContain("Each TPO Settings screen owns its shared PageHeader.");
 expect(source).not.toContain("New settings remain read-only until");
 const team=readFileSync(new URL("../../src/app/(authenticated)/tpo/settings/team/page.tsx",import.meta.url),"utf8");
 expect(team).toContain('title="Placement team"');
 expect(team).toContain("Manage faculty coordinators and Drive Day student duties");
});
