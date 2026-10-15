import {describe,it,expect} from "vitest";
import {getDb} from "@/db/client";
import {and,eq} from "drizzle-orm";
import {moduleAccessRules,activityEvents} from "@/db/schema";
import type {RequestContext} from "@/modules/identity/context";
import {writeSuperAdminCollegeRule} from "@/modules/module-access/admin-college-rule-write";
import {ACTIVITY_EVENT_TYPES} from "@/modules/activity/taxonomy";
import {SEED_IDS} from "../../scripts/db-seed-data";
const admin:RequestContext={user:{id:SEED_IDS.collegeAdminUser,identityUid:"super",platformStatus:"ACTIVE",systemRoles:["SUPER_ADMIN"]},membership:null};
describe.skipIf(!process.env.TEST_DATABASE_URL)("Super Admin college module SET transaction",()=>{
 it("denies wrong roles, and requires a live college tenant",async()=>{
  await expect(writeSuperAdminCollegeRule({...admin,user:{...admin.user,systemRoles:[]}},SEED_IDS.collegeA,{action:"SET",module:"projects",enabled:true,locked:false,expected:null})).rejects.toBeDefined();
  await expect(writeSuperAdminCollegeRule({...admin,adminScope:{organizationId:SEED_IDS.organization,collegeId:SEED_IDS.collegeB}},SEED_IDS.collegeA,{action:"SET",module:"projects",enabled:true,locked:false,expected:null})).rejects.toBeDefined();
 });
});
