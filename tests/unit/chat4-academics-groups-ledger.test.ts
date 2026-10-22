import {describe,expect,it} from "vitest";
import {
  formatPromotionAcademicYear,collegePromotionQuerySchema,batchPromotionPlan,promotionLearnerBlockers,
  collegePromotionExecuteSchema,promotionReady,promotionPreviewMatches,
} from "@/modules/academics/college-batch-promotion-model";
import {timestampTokenIso} from "@/modules/academics/optimistic-timestamp-model";
import {collegeHallBookingSchema,hallBookingWindow,hallCanFitClass,hallFacultyIsEligible} from "@/modules/academics/college-hall-booking-model";
import {collegeSectionLifecycleSchema,classLifecyclePrompt} from "@/modules/academics/college-section-lifecycle-model";
import {collegePreviewErrorLabel} from "@/modules/academics/college-recurring-preview-ui-model";
import {collegeStudyGroupCreateSchema,collegeStudyGroupChangeSchema,studyGroupNextStatus,studyGroupConflictMessage} from "@/modules/groups/college-group-management-model";
import {collegeGroupDetailWriteSchema,collegeWaitlistPromotionBlocker,collegeGroupDetailActionLabel} from "@/modules/groups/college-group-detail-write-model";
import {collegeStudyMemberSchema,collegeStudyMemberLabel} from "@/modules/groups/college-member-management-model";
import {groupRuleCriteriaSchema,matchesGroupRuleCandidate} from "@/modules/groups/rule-evaluator";
import {collegeRulePreviewInputSchema,projectCollegeGroupRulePreview} from "@/modules/groups/college-rule-preview-model";
const a="00000000-0000-4000-8000-000000000001";
const b="00000000-0000-4000-8000-000000000002";

