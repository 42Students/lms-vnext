import {describe,expect,it} from "vitest";
import {ownApplicationInterviewLinks,type OwnApplicationInterviewRound} from "@/modules/placements/learner-application-interview-links-model";
import {
  learnerRoundScheduledInstant,learnerRoundUrgency,browseLearnerCareerRounds,
  type LearnerRoundBrowseFilters,type LearnerRoundBrowseSource,
} from "@/modules/placements/learner-rounds-browse-model";
import {
  learnerInterviewScheduleViewSchema,learnerInterviewScheduleCounts,
  learnerInterviewViewHref,
} from "@/modules/placements/learner-interview-view-model";
import {
  recruiterResultTableQuerySchema,projectRecruiterRoundResults,recruiterResultTableHref,
} from "@/modules/placements/recruiter-round-results-read-model";

const now=Date.parse("2099-07-04T04:30:00.000Z");
const learnerRound=(id:string,kind:string,time:string|null,exception?:string):LearnerRoundBrowseSource=>({
  applicationId:"app-"+id,roundId:id,roundKind:kind,roundName:"Round "+id,
  companyName:id==="b"?"Zeta Systems":"Alpha Systems",
  roleTitle:"Software engineer",scheduledAt:time,
  exception:exception?{scheduledAt:exception}:null,
});
const base: LearnerRoundBrowseFilters={
  search:"",time:"all",urgency:"all",sort:"soonest",
};

