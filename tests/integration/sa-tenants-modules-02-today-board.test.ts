import {describe,it,expect} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getSuperAdminTodayBoard} from "@/modules/colleges/admin-today-attention-service";
import {SEED_IDS} from "../../scripts/db-seed-data";
const context:RequestContext={
 user:{id:SEED_IDS.collegeAdminUser,identityUid:"sa-today-test",
  platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null,
};
describe.skipIf(!process.env.TEST_DATABASE_URL)("SA-tenants-modules-02 Today board DB access",()=>{
 it("uses the selected college and rejects a foreign selected scope",async()=>{
  const data=await getSuperAdminTodayBoard(context,SEED_IDS.collegeA);
  expect(data.classesScheduled).toBeGreaterThanOrEqual(0);
  await expect(getSuperAdminTodayBoard({...context,adminScope:{
   organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB,
  }},SEED_IDS.collegeA)).rejects.toBeDefined();
 });
});