describe("chat-4 college academics and group models: state, validation, concurrency",()=>{
  it("formatPromotionAcademicYear formats both normal years and 2099 rollover",()=>{
    expect(formatPromotionAcademicYear(2026)).toBe("2026-27");
    expect(formatPromotionAcademicYear(2099)).toBe("2099-00");
  });
  it("collegePromotionQuerySchema rejects duplicate, unknown, malformed and nonconsecutive year values",()=>{
    expect(collegePromotionQuerySchema.safeParse({programId:a,yearStart:"2026-27"}).success).toBe(true);
    for(const bad of [{yearStart:"2026-29"},{yearStart:"1899-00"},{cohortId:"other"},{programId:[a,b]},{page:2}]){
      expect(collegePromotionQuerySchema.safeParse(bad).success).toBe(false);
    }
  });
  const base={cohortStatus:"ACTIVE",currentTermNumber:2,durationTerms:8,nextTermConfigured:true,
    nextTermHasCourses:true,currentYearStart:2026,currentPeriodConfigured:true,currentPeriodOwned:true};
  it("batchPromotionPlan distinguishes promote, graduate and unusable progression",()=>{
    expect(batchPromotionPlan(base)).toEqual({action:"PROMOTE",targetTermNumber:3,academicYearStart:2027,blockers:[]});
    expect(batchPromotionPlan({...base,currentTermNumber:8}).action).toBe("GRADUATE");
    const bad=batchPromotionPlan({...base,currentTermNumber:0,cohortStatus:"ARCHIVED",currentPeriodConfigured:false,currentYearStart:null});
    expect(bad.action).toBe("UNAVAILABLE");
    for(const blocker of ["BATCH_NOT_ACTIVE","TERM_OUTSIDE_PROGRAM","PERIOD_NOT_CONFIGURED","ACADEMIC_YEAR_MISSING"])
      expect(bad.blockers).toContain(blocker);
  });
  it("batchPromotionPlan blocks missing next-term mapping and foreign academic periods",()=>{
    expect(batchPromotionPlan({...base,nextTermConfigured:false}).blockers).toContain("NEXT_TERM_UNCONFIGURED");
    expect(batchPromotionPlan({...base,nextTermHasCourses:false}).blockers).toContain("NEXT_TERM_NO_MAPPED_COURSES");
    expect(batchPromotionPlan({...base,currentPeriodOwned:false}).blockers).toContain("PERIOD_OUTSIDE_COLLEGE");
    expect(batchPromotionPlan({...base,overrideYearStart:2030}).academicYearStart).toBe(2030);
  });
  it("promotionLearnerBlockers enforces every identity and class eligibility condition",()=>{
    const valid={enrollmentStatus:"ACTIVE",membershipStatus:"ACTIVE",accountStatus:"ACTIVE",
      hasLearnerRole:true,hasActiveClass:true,periodConfigured:true};
    expect(promotionLearnerBlockers(valid)).toEqual([]);
    expect(promotionLearnerBlockers({...valid,enrollmentStatus:"ENDED",membershipStatus:"SUSPENDED",
      accountStatus:"DISABLED",hasLearnerRole:false,hasActiveClass:false})).toEqual([
      "ENROLLMENT_INACTIVE","MEMBERSHIP_INACTIVE","ACCOUNT_INACTIVE","LEARNER_ROLE_MISSING","NO_ACTIVE_CLASS"]);
    expect(promotionLearnerBlockers({...valid,periodConfigured:false,hasActiveClass:false})).toEqual([]);
  });
  it("collegePromotionExecuteSchema requires confirmation, bounded counts, and optimistic version",()=>{
    const valid={cohortId:a,programId:b,expectedVersion:0,expectedCheckedLearners:1,
      expectedTargetTerm:2,expectedAcademicYearStart:2099,confirm:true,action:"PROMOTE"};
    expect(collegePromotionExecuteSchema.safeParse(valid).success).toBe(true);
    for(const change of [{confirm:false},{expectedVersion:-1},{expectedCheckedLearners:0},
      {expectedCheckedLearners:2001},{expectedTargetTerm:0},{action:"GRADUATE"},{collegeId:a}])
      expect(collegePromotionExecuteSchema.safeParse({...valid,...change}).success).toBe(false);
  });
  it("promotionReady and promotionPreviewMatches fail closed on any drift or incomplete simulation",()=>{
    const preview={simulatedReadiness:true,blockedLearners:0,completePreview:true,plan:{action:"PROMOTE"}};
    expect(promotionReady(preview)).toBe(true);
    for(const fail of [{simulatedReadiness:false},{blockedLearners:1},{completePreview:false},{plan:{action:"GRADUATE"}}])
      expect(promotionReady({...preview,...fail})).toBe(false);
    const expected={expectedCheckedLearners:2,expectedTargetTerm:3,expectedAcademicYearStart:2099};
    const actual={checkedLearners:2,plan:{targetTermNumber:3,academicYearStart:2099}};
    expect(promotionPreviewMatches(expected,actual)).toBe(true);
    expect(promotionPreviewMatches(expected,{...actual,checkedLearners:3})).toBe(false);
    expect(promotionPreviewMatches(expected,{...actual,plan:{...actual.plan,targetTermNumber:4}})).toBe(false);
    expect(promotionPreviewMatches(expected,{...actual,plan:{...actual.plan,academicYearStart:2098}})).toBe(false);
  });
  it("timestampTokenIso rejects invalid optimistic Date and serializes milliseconds",()=>{
    expect(timestampTokenIso(new Date("2099-01-01T00:00:00.123Z"))).toBe("2099-01-01T00:00:00.123Z");
    expect(()=>timestampTokenIso(new Date(NaN))).toThrow("Invalid concurrency timestamp");
  });
  const booking={sectionId:a,facultyMembershipId:b,date:"2099-01-14",from:"09:00",to:"10:00",
    title:"Practical",expectedSectionUpdatedAt:"2099-01-01T00:00:00+05:30",confirm:true};
  it("collegeHallBookingSchema rejects invalid IST dates, same/end-before-start times and missing confirmation",()=>{
    expect(collegeHallBookingSchema.safeParse(booking).success).toBe(true);
    for(const change of [{date:"2099-02-30"},{date:"2099-02-31"},{from:"10:00"},{to:"08:00"},
      {confirm:false},{expectedSectionUpdatedAt:"bad"},{facultyMembershipId:"unknown"},{collegeId:b}])
      expect(collegeHallBookingSchema.safeParse({...booking,...change}).success).toBe(false);
  });
  it("hallBookingWindow preserves IST offset; capacity and faculty eligibility fail closed",()=>{
    const window=hallBookingWindow({date:"2099-01-14",from:"09:00",to:"10:00"});
    expect(window.startsAt.toISOString()).toBe("2099-01-14T03:30:00.000Z");
    expect(window.endsAt.toISOString()).toBe("2099-01-14T04:30:00.000Z");
    expect(hallCanFitClass(60,60)).toBe(true);
    expect(hallCanFitClass(60,61)).toBe(false);
    expect(hallCanFitClass(60,null)).toBe(true);
    expect(hallFacultyIsEligible("ACTIVE","ACTIVE")).toBe(true);
    expect(hallFacultyIsEligible("DISABLED","ACTIVE")).toBe(false);
    expect(hallFacultyIsEligible("ACTIVE","SUSPENDED")).toBe(false);
  });
  it("collegeSectionLifecycleSchema enforces exact version, action and destructive confirmation",()=>{
    const valid={action:"ARCHIVE",expectedUpdatedAt:"2099-01-14T08:00:00+05:30",confirm:true};
    expect(collegeSectionLifecycleSchema.safeParse(valid).success).toBe(true);
    expect(collegeSectionLifecycleSchema.safeParse({...valid,action:"RESTORE"}).success).toBe(true);
    for(const change of [{action:"DELETE"},{confirm:false},{expectedUpdatedAt:"2099-01-14"},{expectedVersion:2}])
      expect(collegeSectionLifecycleSchema.safeParse({...valid,...change}).success).toBe(false);
    expect(classLifecyclePrompt("CSE-A","ARCHIVE")).toContain("Move enrolled students and unlink teaching");
    expect(classLifecyclePrompt("CSE-A","RESTORE")).toContain("Its cohort");
  });
  it("collegePreviewErrorLabel never reflects hostile internal response codes or stack traces",()=>{
    for(const value of [null,"SERVICE_KEY_EXPOSED",{error:"SQL stack token=secret"},{error:{stack:"secret"}}]){
      expect(collegePreviewErrorLabel(value)).toBe("The schedule preview could not be loaded");
    }
  });
  it("collegeStudyGroupCreateSchema validates bounded names, description and capacity",()=>{
    expect(collegeStudyGroupCreateSchema.parse({name:" Cohort ",description:"",capacity:null}).name).toBe("Cohort");
    for(const bad of [{name:" ",description:"",capacity:null},{name:"A",description:"",capacity:0},
      {name:"A",description:"",capacity:10001},{name:"A",description:"",capacity:null,tenantId:a}])
      expect(collegeStudyGroupCreateSchema.safeParse(bad).success).toBe(false);
  });
  it("collegeStudyGroupChangeSchema rejects stale versions and unsupported transitions",()=>{
    const edit={action:"EDIT",expectedVersion:0,name:"Team",description:"",capacity:20};
    expect(collegeStudyGroupChangeSchema.safeParse(edit).success).toBe(true);
    expect(collegeStudyGroupChangeSchema.safeParse({action:"STATUS",expectedVersion:2,transition:"CLOSE"}).success).toBe(true);
    expect(collegeStudyGroupChangeSchema.safeParse({...edit,expectedVersion:-1}).success).toBe(false);
    expect(collegeStudyGroupChangeSchema.safeParse({action:"STATUS",expectedVersion:0,transition:"DELETE"}).success).toBe(false);
  });
  it("studyGroupNextStatus enforces every allowed/forbidden lifecycle transition",()=>{
    expect(studyGroupNextStatus("DRAFT","ACTIVATE",0,0)).toBe("ACTIVE");
    expect(studyGroupNextStatus("CLOSED","ACTIVATE",0,0)).toBe("ACTIVE");
    expect(studyGroupNextStatus("ACTIVE","CLOSE",0,0)).toBe("CLOSED");
    expect(studyGroupNextStatus("DRAFT","ARCHIVE",0,0)).toBe("ARCHIVED");
    expect(studyGroupNextStatus("CLOSED","ARCHIVE",0,0)).toBe("ARCHIVED");
    expect(studyGroupNextStatus("ACTIVE","ARCHIVE",0,0)).toBeNull();
    expect(studyGroupNextStatus("DRAFT","ARCHIVE",1,0)).toBeNull();
    expect(studyGroupNextStatus("CLOSED","ARCHIVE",0,1)).toBeNull();
    expect(studyGroupNextStatus("ARCHIVED","ACTIVATE",0,0)).toBeNull();
  });
  it("studyGroupConflictMessage maps known conflicts but hides unknown raw codes",()=>{
    for(const code of ["GROUP_NAME_TAKEN","GROUP_STALE","GROUP_HAS_MEMBERS","GROUP_TRANSITION_INVALID","GROUP_NOT_MANAGEABLE","GROUP_NOT_FOUND"])
      expect(studyGroupConflictMessage(code)).not.toContain(code);
    expect(studyGroupConflictMessage("SQL_DATABASE_PANIC")).toBe("Unable to save this group. Review the details or refresh the list.");
  });
  const waitlist={accountStatus:"ACTIVE",membershipStatus:"ACTIVE",state:"WAITLISTED",memberType:"LEARNER",
    locked:false,memberVersion:1,expectedMemberVersion:1,firstInQueue:true,capacity:5,activeCount:3};
  it("collegeWaitlistPromotionBlocker rejects wrong role/tenant readiness, concurrency and queue jump",()=>{
    expect(collegeWaitlistPromotionBlocker(waitlist)).toBeNull();
    for(const change of [{accountStatus:"DISABLED"},{membershipStatus:"SUSPENDED"},
      {state:"ACTIVE"},{memberType:"STAFF"},{locked:true}])
      expect(collegeWaitlistPromotionBlocker({...waitlist,...change})).toBe("MEMBER_NOT_FOUND");
    expect(collegeWaitlistPromotionBlocker({...waitlist,expectedMemberVersion:0})).toBe("MEMBER_STALE");
    expect(collegeWaitlistPromotionBlocker({...waitlist,firstInQueue:false})).toBe("WAITLIST_OUT_OF_ORDER");
    expect(collegeWaitlistPromotionBlocker({...waitlist,capacity:3})).toBe("GROUP_CAPACITY_FULL");
    expect(collegeWaitlistPromotionBlocker({...waitlist,capacity:null})).toBeNull();
  });
  it("collegeGroupDetailWriteSchema requires version and confirmation for promotion and rules",()=>{
    const promote={action:"PROMOTE_WAITLIST",memberId:a,expectedGroupVersion:0,expectedMemberVersion:0,confirm:true};
    expect(collegeGroupDetailWriteSchema.safeParse(promote).success).toBe(true);
    expect(collegeGroupDetailWriteSchema.safeParse({...promote,confirm:false}).success).toBe(false);
    expect(collegeGroupDetailWriteSchema.safeParse({...promote,expectedMemberVersion:-1}).success).toBe(false);
    expect(collegeGroupDetailActionLabel("PROMOTE_WAITLIST")).toContain("first waitlisted learner");
    expect(collegeGroupDetailActionLabel("SAVE_RULE")).toContain("does not immediately refresh members");
  });
  it("collegeStudyMemberSchema and label cover guarded removal/locking and wrong action",()=>{
    const add={action:"ADD" as const,membershipId:a};
    expect(collegeStudyMemberSchema.safeParse(add).success).toBe(true);
    expect(collegeStudyMemberSchema.safeParse({action:"REMOVE_AND_LOCK",membershipId:a,expectedVersion:1,confirm:true}).success).toBe(true);
    expect(collegeStudyMemberSchema.safeParse({action:"REMOVE_AND_LOCK",membershipId:a,expectedVersion:1}).success).toBe(false);
    expect(collegeStudyMemberSchema.safeParse({action:"DELETE",membershipId:a}).success).toBe(false);
    expect(collegeStudyMemberLabel(add)).toBe("Add learner to study group?");
    expect(collegeStudyMemberLabel({action:"REMOVE",membershipId:a})).toBe("Remove this group member?");
    expect(collegeStudyMemberLabel({action:"REMOVE_AND_LOCK",membershipId:a,expectedVersion:1,confirm:true})).toBe("Remove and lock this learner?");
    expect(collegeStudyMemberLabel({action:"LOCK",membershipId:a,locked:false})).toBe("Unlock group member?");
  });
  it("groupRuleCriteriaSchema rejects catch-all/unknown and evaluator fails closed on missing evidence",()=>{
    expect(groupRuleCriteriaSchema.safeParse({}).success).toBe(false);
    expect(groupRuleCriteriaSchema.safeParse({minCgpa:7,foreignCollegeId:a}).success).toBe(false);
    const criteria=groupRuleCriteriaSchema.parse({allowedProgramIds:[a],minCgpa:7,maxActiveBacklogs:0});
    const eligible={programId:a,cohortId:b,cgpaHundredths:701,activeBacklogs:0,passingYear:2099};
    expect(matchesGroupRuleCandidate(criteria,eligible)).toBe(true);
    expect(matchesGroupRuleCandidate(criteria,{...eligible,programId:b})).toBe(false);
    expect(matchesGroupRuleCandidate(criteria,{...eligible,cgpaHundredths:null})).toBe(false);
    expect(matchesGroupRuleCandidate(criteria,{...eligible,activeBacklogs:1})).toBe(false);
  });
  it("projectCollegeGroupRulePreview counts matched, active and new without claiming completeness",()=>{
    const criteria=groupRuleCriteriaSchema.parse({allowedProgramIds:[a]});
    const candidates=[{membershipId:"A",programId:a,cohortId:b,cgpaHundredths:null,activeBacklogs:null,passingYear:null},
      {membershipId:"B",programId:a,cohortId:b,cgpaHundredths:null,activeBacklogs:null,passingYear:null},
      {membershipId:"C",programId:b,cohortId:b,cgpaHundredths:null,activeBacklogs:null,passingYear:null}];
    expect(projectCollegeGroupRulePreview(criteria,candidates,new Set(["A"]),true)).toEqual({
      examined:3,matched:2,alreadyActive:1,potentiallyNew:1,incomplete:true,
    });
    expect(collegeRulePreviewInputSchema.safeParse({groupId:a}).success).toBe(true);
    expect(collegeRulePreviewInputSchema.safeParse({groupId:a,tenantId:b}).success).toBe(false);
  });
});
