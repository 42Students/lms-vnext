import { describe, expect, it } from "vitest";
import { hrInterviewSlotCreateSchema, hrInterviewSlotActionSchema,slotTransitionAllowed,
  slotsOverlap,parseIstLocalSlot,canRecruiterMutateOwnSlot }
  from "@/modules/placements/hr-interview-slot-model";
import { hrScheduledRoundRows,hrRoundConflictLabels,hrRoundConflictLinks }
  from "@/modules/placements/hr-round-schedule-model";
import { hrNextCalendarEvent } from "@/modules/placements/hr-calendar-next-event-model";
import { hrResultDeadlineUrgency } from "@/modules/placements/hr-result-deadline-urgency-model";
import { groupHrNotificationPage } from "@/modules/placements/hr-notification-groups-model";
import { buildHrOfferCsv,HR_OFFER_EXPORT_CAP } from "@/modules/placements/hr-offer-export-model";
import { hrRecruiterReplySchema } from "@/modules/placements/hr-conversation-reply-model";
import { recruiterReviewNoteSchema } from "@/modules/placements/hr-review-note-model";
import { hrTeamSearchSchema,searchHrTeam } from "@/modules/placements/hr-team-search-model";
import { nextHrProposalAttempt } from "@/modules/placements/hr-drive-proposal-attempt-model";
import { emptyHrDriveDraft } from "@/modules/placements/hr-drive-draft-model";
import { reorderHrDraftRound } from "@/modules/placements/hr-draft-round-order-model";
import { duplicateHrDraftRound } from "@/modules/placements/hr-draft-round-duplicate-model";
import { hrDraftContainsWork } from "@/modules/placements/hr-draft-reset-model";

const roundId="123e4567-e89b-12d3-a456-426614174000";
const secondId="123e4567-e89b-12d3-a456-426614174001";
const start="2099-01-01T10:00:00+05:30";
const end="2099-01-01T11:00:00+05:30";
const baseSlot={roundId,startAt:start,endAt:end,timezone:"Asia/Kolkata",mode:"VIRTUAL",capacity:"2"};

