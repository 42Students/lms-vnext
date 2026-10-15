import {describe,expect,it} from "vitest";
import {readFileSync,existsSync} from "node:fs";
import {join} from "node:path";
const root=join(process.cwd(),"src/app/(authenticated)/college");
describe("orphan College Admin account entry points",()=>{
  it("exposes Announcements under Dashboard without a new sidebar label",()=>{
    const page=readFileSync(join(root,"page.tsx"),"utf8");
    expect(page).toContain('href="/college/announcements"');
    expect(page).toContain("Announcements");
    expect(existsSync(join(root,"announcements/page.tsx"))).toBe(true);
  });
  it("exposes Tenant domains from the College Admin profile",()=>{
    const page=readFileSync(join(root,"profile/page.tsx"),"utf8");
    expect(page).toContain('href="/college/domains"');
    expect(page).toContain("Tenant domains");
    expect(existsSync(join(root,"domains/page.tsx"))).toBe(true);
  });
});
