import {describe,expect,it} from "vitest";
import {
 readAdminQuery,scopedSearchLike,superAdminReadHref,superAdminReadPages,
 superAdminReadQuerySchema,
} from "@/modules/admin-ui/super-admin-read-directory-model";

describe("SA-DIRECTORY-QUERY-12 all Super Admin placement directory pagination and filters",()=>{
  it("rejects hexadecimal, exponents, whitespace, arrays and out-of-range pages",()=>{
    for(const page of ["0x10","1e2"," 2 ","", "-1","0","1.2","1001",
      "NaN","Infinity",["1"],["1","2"],null]){
      expect(superAdminReadQuerySchema.safeParse({page}).success,String(page)).toBe(false);
    }
    for(const pageSize of ["0x19","1e2"," 25 ","","0","9","24","26","101",
      0,1000,["25"],["25","100"],null]){
      expect(superAdminReadQuerySchema.safeParse({pageSize}).success,String(pageSize)).toBe(false);
    }
    expect(superAdminReadQuerySchema.parse({page:"1000",pageSize:"100"}))
      .toMatchObject({page:1000,pageSize:100});
    expect(superAdminReadQuerySchema.parse({page:1,pageSize:25}))
      .toMatchObject({page:1,pageSize:25});
    expect(superAdminReadQuerySchema.parse({pageSize:10})).toMatchObject({pageSize:10});
    expect(superAdminReadQuerySchema.parse({pageSize:50})).toMatchObject({pageSize:50});
  });

  it("rejects duplicate route paging and invalid sensitive scope filters",()=>{
    for(const input of [
      {page:["1","1000"]},{pageSize:["25","100"]},
      {jobId:"foreign-college"},{departmentId:"../../"} ,{cohortId:"not-a-uuid"},
      {status:"PRIVATE"}, {q:"q".repeat(101)}, {source:"OTHER_COLLEGE"},
      {pipelineStage:"NOT_KNOWN"}, {channel:"INVALID"},
    ]) expect(readAdminQuery(input).success,JSON.stringify(input)).toBe(false);
    expect(readAdminQuery({q:"  engineering ",page:"2",pageSize:"50"}))
      .toMatchObject({success:true});
  });

  it("retains scoped filters and literal wildcard escaping on URL round trips",()=>{
    const parsed=superAdminReadQuerySchema.parse({
      q:" %_\\",status:"SUBMITTED",page:"3",pageSize:"50",
      channel:"EXTERNAL",pipelineStage:"INTERVIEW",
      jobId:"11111111-1111-4111-8111-111111111111",
    });
    const href=superAdminReadHref("/admin/placements/applications",parsed);
    const url=new URL(href,"https://local.invalid");
    const raw=Object.fromEntries(url.searchParams.entries());
    const roundtrip=readAdminQuery(raw);
    expect(roundtrip.success).toBe(true);
    if(roundtrip.success)expect(roundtrip.data).toEqual(parsed);
    expect(scopedSearchLike("%_\\")).toBe("%\\%\\_\\\\%");
    expect(superAdminReadPages(51,25)).toBe(3);
    expect(superAdminReadPages(51,0)).toBe(3);
    expect(superAdminReadPages(51,NaN)).toBe(3);
    expect(superAdminReadPages(Infinity,25)).toBe(1);
    expect(superAdminReadPages(-10,25)).toBe(1);
    expect(superAdminReadPages(25,50)).toBe(1);
  });
});
