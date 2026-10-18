import {beforeEach,describe,expect,it,vi} from "vitest";
import type {RequestContext} from "@/modules/identity/context";
import {getFacultyPublishedGradebook,getFacultyPublishedGradebookLearner}
  from "@/modules/courses/faculty-gradebook-service";
import {CoursesServiceError} from "@/modules/courses/errors";

const deliveryId="11111111-1111-4111-8111-111111111111";
const foreignDelivery="22222222-2222-4222-8222-222222222222";
const learnerId="33333333-3333-4333-8333-333333333333";
const foreignLearner="44444444-4444-4444-8444-444444444444";
const collegeId="55555555-5555-4555-8555-555555555555";
const organizationId="66666666-6666-4666-8666-666666666666";

const state=vi.hoisted(()=>({
  rosterCalls:0,overviewCalls:0,reportCalls:0,
  publishedAssignments:[] as Array<{id:string;deliveryId:string;status:string;
    title:string;maxPoints:number}>,
  publishedQuizzes:[] as Array<{id:string;deliveryId:string;status:string;
    title:string}>,
  submissions:[] as Array<{membershipId:string;gradingStatus:string;
    gradePublished:boolean;pointsAwarded:number|null}>,
  quizResultsPublished:false,
  attempts:[] as Array<{membershipId:string;score:number;maxScore:number}>,
}));
vi.mock("server-only",()=>({}));
vi.mock("@/modules/attendance/faculty-service",()=>({
  getFacultyDeliveryRoster:async(_context:unknown,id:string)=>{
    state.rosterCalls++;
    if(id!==deliveryId)throw new CoursesServiceError("FACULTY_TEACHING_SCOPE_REQUIRED");
    return {delivery:{id,courseName:"Algorithms",sectionName:"A"},
      roster:[{membershipId:learnerId,displayName:"Anu",
        email:"private@example.invalid",rollNumber:"A01"}]};
  },
}));
vi.mock("@/modules/courses/faculty-assessment-service",()=>({
  getFacultyAssessmentOverview:async()=>{
    state.overviewCalls++;
    return {assignments:state.publishedAssignments,quizzes:state.publishedQuizzes};
  },
}));
vi.mock("@/modules/courses/faculty-assessment-report-service",()=>({
  getFacultyAssignmentReport:async()=>{
    state.reportCalls++;
    return {submissions:state.submissions};
  },
  getFacultyQuizReport:async()=>{
    state.reportCalls++;
    return {quiz:{resultsPublished:state.quizResultsPublished},
      latestAttempts:state.attempts};
  },
}));

function actor():RequestContext{
  return {user:{id:"77777777-7777-4777-8777-777777777777",
    identityUid:"faculty",platformStatus:"ACTIVE",systemRoles:[]},
    membership:{id:"88888888-8888-4888-8888-888888888888",
      collegeId,organizationId,status:"ACTIVE",roles:["FACULTY"]}};
}

describe("chat-3 Faculty gradebook service account journeys (mocked dependency boundaries)",()=>{
  beforeEach(()=>{
    state.rosterCalls=0;state.overviewCalls=0;state.reportCalls=0;
    state.publishedAssignments=[];
    state.publishedQuizzes=[];
    state.submissions=[];
    state.quizResultsPublished=false;
    state.attempts=[];
  });

  it("FAC-attendance-grades-01 denies expired, suspended and wrong-role sessions before roster reads",async()=>{
    for(const change of [
      (c:RequestContext)=>{c.user.platformStatus="SUSPENDED";},
      (c:RequestContext)=>{c.membership!.status="SUSPENDED";},
      (c:RequestContext)=>{c.membership!.roles=["MENTOR"];},
      (c:RequestContext)=>{c.membership=null;},
    ]){
      const context=actor();change(context);
      await expect(getFacultyPublishedGradebook(context,{deliveryId})).rejects.toThrow();
      expect(state.rosterCalls).toBe(0);
    }
  });

  it("FAC-attendance-grades-01 wrong delivery is rejected, not silently replaced by faculty's first Section",async()=>{
    await expect(getFacultyPublishedGradebook(actor(),{deliveryId:foreignDelivery}))
      .rejects.toMatchObject({code:"FACULTY_TEACHING_SCOPE_REQUIRED"});
    expect(state.overviewCalls).toBe(0);
  });

  it("FAC-attendance-grades-01 publication is authoritative; cross-delivery records and private grades are absent",async()=>{
    state.publishedAssignments=[
      {id:"a1",deliveryId,status:"PUBLISHED",title:"Assignment",maxPoints:10},
      {id:"a2",deliveryId:foreignDelivery,status:"PUBLISHED",title:"Other Section",maxPoints:10},
    ];
    state.submissions=[
      {membershipId:learnerId,gradingStatus:"GRADED",gradePublished:false,pointsAwarded:9},
      {membershipId:foreignLearner,gradingStatus:"GRADED",gradePublished:true,pointsAwarded:10},
    ];
    state.publishedQuizzes=[
      {id:"q1",deliveryId,status:"PUBLISHED",title:"Quiz"},
    ];
    state.quizResultsPublished=false;
    state.attempts=[{membershipId:learnerId,score:10,maxScore:10}];
    const result=await getFacultyPublishedGradebook(actor(),{deliveryId});
    expect(result.publishedAssessments).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toMatchObject({
      membershipId:learnerId,earned:null,gradedCount:0,hasUnknown:true,
    });
    expect(JSON.stringify(result)).not.toContain(foreignLearner);
    expect(state.reportCalls).toBe(2);
  });

  it("FAC-attendance-grades-01 detail refuses guessed student membership and preserves privacy",async()=>{
    await expect(getFacultyPublishedGradebookLearner(actor(),{
      deliveryId,learnerMembershipId:foreignLearner,
    })).rejects.toMatchObject({code:"MEMBERSHIP_NOT_FOUND"});
  });

  it("FAC-attendance-grades-01 bounded report fails safely before 101 report lookups",async()=>{
    state.publishedAssignments=Array.from({length:101},(_,i)=>({
      id:"a"+i,deliveryId,status:"PUBLISHED",title:"Task "+i,maxPoints:10,
    }));
    await expect(getFacultyPublishedGradebook(actor(),{deliveryId}))
      .rejects.toMatchObject({code:"FACULTY_GRADEBOOK_TOO_MANY_ASSESSMENTS"});
    expect(state.reportCalls).toBe(0);
  });
});