describe("chat-2 learner interview and recruiter round model evidence",()=>{
  it("LNR-interviews-01 selects the nearest upcoming actual interview per authorized application and escapes IDs",()=>{
    const rounds:OwnApplicationInterviewRound[]=[
      {applicationId:"app/one",roundId:"early",roundKind:"INTERVIEW",scheduledAt:"2099-07-01T04:00:00Z",exception:null},
      {applicationId:"app/one",roundId:"later",roundKind:"INTERVIEW",scheduledAt:"2099-07-06T04:00:00Z",exception:null},
      {applicationId:"app/one",roundId:"priority &",roundKind:"GD",scheduledAt:"2099-07-05T04:00:00Z",exception:null},
      {applicationId:"app/one",roundId:"test",roundKind:"TEST",scheduledAt:"2099-07-04T04:00:00Z",exception:null},
      {applicationId:"app/two",roundId:"one",roundKind:"INTERVIEW",scheduledAt:null,exception:{scheduledAt:"2099-07-04T05:00:00Z"}},
    ];
    const before=structuredClone(rounds);
    const results=ownApplicationInterviewLinks(rounds,"2099-07-04T04:30:00Z");
    expect(results).toEqual([
      {applicationId:"app/one",href:"/learn/my-placements/interviews?applicationId=app%2Fone&roundId=priority%20%26"},
      {applicationId:"app/two",href:"/learn/my-placements/interviews?applicationId=app%2Ftwo&roundId=one"},
    ]);
    expect(rounds).toEqual(before);
    expect(ownApplicationInterviewLinks([
      {...rounds[0]!,roundKind:"TEST"},
    ],"2099-07-04T04:30:00Z")).toEqual([]);
  });

  it("LNR-interviews-02 respects exception schedule, IST today, future, past and unknown instead of inferring outcomes",()=>{
    const today=learnerRound("today","INTERVIEW","2099-07-04T06:00:00Z");
    const changed=learnerRound("updated","GD","2099-07-06T05:00:00Z","2099-07-04T05:15:00Z");
    const upcoming=learnerRound("week","INTERVIEW","2099-07-05T04:30:00Z");
    const past=learnerRound("past","INTERVIEW","2099-07-03T04:00:00Z");
    const unscheduled=learnerRound("none","INTERVIEW",null);
    expect(learnerRoundScheduledInstant(changed)).toBe(Date.parse("2099-07-04T05:15:00Z"));
    expect(learnerRoundScheduledInstant(unscheduled)).toBeNull();
    expect(learnerRoundUrgency(today,now)).toBe("today");
    expect(learnerRoundUrgency(changed,now)).toBe("today");
    expect(learnerRoundUrgency(upcoming,now)).toBe("week");
    expect(learnerRoundUrgency(past,now)).toBe("past");
    expect(learnerRoundUrgency(unscheduled,now)).toBe("unscheduled");
    expect(learnerInterviewScheduleCounts([today,changed,upcoming,past,unscheduled],now))
      .toEqual({all:5,upcoming:3,past:1,unscheduled:1});
  });

  it("LNR-interviews-03 sorts predictably with search, time, urgency, employer type, and never mutates scope",()=>{
    const rows=[
      learnerRound("z","TEST","2099-07-05T04:30:00Z"),
      learnerRound("a","INTERVIEW","2099-07-04T05:00:00Z"),
      learnerRound("b","GD","2099-07-04T08:00:00Z"),
      learnerRound("c","VENDOR_TEST",null),
      learnerRound("d","INTERVIEW",null),
    ];
    const snapshot=structuredClone(rows);
    expect(browseLearnerCareerRounds(rows,"INTERVIEW",base,now).map(row=>row.roundId))
      .toEqual(["a","b","d"]);
    expect(browseLearnerCareerRounds(rows,"ASSESSMENT",base,now).map(row=>row.roundId))
      .toEqual(["z","c"]);
    expect(browseLearnerCareerRounds(rows,"CALENDAR",{...base,time:"unscheduled"},now).map(row=>row.roundId))
      .toEqual(["c","d"]);
    expect(browseLearnerCareerRounds(rows,"INTERVIEW",{...base,urgency:"today"},now).map(row=>row.roundId))
      .toEqual(["a","b"]);
    expect(browseLearnerCareerRounds(rows,"INTERVIEW",{...base,search:"ZETA",sort:"company"},now).map(row=>row.roundId))
      .toEqual(["b"]);
    expect(rows).toEqual(snapshot);
  });

  it("LNR-interviews-04 retains unrelated query and fragments on view switches without external navigation",()=>{
    expect(learnerInterviewScheduleViewSchema.safeParse("unknown").success).toBe(false);
    expect(learnerInterviewScheduleViewSchema.safeParse("upcoming").success).toBe(true);
    expect(learnerInterviewViewHref("/learn/my-placements/interviews?tab=slots#my-sessions","past"))
      .toBe("/learn/my-placements/interviews?tab=slots&view=past#my-sessions");
    expect(learnerInterviewViewHref("/learn/my-placements/interviews?view=past&tab=slots","all"))
      .toBe("/learn/my-placements/interviews?tab=slots");
  });

  it("HR-results-01 validates filter/IDs before scoped table lookups and never trusts arbitrary tenant params",()=>{
    const valid="11111111-1111-4111-8111-111111111111";
    expect(recruiterResultTableQuerySchema.parse({jobId:valid,roundId:valid}).outcome).toBe("ALL");
    for(const raw of [
      {jobId:"../../other"},
      {jobId:valid,collegeId:valid},
      {outcome:"APPROVED"},
      {roundId:"not a uuid"},
    ])expect(recruiterResultTableQuerySchema.safeParse(raw).success).toBe(false);
  });

  it("HR-results-02 marks unrecorded participants honestly and filters only the chosen round without PII",()=>{
    const rounds=[{
      id:"one",name:"Technical",sequence:1,kind:"INTERVIEW",status:"SCHEDULED",
      participants:[
        {applicationId:"a",displayName:"  Dev  ",result:{status:"APPLIED",outcome:"PASS",scorePercent:80,waitlistRank:null}},
        {applicationId:"b",displayName:null,result:null},
        {applicationId:"c",displayName:"",result:{status:"STAGED",outcome:"HOLD",scorePercent:null,waitlistRank:1}},
      ],
    }];
    expect(projectRecruiterRoundResults(rounds,"other","ALL")).toBeNull();
    const result=projectRecruiterRoundResults(rounds,"one","ALL");
    expect(result?.counts).toEqual({all:3,recorded:2,unrecorded:1,pass:1,fail:0,hold:1,absent:0});
    expect(result?.rows.map(r=>r.name)).toEqual(["Dev","Candidate","Candidate"]);
    expect(projectRecruiterRoundResults(rounds,"one","UNRECORDED")?.rows).toEqual([
      {key:"b",name:"Candidate",outcome:null,status:"UNRECORDED",scorePercent:null,waitlistRank:null},
    ]);
    expect(projectRecruiterRoundResults(rounds,"one","HOLD")?.rows.map(row=>row.key)).toEqual(["c"]);
  });

  it("HR-results-03 produces scoped, encoded drilldowns and omits ALL filter noise",()=>{
    expect(recruiterResultTableHref({jobId:"a/b",roundId:"round & 1",outcome:"FAIL"}))
      .toBe("/hr/round-results?jobId=a%2Fb&roundId=round+%26+1&outcome=FAIL");
    expect(recruiterResultTableHref({jobId:"a/b",outcome:"ALL"}))
      .toBe("/hr/round-results?jobId=a%2Fb");
  });
});
