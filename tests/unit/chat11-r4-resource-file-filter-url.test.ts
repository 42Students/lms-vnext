import {expect,it} from "vitest";
import {resourceFileFiltersFromUrl,resourceFileFilterQuery} from "@/modules/projects/resource-file-filter-url-model";
it("rejects duplicate, unknown and unbounded query keys",()=>{
 for(const qs of ["state=ALL&state=BLOCKED","fileId=secret","page=0","page=100001","page=1e9","pageSize=5000"]){
  expect(()=>resourceFileFiltersFromUrl(new URLSearchParams(qs))).toThrow();
 }
});
it("roundtrips URL filters without silently dropping active state",()=>{
 const filters=resourceFileFiltersFromUrl(new URLSearchParams("search=design&state=PENDING&order=NAME&page=2&pageSize=25"));
 expect(resourceFileFilterQuery(filters)).toBe("?search=design&state=PENDING&order=NAME&page=2&pageSize=25");
 expect(resourceFileFilterQuery(filters,true)).not.toContain("page=2");
 expect(resourceFileFiltersFromUrl(new URLSearchParams())).toMatchObject({page:1,pageSize:20});
});
