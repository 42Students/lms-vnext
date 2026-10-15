import {expect,it} from "vitest";
import {isShareableJob} from "@/modules/placements/company-share/scope-model";
it("requires exact owning college and externally shareable published job",()=>{
 expect(isShareableJob("a","a","PUBLISHED")).toBe(true);
 expect(isShareableJob("a","a","CLOSED")).toBe(true);
 expect(isShareableJob("a","b","PUBLISHED")).toBe(false);
 expect(isShareableJob("a",null,"CLOSED")).toBe(false);
 expect(isShareableJob("a","a","DRAFT")).toBe(false);
});
