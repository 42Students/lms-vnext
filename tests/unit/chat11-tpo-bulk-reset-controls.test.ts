import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {expect,it,vi} from "vitest";
vi.mock("next/navigation",()=>({useRouter:()=>({refresh:()=>undefined})}));
import {TpoBulkActionPanel} from "@/components/tpo/tpo-bulk-action-panel";
it("offers an explicit bulk selection reset even before preview",()=>{
 const html=renderToStaticMarkup(createElement(TpoBulkActionPanel,{
  target:"STUDENTS",rows:[{id:"11111111-1111-4111-8111-111111111111",label:"Member 1"}],
 }));
 expect(html).toContain("Clear selection");
 expect(html).toContain("Selected 0 of 1 matching records");
});
