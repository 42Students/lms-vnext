import {describe,it,expect,vi} from "vitest";
import {listInboundMailForAdmin,type InboundMailAdminRepository} from "@/modules/inbound-mail/admin-service";
import type {RequestContext} from "@/modules/identity/context";
const admin:RequestContext={user:{id:"admin",identityUid:"identity",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe("Super Admin inbound mail authorization",()=>{
 const repository=():InboundMailAdminRepository=>({tableExists:vi.fn().mockResolvedValue(true),list:vi.fn().mockResolvedValue([])});
 it("permits global admin when table is registered",async()=>{
  await expect(listInboundMailForAdmin(admin,{},repository())).resolves.toMatchObject({available:true,page:1,items:[]});
 });
 it("rejects wrong role and selected tenant before touching storage",async()=>{
  const repo=repository();
  await expect(listInboundMailForAdmin({...admin,user:{...admin.user,systemRoles:[]}}, {},repo)).rejects.toThrow();
  await expect(listInboundMailForAdmin({...admin,adminScope:{organizationId:"org",collegeId:"college"}}, {},repo)).rejects.toThrow();
  expect(repo.tableExists).not.toHaveBeenCalled();
 });
 it("does not read an unregistered table",async()=>{
  const repo:InboundMailAdminRepository={tableExists:vi.fn().mockResolvedValue(false),list:vi.fn().mockResolvedValue([])};
  await expect(listInboundMailForAdmin(admin,{},repo)).resolves.toMatchObject({available:false,items:[]});
  expect(repo.list).not.toHaveBeenCalled();
 });
});
