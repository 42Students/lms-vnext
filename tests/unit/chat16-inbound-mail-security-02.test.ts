import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {safeInboundPreview,inboundMailListQuerySchema,inboundMailMetadataSchema} from "@/modules/inbound-mail/message-model";
import {inboundMailDetailSchema,safeMailDrawerText} from "@/modules/inbound-mail/drawer-model";
const read=(file:string)=>readFileSync(file,"utf8");

describe("chat-16 inbound mail admin security and preview hardening",()=>{
 it("inbound-mail-global-scope-01 keeps both read and mutation private to global SA",()=>{
  const source=read("src/modules/inbound-mail/admin-service.ts");
  for(const name of ["listInboundMailForAdmin","changeInboundMailStatusForAdmin"]){
   const part=source.slice(source.indexOf("export async function "+name));
   expect(part,name).toContain('requirePermission(context,"admin-scope.select")');
   expect(part,name).toContain("if(!isSuperAdmin(context))");
   expect(part,name).toContain("context.adminScope?.collegeId||context.adminScope?.organizationId");
  }
  expect(source).toContain("eq(inboundMailMessagesStaged.version,input.expectedVersion)");
  expect(source).toContain("eq(inboundMailMessagesStaged.status,input.expectedStatus)");
 });
 it("inbound-mail-preview-01 strips controls, normalizes whitespace and bounds negative or huge sizes",()=>{
  expect(safeInboundPreview("  Hello \n world\t ")).toBe("Hello world");
  expect(safeInboundPreview("ABCD",-1)).toBe("");
  expect(safeInboundPreview("ABCD",0)).toBe("");
  expect(safeInboundPreview("ABCD",2.9)).toBe("AB");
  expect(safeInboundPreview("A".repeat(3000),Number.POSITIVE_INFINITY)).toHaveLength(180);
  expect(safeInboundPreview("A".repeat(3000),50000)).toHaveLength(1000);
  expect(safeMailDrawerText("x\u0000y")).toBe("xy");
 });
 it("inbound-mail-filters-01 rejects oversized searches, rogue fields and unsafe pagination",()=>{
  expect(inboundMailListQuerySchema.parse({})).toEqual({status:"ALL",q:"",page:1});
  expect(inboundMailListQuerySchema.safeParse({status:"ALL",q:"x".repeat(121)}).success).toBe(false);
  expect(inboundMailListQuerySchema.parse({page:10001}).page).toBe(10000);
  expect(inboundMailListQuerySchema.parse({page:0}).page).toBe(1);
  expect(inboundMailListQuerySchema.parse({status:"DELETED"}).status).toBe("ALL");
  expect(inboundMailListQuerySchema.safeParse({unexpected:"yes"}).success).toBe(false);
  expect(inboundMailListQuerySchema.safeParse({recipient:"bad-address"}).success).toBe(false);
 });
 it("inbound-mail-detail-01 bounds body size and accepts only parsed status values",()=>{
  const raw={id:"11111111-1111-4111-8111-111111111111",status:"NEW",fromAddress:"a@b.com",
   toAddress:"c@d.com",subject:"Subject",receivedAt:"2099-01-01T00:00:00.000Z",plainText:"ok"};
  expect(inboundMailDetailSchema.safeParse(raw).success).toBe(true);
  expect(inboundMailDetailSchema.safeParse({...raw,plainText:"x".repeat(100001)}).success).toBe(false);
  expect(inboundMailMetadataSchema.safeParse({...raw,subject:"x".repeat(513)}).success).toBe(false);
 });
});
