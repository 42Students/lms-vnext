import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";

const state=vi.hoisted(()=>({
  collegeAuth:vi.fn(),
  db:vi.fn(),
  select:vi.fn(),
  transaction:vi.fn(),
}));
vi.mock("server-only",()=>({}));
vi.mock("@/db/client",()=>({getDb:state.db}));
vi.mock("@/modules/placements/college-drive-read-service",()=>({
  requireCollegePlacementAdmin:state.collegeAuth,
}));
import {listCollegeDriveInterviews} from "@/modules/placements/college-drive-interviews-service";
import {
  getCollegeInterviewAppointments,mutateCollegeInterview,
} from "@/modules/placements/college-interview-action-service";
import {listCollegeInterviewDirectory,collegeInterviewFilters} from "@/modules/placements/college-interview-directory-service";
import {finishCollegeInterview} from "@/modules/placements/college-interview-lifecycle-service";
import {
  getCollegeRoundSlotAppointments,mutateCollegeRoundSlotInterview,
} from "@/modules/placements/college-round-slot-action-service";
import {
  listHrInterviewSlots,writeHrInterviewSlot,
} from "@/modules/placements/hr-interview-slot-service";
import {
  editHrJobRound,listHrRoundEditorRows,
} from "@/modules/placements/hr-round-editor-service";

const job="11111111-1111-4111-8111-111111111111";
const interview="22222222-2222-4222-8222-222222222222";
const college={
  user:{id:"officer",identityUid:"officer",platformStatus:"ACTIVE",systemRoles:[]},
  membership:{id:"cm",collegeId:"c",organizationId:"org",status:"ACTIVE",roles:["COLLEGE_ADMIN"]},
} as unknown as RequestContext;
const unauthorizedRecruiter={
  user:{id:"recruiter",identityUid:"recruiter",platformStatus:"ACTIVE",systemRoles:[]},
  membership:null,recruiter:null,
} as RequestContext;

beforeEach(()=>{
  vi.clearAllMocks();
  state.collegeAuth.mockRejectedValue(new Error("FORBIDDEN_COLLEGE_ROLE"));
  state.db.mockReturnValue({
    select:state.select,
    transaction:state.transaction.mockImplementation((fn:(tx:{select:typeof state.select})=>Promise<unknown>)=>
      fn({select:state.select})),
  });
});

describe("chat-2 college and recruiter interview service zero-read denials",()=>{
  const deniedCollege=[
    {name:"drive rounds",call:()=>listCollegeDriveInterviews(college,job,{})},
    {name:"per-drive appointments",call:()=>getCollegeInterviewAppointments(college,job)},
    {name:"per-drive appointment mutation",call:()=>mutateCollegeInterview(college,job,{action:"SCHEDULE"})},
    {name:"global directory",call:()=>listCollegeInterviewDirectory(college,{})},
    {name:"registered round-slot list",call:()=>getCollegeRoundSlotAppointments(college,job)},
    {name:"registered round-slot mutation",call:()=>mutateCollegeRoundSlotInterview(college,job,{action:"SCHEDULE"})},
    {name:"terminal interview completion",call:()=>finishCollegeInterview(college,{
      id:interview,expectedVersion:1,status:"COMPLETED",reason:"Panel confirmed outcome",
    })},
  ] as const;
  for(const entry of deniedCollege){
    it("COL-interviews-security-01 "+entry.name+" denies revoked college role before DB",async()=>{
      await expect(entry.call()).rejects.toThrow("FORBIDDEN_COLLEGE_ROLE");
      expect(state.db).not.toHaveBeenCalled();
      expect(state.select).not.toHaveBeenCalled();
      expect(state.transaction).not.toHaveBeenCalled();
    });
  }

  it("COL-interviews-security-02 directory schema rejects tenant override, bad paging, unknown modes ahead of auth and DB",async()=>{
    expect(collegeInterviewFilters.parse({})).toMatchObject({
      status:"ALL",mode:"ALL",type:"ALL",sort:"UPCOMING",page:1,
    });
    for(const raw of [
      {collegeId:job},
      {page:0},
      {page:1001},
      {status:"ACCEPTED"},
      {type:"QUIZ"},
      {sort:"RECRUITER"},
      {companyId:"invalid"},
      {q:"x".repeat(101)},
    ])expect(collegeInterviewFilters.safeParse(raw).success).toBe(false);
    await expect(listCollegeInterviewDirectory(college,{collegeId:job})).rejects.toThrow();
    expect(state.collegeAuth).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("COL-interviews-security-03 rejects forged completion target/version and reason before college access",async()=>{
    for(const raw of [
      {id:"not-a-uuid",expectedVersion:1,status:"COMPLETED",reason:"Panel confirmed"},
      {id:interview,expectedVersion:0,status:"COMPLETED",reason:"Panel confirmed"},
      {id:interview,expectedVersion:1,status:"CANCELLED",reason:"Panel confirmed"},
      {id:interview,expectedVersion:1,status:"NO_SHOW",reason:"x"},
      {id:interview,expectedVersion:1,status:"NO_SHOW",reason:"Panel confirmed",collegeId:job},
    ])await expect(finishCollegeInterview(college,raw)).rejects.toThrow();
    expect(state.collegeAuth).not.toHaveBeenCalled();
    expect(state.db).not.toHaveBeenCalled();
  });

  it("HR-interviews-security-04 never resolves recruiter's appointment data for a malformed drive ID",async()=>{
    for(const rawId of ["../../other-college","","nope"]){
      await expect(listHrInterviewSlots(unauthorizedRecruiter,rawId)).rejects.toThrow();
      await expect(writeHrInterviewSlot(unauthorizedRecruiter,rawId,{
        action:"CANCEL",slotId:interview,expectedVersion:1,
      })).rejects.toThrow();
      await expect(listHrRoundEditorRows(unauthorizedRecruiter,rawId)).rejects.toThrow();
      await expect(editHrJobRound(unauthorizedRecruiter,rawId,{
        action:"CREATE",kind:"INTERVIEW",name:"Technical",
      })).rejects.toThrow();
    }
    expect(state.db).not.toHaveBeenCalled();
  });

  it("HR-interviews-security-05 rejects a forged recruiter profile before reading rounds or slots",async()=>{
    await expect(listHrRoundEditorRows(unauthorizedRecruiter,job)).rejects.toMatchObject({
      code:"PLACEMENT_JOB_NOT_FOUND",
    });
    await expect(editHrJobRound(unauthorizedRecruiter,job,{
      action:"CREATE",kind:"INTERVIEW",name:"Technical",
    })).rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    await expect(listHrInterviewSlots(unauthorizedRecruiter,job))
      .rejects.toMatchObject({code:"PLACEMENT_JOB_NOT_FOUND"});
    expect(state.select).not.toHaveBeenCalled();
    expect(state.db).toHaveBeenCalledTimes(1);
  });

  it("HR-interviews-security-06 rejects invalid recruiter slot transitions before opening a transaction",async()=>{
    for(const raw of [
      {action:"SCHEDULE"},
      {action:"CANCEL",slotId:"invalid",expectedVersion:1},
      {action:"BOOK",slotId:interview,expectedVersion:-2},
      {action:"CREATE",collegeId:job},
    ])await expect(writeHrInterviewSlot(unauthorizedRecruiter,job,raw)).rejects.toThrow();
    expect(state.db).not.toHaveBeenCalled();
  });
});
