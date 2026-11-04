import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const fake=vi.hoisted(()=>({
 transaction:vi.fn(),select:vi.fn(),insert:vi.fn(),execute:vi.fn(),
 persisted:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:()=>({transaction:fake.transaction})}));
vi.mock("@/modules/permissions/persisted-actor",
 ()=>({assertPersistedPlatformPermission:fake.persisted}));
vi.mock("@/modules/skills/catalog-readiness",
 ()=>({skillsCatalogSchemaReady:()=>true}));

import {reconcileLegacySkillCatalog} from "@/modules/skills/skill-source-import-service";
import {reconcileCuratedSkillSynonyms} from "@/modules/skills/curated-synonym-seed-service";

const admin:RequestContext={
 user:{id:"11111111-1111-4111-8111-111111111111",
  identityUid:"admin-identity",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,recruiter:null,
};
const importInput={format:"CSV" as const,source:"Python,Python,Technical",dryRun:false};
const variants=[
 ["canonical skill CSV import",(context:RequestContext)=>
  reconcileLegacySkillCatalog(context,importInput)],
 ["curated synonym seed",(context:RequestContext)=>
  reconcileCuratedSkillSynonyms(context,false)],
] as const;

beforeEach(()=>{
 vi.resetAllMocks();
 fake.transaction.mockImplementation(async(fn:(tx:unknown)=>Promise<unknown>)=>
  fn({select:fake.select,insert:fake.insert,execute:fake.execute}));
 fake.persisted.mockRejectedValue(new Error("persisted platform role revoked"));
});

describe("Super Admin catalog mutations cannot outlive a revoked role or tenant scope",()=>{
 for(const [name,run] of variants){
  it(name+" denies revoked privilege before touching catalog rows",async()=>{
   await expect(run(admin)).rejects.toThrow("persisted platform role revoked");
   expect(fake.transaction).toHaveBeenCalledOnce();
   expect(fake.persisted).toHaveBeenCalledOnce();
   expect(fake.persisted).toHaveBeenCalledWith(expect.any(Object),admin,"admin-scope.select");
   expect(fake.select).not.toHaveBeenCalled();
   expect(fake.insert).not.toHaveBeenCalled();
   expect(fake.execute).not.toHaveBeenCalled();
  });
  it(name+" denies a suspended/disabled platform actor before a transaction",async()=>{
   const inactive={...admin,user:{...admin.user,platformStatus:"DISABLED" as const}};
   await expect(run(inactive)).rejects.toThrow();
   expect(fake.transaction).not.toHaveBeenCalled();
   expect(fake.insert).not.toHaveBeenCalled();
  });
  it(name+" denies any college/organization scope on a global catalog write",async()=>{
   const scoped={...admin,adminScope:{
    organizationId:"22222222-2222-4222-8222-222222222222",collegeId:null,
   }};
   await expect(run(scoped)).rejects.toThrow();
   expect(fake.transaction).not.toHaveBeenCalled();
   expect(fake.insert).not.toHaveBeenCalled();
  });
  it(name+" denies a College Admin pretending to hold a platform role",async()=>{
   const collegeActor={...admin,user:{...admin.user,systemRoles:[]}};
   await expect(run(collegeActor)).rejects.toThrow();
   expect(fake.transaction).not.toHaveBeenCalled();
  });
 }
});
