import {describe,expect,it} from "vitest";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";
describe("People legacy tab reaches College student groups",()=>{
  const root=join(process.cwd(),"src/app/(authenticated)/college");
  it("links groups from People Directory, retaining its canonical tab name",()=>{
    const page=readFileSync(join(root,"people/manage/page.tsx"),"utf8");
    expect(page).toContain('href="/college/groups"');
    expect(page).toContain(">Student groups</Link>");
    expect(existsSync(join(root,"groups/page.tsx"))).toBe(true);
    expect(existsSync(join(root,"groups/[groupId]/page.tsx"))).toBe(true);
  });
});
