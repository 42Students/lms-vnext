import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
const code=(path:string)=>readFileSync(path,"utf8");

describe("chat-16 linked private file resources",()=>{
 it("MEN-projects-meetings-58 associates a private file only with active resources visible to its uploader",()=>{
  const workspace=code("src/components/projects/project-workspace.tsx");
  const section=code("src/components/projects/project-resource-files-section.tsx");
  const panel=code("src/components/projects/project-resource-files-panel.tsx");
  const service=code("src/modules/projects/project-resource-file-service.ts");
  expect(workspace).toContain('resources={workspace.resources.filter(item=>');
  expect(workspace).toContain('item.status==="ACTIVE"||mode!=="LEARNER"&&item.status==="DRAFT"');
  expect(section).toContain('row.status==="ACTIVE"&&row.visibility==="TEAM"');
  expect(section).toContain('(row.status==="ACTIVE"||row.status==="DRAFT")');
  expect(panel).toContain('Related resource (optional)');
  expect(panel).toContain('resourceId:linkedResourceId');
  expect(panel).toContain('Resource: {resources.find(item=>item.id===file.resourceId)?.title}');
  expect(service).toContain('eq(projectResources.projectId, scope.project.id)');
  expect(service).toContain("canAttachProjectFileToResource(");
  const policy=code("src/modules/projects/mentor-file-resource-visibility-model.ts");
  expect(policy).toContain('resource.status==="ACTIVE"&&resource.visibility==="TEAM"');
  expect(policy).toContain('resource.status==="ACTIVE"||resource.status==="DRAFT"');
 });
 it("MEN-projects-meetings-58 does not reveal storage grants in a resource row or open files without a scoped download",()=>{
  const panel=code("src/components/projects/project-resource-files-panel.tsx");
  expect(panel).toContain('fileEndpoint(file.id)+"/download-grant"');
  expect(panel).toContain('isSafeSignedUrl(result.grant.url)');
  expect(panel).toContain('projectFileUsable(file)');
  expect(panel).not.toContain('href={result.grant.url}');
 });
});
