import {describe,it,expect} from "vitest";
import {availableSubdomainLabel,subdomainMoveInputSchema} from "@/modules/tenant-domains/college-subdomain-model";
describe("college subdomain",()=>{
 it("rejects reserved or malformed labels",()=>{for(const name of ["admin","a","-college","bad.name","college-"])expect(availableSubdomainLabel(name)).toBe(false);expect(availableSubdomainLabel("my-campus")).toBe(true);});
 it("requires selected target and version",()=>{expect(subdomainMoveInputSchema.safeParse({collegeId:"invalid",label:"campus"}).success).toBe(false);});
});
