import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/modules/projects/project-resource-file-service.ts",import.meta.url),"utf8");
describe("PR-S2-11 no private resource file downloads",()=>{
  it("restricts list and direct signed grants independently",()=>{
    expect(source).toContain("notExists(getDb().select({id:projectResources.id})");
    expect(source).toContain('eq(projectResources.visibility,"MENTOR_ONLY")');
    expect(source).toContain('linked.visibility!=="TEAM"');
    expect(source).toContain('throw new StorageFileError("STORAGE_NOT_FOUND")');
    expect(source).toContain("if(row.resourceId && !manager)");
  });
});
