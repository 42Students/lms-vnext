import {beforeEach,describe,expect,it,vi} from "vitest";

const mocks=vi.hoisted(()=>({
 select:vi.fn(),where:vi.fn(),limit:vi.fn(),
 rows:[] as Array<Array<Record<string,unknown>>>,
}));
vi.mock("@/db/client",()=>({
 getDb:()=>({
  select:(columns:unknown)=>{
   mocks.select(columns);
   return {from(){return this;},where(predicate:unknown){
    mocks.where(predicate);
    return this;
   },limit:(n:number)=>{
    mocks.limit(n);
    return Promise.resolve(mocks.rows.shift()??[]);
   }};
  },
 }),
}));
import {e2eIdentityDirectory} from "@/modules/people/e2e-identity-directory";

const stored={
 identityUid:"e2e-person-existing",phoneE164:"+919876543210",
 email:"student@example.edu",displayName:"A Student",
};
beforeEach(()=>{
 for(const fn of [mocks.select,mocks.where,mocks.limit])fn.mockReset();
 mocks.rows.length=0;
});
describe("COL-people-e2e-identity-01 deterministic fixture identity isolation",()=>{
 it("returns consistent synthetic IDs for repeated fixture contacts without database writes",async()=>{
  const first=await e2eIdentityDirectory.createUser({phoneNumber:"+919876543210",
   displayName:"Student"});
  const repeated=await e2eIdentityDirectory.createUser({phoneNumber:"+919876543210",
   displayName:"Student"});
  const other=await e2eIdentityDirectory.createUser({phoneNumber:"+919876543211",
   displayName:"Student"});
  expect(first.uid).toBe(repeated.uid);
  expect(first.uid).not.toBe(other.uid);
  expect(first.uid).toMatch(/^e2e-person-[0-9a-f]{32}$/);
  expect(first.uid).not.toContain("9876543210");
  expect(mocks.select).not.toHaveBeenCalled();
 });
 it("normalizes the email SQL parameter and projects only directory attributes",async()=>{
  mocks.rows.push([stored]);
  const result=await e2eIdentityDirectory.findByEmail(" Student@Example.EDU ");
  expect(result).toEqual({
   uid:"e2e-person-existing",phoneNumber:"+919876543210",
   email:"student@example.edu",displayName:"A Student",
  });
  expect(result).not.toHaveProperty("id");
  const query=mocks.where.mock.calls[0]?.[0] as {queryChunks?:unknown[]};
  expect((query.queryChunks??[]).some(chunk=>
   typeof chunk==="object"&&chunk!==null&&"value" in chunk&&
   chunk.value==="student@example.edu")).toBe(true);
  expect(mocks.limit).toHaveBeenCalledWith(1);
 });
 it("missing synthetic identities return null rather than inferring a foreign user",async()=>{
  expect(await e2eIdentityDirectory.findByPhone("+919876543210")).toBeNull();
  expect(mocks.limit).toHaveBeenCalledWith(1);
 });
 it("existing directory user updates preserve email/phone without a requested replacement",async()=>{
  mocks.rows.push([stored]);
  const value=await e2eIdentityDirectory.updateUser("e2e-person-existing",{
   displayName:"Changed",
  });
  expect(value).toEqual({
   uid:"e2e-person-existing",phoneNumber:"+919876543210",
   email:"student@example.edu",displayName:"Changed",
  });
 });
});
