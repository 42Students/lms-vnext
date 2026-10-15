import {expect,it} from "vitest";
import {TPO_MORE_GROUPS} from "@/modules/placements/tpo-utility-model";
it("makes the global request decision inbox reachable through the TPO More menu",()=>{
 const links=(TPO_MORE_GROUPS as readonly {links:readonly {label:string;href:string}[]}[]).flatMap(group=>group.links);
 const requests=links.filter(link=>link.label==="Requests");
 expect(requests).toHaveLength(1);
 expect(requests[0].href).toBe("/tpo/requests");
 expect(links.every(link=>link.href.startsWith("/tpo/"))).toBe(true);
});
