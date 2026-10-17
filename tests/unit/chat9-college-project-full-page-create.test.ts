import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {join} from "node:path";

const source=(file:string)=>readFileSync(join(process.cwd(),file),"utf8");
describe("College Admin legacy workspace creation navigation",()=>{
 it("COL-projects-21 opens a full-page Create workspace flow with the same persisted project API",()=>{
  const page=source("src/app/(authenticated)/college/projects/page.tsx");
  const create=source("src/app/(authenticated)/college/projects/create/page.tsx");
  const control=source("src/components/projects/project-create-control.tsx");
  expect(page).toContain('href="/college/projects/create"');
  expect(page).toContain("Create workspace");
  expect(page).toContain("Bulk reassign mentor");
  expect(create).toContain("<CreateProjectControl standalone");
  expect(create).toContain("listAssignedProjectTemplates");
  expect(control).toContain("standalone = false");
  expect(control).toContain("if (submitLock.current) return;");
  expect(control).toContain("submitLock.current = false;");
  expect(control).toContain("const [open, setOpen] = useState(standalone)");
  expect(control).toContain('"/api/projects"');
  expect(control).toContain('"POST",');
 });
});
