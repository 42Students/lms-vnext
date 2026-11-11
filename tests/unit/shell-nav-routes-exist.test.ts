import {existsSync} from "node:fs";
import {join} from "node:path";
import {describe,expect,it} from "vitest";
import {collegeAdminItems,superAdminItems} from "@/components/shell/shell-model";
import {TPO_PROTOTYPE_NAV} from "@/components/shell/tpo-prototype-navigation";
import {FACULTY_PROTOTYPE_NAV} from "@/components/shell/faculty-prototype-navigation";

/** Every sidebar link must open a real page. The page's own guard decides who may see it; this only catches dead links. */
function pageExists(href:string){
  const path=href.split("?")[0]!.split("#")[0]!.replace(/^\/+|\/+$/g,"");
  const base=join(process.cwd(),"src","app");
  const dirs=[join(base,"(authenticated)",path),join(base,path)];
  return dirs.some(dir=>["page.tsx","page.ts","route.ts"].some(file=>existsSync(join(dir,file))))
    ||dirs.some(dir=>existsSync(dir));
}
describe("shell navigation targets",()=>{
  for(const [name,items] of [["super admin",superAdminItems],["college admin",collegeAdminItems],["tpo prototype",TPO_PROTOTYPE_NAV],["faculty prototype",FACULTY_PROTOTYPE_NAV]] as const){
    it(name+" links open an existing route",()=>{
      const missing=items.filter(item=>item.href!=="/dashboard"&&!pageExists(item.href)).map(item=>item.href);
      expect(missing).toEqual([]);
    });
  }
});
