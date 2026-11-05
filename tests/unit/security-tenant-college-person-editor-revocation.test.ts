import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const COLLEGE="11111111-1111-4111-8111-111111111111";
const ORG="22222222-2222-4222-8222-222222222222";
const TARGET="33333333-3333-4333-8333-333333333333";

const mocks=vi.hoisted(()=>({
  scope:vi.fn(),
  persisted:vi.fn(),
  audit:vi.fn(),
  rows:[] as Array<Array<Record<string,unknown>>>,
  timeline:[] as string[],
}));

vi.mock("@/modules/permissions/acting-college",()=>({
  resolveActingCollege:(...args:unknown[])=>mocks.scope(...args),
}));
vi.mock("@/modules/permissions/persisted-actor",()=>({
  assertPersistedPlatformPermission:(...args:unknown[])=>{
    mocks.timeline.push("persisted-authorization");
    return mocks.persisted(...args);
  },
}));
vi.mock("@/modules/activity/service",()=>({
  recordActivityEventInTransaction:(...args:unknown[])=>{
    mocks.timeline.push("audit");
    return mocks.audit(...args);
  },
}));
vi.mock("@/modules/people/profile-validation",()=>({
  learnerProfileDocumentSchema:{parse:(value:unknown)=>({
    personalDetails:{gender:"",dateOfBirth:""},
    address:{currentAddress:""},
    contacts:{alternatePhone:"",contactEmail:""},
    bio:"",
    ...(value && typeof value==="object" && !Array.isArray(value)?value:{}),
  })},
}));
vi.mock("@/modules/people/faculty-profile-document",()=>({
  facultyProfileDocumentSchema:{parse:(value:unknown)=>({
    about:{description:""},
    personalDetails:{gender:"",dateOfBirth:""},
    address:{currentAddress:""},
    contact:{contactMobile:"",contactMail:""},
    socialProfiles:{portfolio:""},
    ...(value && typeof value==="object" && !Array.isArray(value)?value:{}),
  })},
  facultyContactEditSchema:{parse:(value:unknown)=>value},
}));
vi.mock("@/db/client",()=>({
  getDb:()=>({
    transaction:async(callback:(tx:unknown)=>Promise<unknown>)=>{
      mocks.timeline.push("transaction");
      const tx={
        select:()=>{
          mocks.timeline.push("select");
          const rows=mocks.rows.shift()??[];
          return {
            from(){return this;},
            innerJoin(){return this;},
            leftJoin(){return this;},
            where(){return this;},
            for(){return this;},
            limit:async()=>rows,
          };
        },
        insert:()=>{
          mocks.timeline.push("insert");
          return {values:()=>({
            onConflictDoUpdate:async()=>{mocks.timeline.push("write");},
          })};
        },
      };
      return callback(tx);
    },
  }),
}));

import {
  getCollegePersonEditor,
  saveCollegePersonEditor,
} from "@/modules/people/college-directory-person-editor-service";

