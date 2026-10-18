import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks=vi.hoisted(()=>({
 select:vi.fn(),where:vi.fn(),limit:vi.fn(),rows:[] as Array<Array<Record<string,unknown>>>,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:(projection:unknown)=>{
   mocks.select(projection);
   return {from(){return this;},where(condition:unknown){
    mocks.where(condition);return this;
   },limit:(n:number)=>{
    mocks.limit(n);return Promise.resolve(mocks.rows.shift()??[]);
   }};
  },
 }),
}));
import { localIdentityDirectory } from "@/modules/people/local-identity-directory";

const stored={
 identityUid:"lms-existing",phoneE164:"+919876543210",
 email:"student@example.edu",displayName:"A Student",
};
beforeEach(()=>{
 mocks.select.mockReset();mocks.where.mockReset();mocks.limit.mockReset();mocks.rows.length=0;
});
describe("COL-people-local-identity-01 safe directory read and create contracts",()=>{
 it("finds a registered local identity by phone without revealing internal user ID",async()=>{
  mocks.rows.push([stored]);
  const result=await localIdentityDirectory.findByPhone("+919876543210");
  expect(result).toEqual({
   uid:"lms-existing",phoneNumber:"+919876543210",
   email:"student@example.edu",displayName:"A Student",
  });
  expect(result).not.toHaveProperty("id");
  expect(mocks.select).toHaveBeenCalledOnce();
  expect(mocks.limit).toHaveBeenCalledWith(1);
 });
 it("email lookup is case-insensitive and never invents an identity for an absent row",async()=>{
  const absent=await localIdentityDirectory.findByEmail(" MISSING@EXAMPLE.EDU ");
  expect(absent).toBeNull();
  expect(mocks.where).toHaveBeenCalledOnce();
  const condition=mocks.where.mock.calls[0]?.[0] as {queryChunks?:unknown[]};
  expect((condition.queryChunks??[]).some(chunk=>
   typeof chunk==="object"&&chunk!==null&&"value" in chunk&&
   chunk.value==="missing@example.edu")).toBe(true);
  mocks.rows.push([stored]);
  expect((await localIdentityDirectory.findByEmail("student@example.edu"))?.uid).toBe("lms-existing");
 });
 it("allocates opaque fresh local identity UIDs without writing outside the caller's transaction",async()=>{
  const first=await localIdentityDirectory.createUser({displayName:"New",email:"new@example.edu"});
  const second=await localIdentityDirectory.createUser({displayName:"New",email:"new@example.edu"});
  expect(first.uid).toMatch(/^lms_[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  expect(second.uid).not.toBe(first.uid);
  expect(first).toMatchObject({phoneNumber:null,email:"new@example.edu",displayName:"New"});
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("preserves the registered contact when a partial profile update does not include it",async()=>{
  mocks.rows.push([stored]);
  const updated=await localIdentityDirectory.updateUser("lms-existing",{displayName:"Updated"});
  expect(updated).toEqual({
   uid:"lms-existing",phoneNumber:"+919876543210",
   email:"student@example.edu",displayName:"Updated",
  });
  expect(mocks.select).toHaveBeenCalledOnce();
  expect(mocks.limit).toHaveBeenCalledWith(1);
 });
});
