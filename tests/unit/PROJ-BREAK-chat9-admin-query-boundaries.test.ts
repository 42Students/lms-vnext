import {describe,expect,it} from "vitest";
import {parseAdminProjectsQuery} from "@/modules/projects/admin-projects-query-model";

describe("IIT Dharwad Super Admin workspace query input adversarial cases",()=>{
 it("PROJ-BREAK-admin-input-22 accepts bounded decimal page and size, rejects exotic and overflow formats",()=>{
  const valid=parseAdminProjectsQuery({page:"2",pageSize:"20",view:"table"});
  expect(valid.success).toBe(true);
  if(valid.success)expect(valid.data).toMatchObject({page:2,pageSize:20,view:"table"});
  for(const page of ["0x10","2e3"," 2","2 ","1.5","-1","0","100001","Infinity","NaN"]){
   expect(parseAdminProjectsQuery({page}).success,page).toBe(false);
  }
  for(const pageSize of ["0x20","1e2"," 20","9","101","Infinity","NaN"]){
   expect(parseAdminProjectsQuery({pageSize}).success,pageSize).toBe(false);
  }
 });
 it("PROJ-BREAK-admin-input-23 legacy search alias cannot hide conflicting, repeated or unknown URL parameters",()=>{
  const legacy=parseAdminProjectsQuery({search:"Old LMS",page:"1"});
  expect(legacy.success).toBe(true);
  if(legacy.success)expect(legacy.data.q).toBe("Old LMS");
  const consistent=parseAdminProjectsQuery({search:"Project",q:"Project",status:"ACTIVE"});
  expect(consistent.success).toBe(true);
  for(const invalid of [
   {search:"other",q:"Project"},
   {page:["1","2"]},
   {search:["one","two"]},
   {page:"1",collegeId:"guess-other-tenant"},
   {page:"1",sort:"unexpected"},
  ]){
   expect(parseAdminProjectsQuery(invalid).success,JSON.stringify(invalid)).toBe(false);
  }
 });
});
