import {describe,expect,it,vi} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {readFileSync} from "node:fs";

vi.mock("next/navigation",()=>({useRouter:()=>({refresh:vi.fn()}),usePathname:()=>"/college/projects"}));
vi.mock("@/components/ui/toast",()=>({useToast:()=>({showToast:vi.fn()})}));
vi.mock("@/components/ui/popover",()=>({PopoverPanel:()=>null}));
vi.mock("@/components/projects/project-soft-delete-control",()=>({ProjectSoftDeleteControl:()=>null}));
vi.mock("@/components/projects/project-api",()=>({projectMutation:vi.fn()}));
import {ProjectArchiveControl} from "@/components/projects/project-archive-control";

const props={projectId:"11111111-1111-4111-8111-111111111111",
 projectTitle:"IIT Dharwad Project",expectedUpdatedAt:"2099-10-18T04:30:00.000Z"};

describe("PROJ-BREAK-COLLEGE-04-ARCHIVE-08 double submit and modal safety",()=>{
 it("shows Archive only for mutable workspaces and Restore for archived ones",()=>{
  const active=renderToStaticMarkup(<ProjectArchiveControl {...props} status="ACTIVE"/>);
  const archived=renderToStaticMarkup(<ProjectArchiveControl {...props} status="ARCHIVED"/>);
  expect(active).toContain("Archive");
  expect(active).not.toContain(">Restore</button>");
  expect(archived).toContain("Restore");
  expect(archived).not.toContain(">Archive</button>");
 });
 it("uses synchronous re-entrancy guards for both archive and restore and only releases them in finally",()=>{
  const source=readFileSync("src/components/projects/project-archive-control.tsx","utf8");
  expect(source).toContain("if(flight.current||deleted)return;");
  expect(source).toContain("flight.current=true;setPending(true);");
  expect(source).toContain("finally{flight.current=false;setPending(false);}");
  expect(source).toContain("if(flight.current)return;");
  expect(source).toContain("onDismiss={dismiss}");
  expect(source).toContain("onClick={dismiss}");
  expect(source).toContain('{expectedUpdatedAt}');
  expect(source).toContain("showToast({tone:\"error\"");
 });
});