describe("HR interview slots, rounds, offers, messaging and drafts chat-15",()=>{
 it("HR-slot-create accepts valid IST schedule with integer capacity and no extra fields",()=>{
  const parsed=hrInterviewSlotCreateSchema.safeParse(baseSlot);
  expect(parsed.success).toBe(true);
  if(parsed.success){expect(parsed.data.capacity).toBe(2);expect(parsed.data.endAt.getTime()-parsed.data.startAt.getTime()).toBe(3600000);}
 });
 it.each([
  {...baseSlot,startAt:end,endAt:start},
  {...baseSlot,startAt:"2099-01-01T01:00:00+05:30",endAt:"2099-01-01T10:00:01+05:30"},
  {...baseSlot,timezone:"UTC"},
  {...baseSlot,capacity:0},
  {...baseSlot,capacity:101},
  {...baseSlot,capacity:"0"},
  {...baseSlot,mode:"UNLISTED"},
  {...baseSlot,roundId:"not-uuid"},
  {...baseSlot,panelLabel:"Admin\nPanel"},
  {...baseSlot,malicious:"unrecognized"},
 ])("HR-slot-create denies inverted/long/invalid/cross-field requests %#",input=>{
  expect(hrInterviewSlotCreateSchema.safeParse(input).success).toBe(false);
 });
 it("HR-slot-action needs a positive optimistic version and a permitted action",()=>{
  expect(hrInterviewSlotActionSchema.safeParse({slotId:roundId,expectedVersion:"1",action:"BOOK"}).success).toBe(true);
  for(const input of [{slotId:roundId,expectedVersion:0,action:"BOOK"},
    {slotId:roundId,expectedVersion:1,action:"DELETE"},
    {slotId:"invalid",expectedVersion:1,action:"CANCEL"}]){
    expect(hrInterviewSlotActionSchema.safeParse(input).success).toBe(false);
  }
 });
 it.each([
  ["PROPOSED","OFFER",0,1,true],
  ["PROPOSED","BOOK",0,1,false],
  ["PROPOSED","CANCEL",0,1,true],
  ["OFFERED","BOOK",0,1,true],
  ["OFFERED","BOOK",1,1,false],
  ["OFFERED","CANCEL",1,1,true],
  ["BOOKED","BOOK",0,2,true],
  ["BOOKED","BOOK",2,2,false],
  ["CANCELLED","BOOK",0,2,false],
  ["OFFERED","BOOK",-1,2,false],
  ["OFFERED","BOOK",3,2,false],
  ["OFFERED","BOOK",0,0,false],
 ] as const)("HR-slot-transition enforces state and capacity for %#",
  (status,action,bookedCount,capacity,expected)=>{
    expect(slotTransitionAllowed(status,action,bookedCount,capacity)).toBe(expected);
  });
 it("HR-slot-overlap uses half-open intervals, rejects corrupt time and checks owner",()=>{
  const a={startAt:new Date("2099-01-01T08:00:00Z"),endAt:new Date("2099-01-01T09:00:00Z")};
  const b={startAt:new Date("2099-01-01T09:00:00Z"),endAt:new Date("2099-01-01T10:00:00Z")};
  expect(slotsOverlap(a,b)).toBe(false);
  expect(slotsOverlap(a,{...b,startAt:new Date("2099-01-01T08:59:59Z")})).toBe(true);
  expect(slotsOverlap({...a,endAt:a.startAt},b)).toBe(true);
  expect(canRecruiterMutateOwnSlot("owner","owner")).toBe(true);
  expect(canRecruiterMutateOwnSlot("owner","other")).toBe(false);
  expect(canRecruiterMutateOwnSlot("","")).toBe(false);
 });
 it("HR-slot-IST rejects impossible calendar days and preserves exact IST input",()=>{
  expect(parseIstLocalSlot("2099-01-01T10:30")).toBe("2099-01-01T10:30:00+05:30");
  expect(()=>parseIstLocalSlot("2099-02-29T10:30")).toThrow();
  expect(()=>parseIstLocalSlot("2099-01-01T10:30Z")).toThrow();
 });
 it("HR-round-schedule returns only valid scheduled rows, detects overlap and deep links to current job",()=>{
  const rows=hrScheduledRoundRows([
    {id:roundId,name:"Interview",sequence:1,status:"SCHEDULED",
      scheduledAt:new Date("2099-01-01T08:00:00Z"),durationMinutes:60,mode:"VIRTUAL",venue:null},
    {id:secondId,name:"Technical",sequence:2,status:"COMPLETED",
      scheduledAt:new Date("2099-01-01T08:30:00Z"),durationMinutes:45,mode:"VIRTUAL",venue:null},
    {id:"hidden",name:"Draft",sequence:3,status:"PENDING",
      scheduledAt:new Date("2099-01-01T08:30:00Z"),durationMinutes:30,mode:null,venue:null},
  ]);
  expect(rows).toHaveLength(3); // A timed PENDING round remains visible in the legacy calendar.
  expect(rows[0]?.conflicts).toEqual([secondId,"hidden"]);
  expect(rows[1]?.conflicts).toEqual([roundId,"hidden"]);
  expect(rows[2]?.conflicts).toEqual([roundId,secondId]);
  expect(hrRoundConflictLabels(rows,[secondId,"missing"])).toEqual(["Technical (#2)"]);
  expect(hrRoundConflictLinks(rows,[roundId],secondId)).toEqual([{
    id:roundId,label:"Interview (#1)",
    href:"/hr/placements/jobs/"+secondId+"?tab=rounds&roundId="+roundId,
  }]);
 });
 it("HR-calendar-next selects earliest permitted event and deadline with no past events",()=>{
  const now=new Date("2099-01-01T08:00:00Z");
  const events=[
    {kind:"ROUND",title:"Later interview",startsAt:new Date("2099-01-01T12:00:00Z")},
    {kind:"APPLICATION_DEADLINE",title:"Apply by",startsAt:new Date("2099-01-01T10:00:00Z")},
    {kind:"ROUND",title:"Past interview",startsAt:new Date("2098-01-01T12:00:00Z")},
  ];
  const due=[{roundName:"Round 1",dueAt:new Date("2099-01-01T09:00:00Z")}];
  expect(hrNextCalendarEvent(events,due,"ALL",now)?.title).toBe("Results due: Round 1");
  expect(hrNextCalendarEvent(events,due,"ROUNDS",now)?.title).toBe("Later interview");
  expect(hrNextCalendarEvent(events,due,"DEADLINES",now)?.title).toBe("Apply by");
  expect(hrNextCalendarEvent(events,due,"SLOTS",now)).toBeNull();
 });
 it("HR-result-deadline classifies passed, exactly 24h and future",()=>{
  const now=new Date("2099-01-01T00:00:00Z");
  expect(hrResultDeadlineUrgency(new Date("2098-12-31T23:59:59Z"),now)).toBe("PASSED");
  expect(hrResultDeadlineUrgency(new Date("2099-01-02T00:00:00Z"),now)).toBe("WITHIN_24H");
  expect(hrResultDeadlineUrgency(new Date("2099-01-02T00:00:01Z"),now)).toBe("UPCOMING");
 });
 it("HR-notice-group groups by drive and counts only unread records",()=>{
  expect(groupHrNotificationPage([
    {id:"1",jobId:"job-a",title:"First",unread:true},
    {id:"2",jobId:"job-b",title:"Second",unread:false},
    {id:"3",jobId:"job-a",title:"First",unread:false},
  ])).toMatchObject([{jobId:"job-a",unread:1,items:[{id:"1"},{id:"3"}]},
    {jobId:"job-b",unread:0,items:[{id:"2"}]}]);
 });
 it("HR-offer-export is capped, masks contacts and neutralizes CSV formula cells",()=>{
  const rows=Array.from({length:201},(_,i)=>({
    id:"offer-"+i,name:i===0?"=HYPERLINK(\"https://attacker.example\")":"Applicant",
    role:"Engineer",status:"ISSUED",annualCtcInr:900000,issuedAt:new Date("2099-01-01T00:00:00Z"),
    expiresAt:null,joiningDate:null,joiningStatus:null,
  }));
  const r=buildHrOfferCsv(rows,201);
  expect(r.exported).toBe(HR_OFFER_EXPORT_CAP);
  expect(r.omitted).toBe(1);
  expect(r.csv.startsWith("\uFEFF")).toBe(true);
  expect(r.csv).toContain("Masked");
  expect(r.csv).toContain("'=HYPERLINK");
  expect(r.csv).toContain("1 additional authorized offers");
 });
 it("HR-message-reply and review notes reject empty, oversized, unsupported and invalid versions",()=>{
  expect(hrRecruiterReplySchema.safeParse({threadId:roundId,body:" Reply "}).success).toBe(true);
  expect(hrRecruiterReplySchema.safeParse({threadId:roundId,body:" "}).success).toBe(false);
  expect(hrRecruiterReplySchema.safeParse({threadId:roundId,body:"x".repeat(4001)}).success).toBe(false);
  expect(hrRecruiterReplySchema.safeParse({threadId:roundId,body:"x",extra:"bad"}).success).toBe(false);
  expect(recruiterReviewNoteSchema.safeParse({applicationId:roundId,rating:5,note:"Clear review",version:0}).success).toBe(true);
  expect(recruiterReviewNoteSchema.safeParse({applicationId:roundId,rating:6,note:"Clear review",version:0}).success).toBe(false);
  expect(recruiterReviewNoteSchema.safeParse({applicationId:roundId,rating:3,note:"Clear review",version:-1}).success).toBe(false);
 });
 it("HR-team-search is trimmed, case-insensitive and retains stable roster order",()=>{
  const rows=[
    {displayName:"Alpha",title:"Manager",email:"alpha@example.com"},
    {displayName:"Beta",title:"Recruiter",email:"beta@example.com"},
    {displayName:null,title:null,email:null},
  ];
  expect(hrTeamSearchSchema.safeParse("x".repeat(121)).success).toBe(false);
  expect(searchHrTeam(rows,"")).toEqual(rows);
  expect(searchHrTeam(rows," manager ")).toEqual([rows[0]]);
  expect(searchHrTeam(rows,"BETA@EXAMPLE.COM")).toEqual([rows[1]]);
 });
 it("HR-draft-proposal reuses id for same submission and rotates on edits",()=>{
  let count=0;
  const generate=()=>String(++count);
  const initial=nextHrProposalAttempt(null,"stable",generate);
  expect(nextHrProposalAttempt(initial,"stable",generate)).toBe(initial);
  expect(nextHrProposalAttempt(initial,"edited",generate)).toEqual({signature:"edited",submissionId:"2"});
 });
 it("HR-draft-rounds reorder and duplicate immutably, enforce boundaries and preserve drafts",()=>{
  const draft={...emptyHrDriveDraft(),rounds:[
    {kind:"TALK" as const,name:"Introduction"},
    {kind:"INTERVIEW" as const,name:"Interview"},
  ]};
  expect(hrDraftContainsWork(emptyHrDriveDraft())).toBe(false);
  expect(hrDraftContainsWork({...draft,title:"Engineer"})).toBe(true);
  expect(reorderHrDraftRound(draft,0,-1)).toBe(draft);
  expect(reorderHrDraftRound(draft,0,1).rounds[0]?.name).toBe("Interview");
  expect(draft.rounds[0]?.name).toBe("Introduction");
  expect(duplicateHrDraftRound(draft,1).rounds[2]?.name).toBe("Interview (copy)");
  expect(duplicateHrDraftRound(draft,-1)).toBe(draft);
 });
});
