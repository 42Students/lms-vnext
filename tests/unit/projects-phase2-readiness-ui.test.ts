import {describe,it,expect} from "vitest";
import {projectReadinessLegacyCopy as copy} from "@/modules/projects/readiness-override-copy";
import {readFileSync} from "node:fs";
const legacy=readFileSync(new URL("../../docs/audit/legacy-copy-A.md",import.meta.url),"utf8");
const list=readFileSync(new URL("../../src/components/projects/project-admin-readiness-page.tsx",import.meta.url),"utf8");
const form=readFileSync(new URL("../../src/components/projects/project-readiness-override-form.tsx",import.meta.url),"utf8");
describe("PR-S2-05 legacy College Admin override interface",()=>{
  it("uses the exact legacy text for all override controls",()=>{
    for(const value of Object.values(copy))expect(legacy).toContain(value);
  });
  it("replaces the disabled placeholder and wires manager action",()=>{
    expect(list).not.toContain("manual readiness override is not yet");
    expect(list).toContain("Manage");
    expect(form).toMatch(/method:\\s*"POST"/);
    expect(form).toContain("router.refresh()");
  });
});
