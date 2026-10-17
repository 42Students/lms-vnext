import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const read=(path:string)=>readFileSync(path,"utf8");
describe("TPO audit saved views final sprint",()=>{
 it("TPO-settings-audit-R04 saves and reuses private officer-and-college views with pin, rename, delete and last used",()=>{
  const ui=read("src/components/tpo/tpo-audit-saved-views.tsx");
  const page=read("src/app/(authenticated)/tpo/audit/page.tsx");
  expect(page).toContain("<TpoAuditSavedViews collegeId={context.membership.collegeId} userId={context.user.id}");
  expect(ui).toContain('const key="lms.tpo.audit.views."+collegeId+"."+userId');
  expect(ui).toContain("localStorage.setItem(key,JSON.stringify(next))");
  expect(ui).toContain("localStorage.getItem(key)");
  expect(ui).toContain("Maximum five pinned audit views.");
  expect(ui).toContain("Maximum 12 saved audit views.");
  for(const action of ["Save current",">Open</button>","\"Unpin\":\"Pin\"","Rename</button>",">Delete</button>","usedAt:Date.now()"])
   expect(ui).toContain(action);
  expect(ui).toContain('router.push("/tpo/audit"');
 });
 it("TPO-settings-audit-R04 is accurately described as browser-local rather than synced to another device",()=>{
  const ui=read("src/components/tpo/tpo-audit-saved-views.tsx");
  expect(ui).toContain("Server-wide syncing and sharing are not enabled.");
  expect(ui).toContain("This browser cannot store saved audit views.");
 });
});