import {beforeEach,describe,expect,it,vi} from "vitest";
import {PeopleServiceError} from "@/modules/people/errors";
import {resolveOrCreateIdentity} from "@/modules/people/identity";
import {
 bootstrapSuperAdmin,bootstrapSuperAdminInputSchema,SystemRoleServiceError,
 type SystemRoleRepository,
} from "@/modules/system-roles/service";
vi.mock("@/modules/people/identity",()=>({resolveOrCreateIdentity:vi.fn()}));
const input={phoneE164:"+919876543210",email:"operator@example.test",displayName:"Platform Operator"};
const repo={
 persistBootstrapUser:vi.fn(),
 loadUser:vi.fn(),
 assignRole:vi.fn(),
};
const repository=repo as unknown as SystemRoleRepository;
beforeEach(()=>{
 vi.resetAllMocks();
 vi.mocked(resolveOrCreateIdentity).mockResolvedValue({
  uid:"identity-operator-1",email:"operator@example.test",
 } as never);
 repo.persistBootstrapUser.mockResolvedValue({
  id:"11111111-1111-4111-8111-111111111111",systemRoles:["SUPER_ADMIN"],
 });
});
describe("AUTH-system-role-23 guarded bootstrap boundary",()=>{
 it("accepts only exact normalized platform operator bootstrap fields",()=>{
  expect(bootstrapSuperAdminInputSchema.safeParse(input).success).toBe(true);
  for(const invalid of [
   {...input,systemRole:"SUPER_ADMIN"},
   {...input,organizationId:"22222222-2222-4222-8222-222222222222"},
   {...input,phoneE164:"12345"},
   {...input,displayName:""},
   null,
  ])expect(bootstrapSuperAdminInputSchema.safeParse(invalid).success).toBe(false);
 });
 it("persists exact resolved identity and never trusts injected identifiers",async()=>{
  const out=await bootstrapSuperAdmin(input,{identityDirectory:{} as never,repository});
  expect(out).toMatchObject({systemRoles:["SUPER_ADMIN"]});
  expect(resolveOrCreateIdentity).toHaveBeenCalledWith(input,expect.anything());
  expect(repo.persistBootstrapUser).toHaveBeenCalledOnce();
  expect(repo.persistBootstrapUser).toHaveBeenCalledWith({
   identityUid:"identity-operator-1",phoneE164:input.phoneE164,
   email:input.email,displayName:input.displayName,
  });
 });
 it("rejects malformed payloads before directory or repository access",async()=>{
  await expect(bootstrapSuperAdmin({...input,platformStatus:"ACTIVE"},{
   identityDirectory:{} as never,repository,
  })).rejects.toThrow();
  expect(resolveOrCreateIdentity).not.toHaveBeenCalled();
  expect(repo.persistBootstrapUser).not.toHaveBeenCalled();
 });
 it("maps contact identity collisions, but never mislabels provider or DB outages",async()=>{
  vi.mocked(resolveOrCreateIdentity).mockRejectedValueOnce(new PeopleServiceError("IDENTITY_COLLISION"));
  await expect(bootstrapSuperAdmin(input,{
   identityDirectory:{} as never,repository,
  })).rejects.toMatchObject({code:"IDENTITY_COLLISION"});
  expect(repo.persistBootstrapUser).not.toHaveBeenCalled();
  vi.mocked(resolveOrCreateIdentity).mockRejectedValueOnce(new Error("upstream unavailable"));
  await expect(bootstrapSuperAdmin(input,{
   identityDirectory:{} as never,repository,
  })).rejects.toThrow("upstream unavailable");
  expect(repo.persistBootstrapUser).not.toHaveBeenCalled();
 });
});