const actor:RequestContext={
  user:{id:"44444444-4444-4444-8444-444444444444",
    identityUid:"college-admin",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"55555555-5555-4555-8555-555555555555",
    collegeId:COLLEGE,organizationId:ORG,status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
};
const input={
  kind:"LEARNER",address:"",bio:"",gender:"" as const,
  dateOfBirth:"",contactEmail:"",contactPhone:"",
};
const activeTenant={collegeId:COLLEGE};
const target={id:TARGET,status:"ACTIVE"};

beforeEach(()=>{
  for(const fn of [mocks.scope,mocks.persisted,mocks.audit])fn.mockReset();
  mocks.rows.length=0;
  mocks.timeline.length=0;
  mocks.scope.mockResolvedValue({collegeId:COLLEGE,organizationId:ORG});
  mocks.persisted.mockResolvedValue(actor);
  mocks.audit.mockResolvedValue(undefined);
});

describe("SEC-05 college People editor live tenant and actor boundary",()=>{
  it("allows a scoped active administrator to read a member in their college",async()=>{
    mocks.rows.push([activeTenant],[{
      id:TARGET,status:"ACTIVE",name:"Student A",phone:null,email:null,
      learner:{},faculty:null,departmentId:null,facultyVersion:0,
      title:null,employmentType:null,roll:null,registration:null,
    }]);
    const result=await getCollegePersonEditor(actor,TARGET,"LEARNER");
    expect(result).toMatchObject({id:TARGET,kind:"LEARNER",name:"Student A"});
    expect(mocks.persisted).toHaveBeenCalledWith(expect.anything(),actor,"people.manage",
      {collegeId:COLLEGE,organizationId:ORG});
    expect(mocks.timeline).toEqual([
      "transaction","persisted-authorization","select","select",
    ]);
  });

  it("denies a private profile read after the administrator loses their role",async()=>{
    mocks.persisted.mockRejectedValueOnce(new Error("ROLE_REVOKED"));
    await expect(getCollegePersonEditor(actor,TARGET,"LEARNER"))
      .rejects.toThrow("ROLE_REVOKED");
    expect(mocks.timeline).toEqual(["transaction","persisted-authorization"]);
  });

  it("denies private profile reads after college or organization archival",async()=>{
    mocks.rows.push([]);
    await expect(getCollegePersonEditor(actor,TARGET,"LEARNER"))
      .rejects.toThrow();
    expect(mocks.timeline).toEqual(["transaction","persisted-authorization","select"]);
  });

  it("never reads another college's target even when given a valid UUID",async()=>{
    mocks.rows.push([activeTenant],[]);
    await expect(getCollegePersonEditor(actor,TARGET,"LEARNER"))
      .rejects.toThrow("PERSON_NOT_FOUND");
    expect(mocks.timeline).toEqual([
      "transaction","persisted-authorization","select","select",
    ]);
  });

  it("writes and audits only after member lock, persisted authority and tenant check",async()=>{
    mocks.rows.push([target],[activeTenant],[{document:{}}]);
    const result=await saveCollegePersonEditor(actor,TARGET,input);
    expect(result).toMatchObject({id:TARGET,updated:true});
    expect(mocks.timeline).toEqual([
      "transaction","select","persisted-authorization","select",
      "select","insert","write","audit",
    ]);
    expect(mocks.persisted).toHaveBeenCalledWith(expect.anything(),actor,
      "people.manage",{collegeId:COLLEGE,organizationId:ORG});
  });

  it("blocks revoked-administrator mutations with zero writes and zero audit events",async()=>{
    mocks.rows.push([target]);
    mocks.persisted.mockRejectedValueOnce(new Error("ROLE_REVOKED"));
    await expect(saveCollegePersonEditor(actor,TARGET,input))
      .rejects.toThrow("ROLE_REVOKED");
    expect(mocks.timeline).toEqual([
      "transaction","select","persisted-authorization",
    ]);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("blocks an archived college before any profile write",async()=>{
    mocks.rows.push([target],[]);
    await expect(saveCollegePersonEditor(actor,TARGET,input))
      .rejects.toThrow();
    expect(mocks.timeline).toEqual([
      "transaction","select","persisted-authorization","select",
    ]);
    expect(mocks.audit).not.toHaveBeenCalled();
  });

  it("blocks a foreign or ended target without reading or editing private profile data",async()=>{
    for(const rows of [[],[{id:TARGET,status:"ENDED"}]]){
      mocks.rows.push(rows);
      await expect(saveCollegePersonEditor(actor,TARGET,input))
        .rejects.toThrow("PERSON_NOT_EDITABLE");
      expect(mocks.timeline).not.toContain("insert");
      expect(mocks.timeline).not.toContain("persisted-authorization");
      mocks.timeline.length=0;
      mocks.audit.mockClear();
    }
  });
});
