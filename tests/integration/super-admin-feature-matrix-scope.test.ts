import {randomUUID} from "node:crypto";
import {afterAll,describe,expect,it} from "vitest";
import {and,eq} from "drizzle-orm";
import {closeDatabaseConnection,getDb} from "@/db/client";
import {colleges,moduleAccessRules} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {listSuperAdminFeatureControls} from "@/modules/module-access/admin-read-service";
import {superAdminFeaturePageCsv} from "@/modules/module-access/admin-feature-export";
import {SEED_IDS} from "../../scripts/db-seed-data";
import {assertDb018DisposableTarget} from "../support/db018-test-target.mjs";

const enabled=Boolean(process.env.TEST_DATABASE_URL)&&process.env.DB03_ISOLATED_TEST_DATABASE==="1";
if(enabled)assertDb018DisposableTarget(process.env,{serviceBound:true});
const admin:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"feature-admin-fixture",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},
 membership:null,adminScope:null,
};
describe.skipIf(!enabled)("Super Admin feature matrix strict scoped PostgreSQL filters",()=>{
 afterAll(async()=>{await closeDatabaseConnection();});
 it("counts and pages the same exact college/module rule, including explicit absence and CSV",async()=>{
  const db=getDb();
  const collegeId=randomUUID();
  const code="FC"+randomUUID().slice(0,10);
  await db.insert(colleges).values({id:collegeId,organizationId:SEED_IDS.organization,name:"Feature Scope "+code,code,status:"ACTIVE"});
  const scope={...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId}};
  try{
   const none=await listSuperAdminFeatureControls(scope,{q:code,module:"projects",presence:"NO_RULE"});
   expect(none.total).toBe(1);
   expect(none.items.map(row=>row.id)).toEqual([collegeId]);
   const absent=await listSuperAdminFeatureControls(scope,{q:code,module:"projects",presence:"HAS_RULE"});
   expect(absent.total).toBe(0);
   await db.insert(moduleAccessRules).values({scopeType:"COLLEGE",scopeId:collegeId,module:"projects",enabled:false,locked:true,updatedByUserId:SEED_IDS.collegeAdminUser});
   const filtered=await listSuperAdminFeatureControls(scope,{q:code,module:"projects",storedState:"OFF",locks:"LOCKED",recent:"7D"});
   expect(filtered.total).toBe(1);
   expect(filtered.items.map(row=>row.id)).toEqual([collegeId]);
   const wrongModule=await listSuperAdminFeatureControls(scope,{q:code,module:"electives",storedState:"OFF"});
   expect(wrongModule.total).toBe(0);
   const noLongerAbsent=await listSuperAdminFeatureControls(scope,{q:code,module:"projects",presence:"NO_RULE"});
   expect(noLongerAbsent.total).toBe(0);
   expect(superAdminFeaturePageCsv(filtered.items)).toContain(code);
   const leaked=await listSuperAdminFeatureControls({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}},{q:code});
   expect(leaked.total).toBe(0);
   await expect(listSuperAdminFeatureControls({...admin,user:{...admin.user,systemRoles:[]}}, {q:code})).rejects.toBeDefined();
  }finally{
   await db.delete(moduleAccessRules).where(and(eq(moduleAccessRules.scopeType,"COLLEGE"),eq(moduleAccessRules.scopeId,collegeId)));
   await db.delete(colleges).where(eq(colleges.id,collegeId));
  }
 });
});
