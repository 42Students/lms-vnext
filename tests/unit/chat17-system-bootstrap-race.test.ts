import { describe, expect, it, vi } from "vitest";
import {
  bootstrapSuperAdmin, type SystemRoleRepository,
} from "@/modules/system-roles/service";
import {
  IdentityDirectoryConflictError, type IdentityDirectory,
} from "@/modules/people/identity";

const PHONE="+919123456789";
const EMAIL="admin@example.test";
const UID="superadmin-identity-uid";
const input={phoneE164:PHONE,email:EMAIL,displayName:"Test System Admin"};
function dependencies(){
  const user={uid:UID,phoneNumber:PHONE,email:EMAIL,displayName:input.displayName};
  const directory={
    findByPhone:vi.fn(async(_phone:string)=>null as typeof user|null),
    findByEmail:vi.fn(async(_email:string)=>null as typeof user|null),
    createUser:vi.fn(async(_options:Parameters<IdentityDirectory["createUser"]>[0])=>user),
    updateUser:vi.fn(async(_uid:string,_data:Parameters<IdentityDirectory["updateUser"]>[1])=>user),
  } satisfies IdentityDirectory;
  const repository={
    persistBootstrapUser:vi.fn(async(data:Parameters<SystemRoleRepository["persistBootstrapUser"]>[0])=>({
      id:"11111111-1111-4111-8111-111111111111",
      identityUid:data.identityUid,phoneE164:data.phoneE164,email:data.email??null,
      displayName:data.displayName,platformStatus:"ACTIVE" as const,systemRoles:["SUPER_ADMIN" as const],
    })),
    loadUser:vi.fn(async()=>null),
    assignRole:vi.fn(async()=>["SUPER_ADMIN" as const]),
  } satisfies SystemRoleRepository;
  return {identityDirectory:directory,repository,user};
}

describe("WEAK-system-roles bootstrap identity reconciliation",()=>{
  it("WEAK-system-roles-05 new identity persists once with the resolved directory UID",async()=>{
    const deps=dependencies();
    await expect(bootstrapSuperAdmin(input,deps)).resolves.toMatchObject({
      identityUid:UID,phoneE164:PHONE,email:EMAIL,displayName:input.displayName,
      systemRoles:["SUPER_ADMIN"],
    });
    expect(deps.identityDirectory.createUser).toHaveBeenCalledOnce();
    expect(deps.repository.persistBootstrapUser).toHaveBeenCalledWith({
      identityUid:UID,phoneE164:PHONE,email:EMAIL,displayName:input.displayName,
    });
    expect(deps.identityDirectory.updateUser).not.toHaveBeenCalled();
  });

  it("WEAK-system-roles-06 conflicting phone and email identities fail closed before role write",async()=>{
    const deps=dependencies();
    deps.identityDirectory.findByPhone.mockResolvedValueOnce(deps.user);
    deps.identityDirectory.findByEmail.mockResolvedValueOnce({
      ...deps.user,uid:"different-uid",
    });
    await expect(bootstrapSuperAdmin(input,deps)).rejects.toMatchObject({
      name:"SystemRoleServiceError",code:"IDENTITY_COLLISION",
    });
    expect(deps.identityDirectory.createUser).not.toHaveBeenCalled();
    expect(deps.repository.persistBootstrapUser).not.toHaveBeenCalled();
  });

  it("WEAK-system-roles-07 double-submit directory conflict reconciles existing identity instead of creating a second one",async()=>{
    const deps=dependencies();
    deps.identityDirectory.findByPhone.mockResolvedValueOnce(null).mockResolvedValueOnce(deps.user);
    deps.identityDirectory.createUser.mockRejectedValueOnce(new IdentityDirectoryConflictError());
    await expect(bootstrapSuperAdmin(input,deps)).resolves.toMatchObject({identityUid:UID});
    expect(deps.identityDirectory.findByPhone).toHaveBeenCalledTimes(2);
    expect(deps.identityDirectory.createUser).toHaveBeenCalledOnce();
    expect(deps.repository.persistBootstrapUser).toHaveBeenCalledOnce();
  });

  it("WEAK-system-roles-08 bad bootstrap input is rejected before directory or DB side effects",async()=>{
    const deps=dependencies();
    await expect(bootstrapSuperAdmin({phoneE164:"not phone",email:"x",displayName:""},deps))
      .rejects.toThrow();
    expect(deps.identityDirectory.findByPhone).not.toHaveBeenCalled();
    expect(deps.identityDirectory.createUser).not.toHaveBeenCalled();
    expect(deps.repository.persistBootstrapUser).not.toHaveBeenCalled();
  });
});
