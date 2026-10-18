import {describe,it,expect} from "vitest";
import {readFileSync} from "node:fs";
const source=readFileSync(new URL("../../src/modules/projects/project-resource-file-service.ts",import.meta.url),"utf8");

describe("PR-S2-11 no private resource file downloads",()=>{
  it("restricts list and direct signed grants independently with positive TEAM/ACTIVE scope",()=>{
    const list=source.slice(source.indexOf("export async function listProjectFiles("),
      source.indexOf("export async function updateProjectFileDetails("));
    const grant=source.slice(source.indexOf("export async function issueProjectFileDownloadGrant("));
    // Positive allow-list closes the absent/orphan/draft-resource metadata leak as
    // well as the old MENTOR_ONLY case; no negated visibility allow-list.
    expect(list).toContain("exists(getDb().select({id:projectResources.id})");
    expect(list).toContain("isNull(projectResourceFiles.resourceId)");
    expect(list).toContain('eq(projectResources.status,"ACTIVE")');
    expect(list).toContain('eq(projectResources.visibility,"TEAM")');
    expect(list).toContain("eq(projectResources.projectId,scope.project.id)");
    // Project UUID alone is not authority to expose another tenant's file row.
    expect(list).toContain("eq(projectResourceFiles.collegeId, scope.collegeId)");
    expect(list).toContain('eq(projectResourceFiles.status, "READY")');
    expect(list).not.toContain("notExists(");
    // Direct guessed file UUIDs must still check persisted resource visibility.
    expect(grant).toContain("if (row.collegeId !== scope.collegeId)");
    expect(grant).toContain('throw new StorageFileError("STORAGE_NOT_FOUND")');
    expect(grant).toContain("if(row.resourceId && !manager)");
    expect(grant).toContain('linked.status!=="ACTIVE"');
    expect(grant).toContain('linked.visibility!=="TEAM"');
    expect(grant).toContain('eq(projectResources.projectId,scope.project.id)');
    expect(grant).toContain('throw new StorageFileError("STORAGE_NOT_FOUND")');
    expect(grant).toContain('row.scanStatus !== "CLEAN"');
    expect(grant).toContain("FILE_READ_TTL_SECONDS");
  });
});
