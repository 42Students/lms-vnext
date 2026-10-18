import {describe,expect,it} from "vitest";
import {mentorSprintCreateSchema,isValidMentorSprintTransition,mentorSprintTransitionSchema} from "@/modules/projects/mentor-sprint-write-model";
import {mentorSprintDetailsSchema,sprintDetailsChanged} from "@/modules/projects/mentor-sprint-details-model";
import {mentorTaskCreateSchema} from "@/modules/projects/mentor-task-create-model";
import {mentorTaskDetailsInputSchema,taskDetailsChangedFields} from "@/modules/projects/mentor-task-details-model";
import {mentorMeetingRescheduleSchema,mentorMeetingCanReschedule,toIstLocalInput,fromIstLocalInput} from "@/modules/projects/mentor-meeting-reschedule-model";
import {mentorResourceDirectoryQuerySchema,mentorResourceDirectory,mentorResourceDirectoryHref,safeHttpsResourceUrl,parseMentorResourceDirectorySearch,mentorResourceDirectoryCsv} from "@/modules/projects/mentor-resource-directory-model";
import {projectReviewCompleteness,reviewCompletenessPage,mentorReviewCompletenessHref} from "@/modules/projects/mentor-review-completeness-model";

const projectId="123e4567-e89b-42d3-a456-426614174000";
const releaseId="123e4567-e89b-42d3-a456-426614174001";
const instant="2099-01-01T00:00:00.000Z";
const task={title:"Audit login",description:null,acceptanceCriteria:null,priority:"HIGH",sprintId:null,expectedSprintUpdatedAt:null};
const sprint={releaseId,title:"Sprint 1",description:null,goal:null,definitionOfDone:null,startDate:"2099-01-01",endDate:"2099-01-02",dueDate:null};
const details={title:"Task",description:null,acceptanceCriteria:null,priority:"HIGH",expectedUpdatedAt:instant};
const resource=(id:string,title:string,required:boolean,url:string|null,description:string|null,sequence:number)=>({id,title,required,url,description,sequence});

describe("chat-14 mentor sprint, task and resource behaviour ledger",()=>{
  it("validates sprint creation date ordering, title limits and unknown input fields",()=>{
    expect(mentorSprintCreateSchema.safeParse(sprint).success).toBe(true);
    expect(mentorSprintCreateSchema.safeParse({...sprint,endDate:"2098-12-31"}).success).toBe(false);
    expect(mentorSprintCreateSchema.safeParse({...sprint,title:"  "}).success).toBe(false);
    expect(mentorSprintCreateSchema.safeParse({...sprint,title:"x".repeat(201)}).success).toBe(false);
    expect(mentorSprintCreateSchema.safeParse({...sprint,collegeId:projectId}).success).toBe(false);
  });
  it("accepts only the planned-start, active-complete and completed-reopen sprint lifecycle",()=>{
    for(const [before,action] of [["PLANNED","START"],["ACTIVE","COMPLETE"],["COMPLETED","REOPEN"]]){
      expect(isValidMentorSprintTransition(before,action)).toBe(true);
      expect(mentorSprintTransitionSchema.safeParse({action,expectedUpdatedAt:instant}).success).toBe(true);
    }
    for(const [before,action] of [["ACTIVE","REOPEN"],["PLANNED","COMPLETE"],["COMPLETED","START"],["ARCHIVED","REOPEN"]]){
      expect(isValidMentorSprintTransition(before,action)).toBe(false);
    }
    expect(mentorSprintTransitionSchema.safeParse({action:"DELETE",expectedUpdatedAt:instant}).success).toBe(false);
  });
  it("requires a valid sprint edit token, preserves equal fields and detects changed goals",()=>{
    expect(mentorSprintDetailsSchema.safeParse({...sprint,expectedUpdatedAt:instant}).success).toBe(false);
    const {releaseId:unused,...safe}=sprint;
    expect(unused).toBe(releaseId);
    expect(mentorSprintDetailsSchema.safeParse({...safe,expectedUpdatedAt:instant}).success).toBe(true);
    expect(mentorSprintDetailsSchema.safeParse({...safe,endDate:"2098-12-31",expectedUpdatedAt:instant}).success).toBe(false);
    expect(sprintDetailsChanged(safe,safe)).toBe(false);
    expect(sprintDetailsChanged(safe,{...safe,goal:"Demo in lab"})).toBe(true);
  });
  it("validates mentor task backlog and active sprint optimistic-version boundaries",()=>{
    expect(mentorTaskCreateSchema.safeParse(task).success).toBe(true);
    expect(mentorTaskCreateSchema.parse(task).status).toBe("TODO");
    expect(mentorTaskCreateSchema.safeParse({...task,status:"IN_PROGRESS"}).success).toBe(false);
    expect(mentorTaskCreateSchema.safeParse({...task,sprintId:releaseId}).success).toBe(false);
    expect(mentorTaskCreateSchema.safeParse({...task,sprintId:releaseId,expectedSprintUpdatedAt:instant}).success).toBe(true);
    expect(mentorTaskCreateSchema.safeParse({...task,expectedSprintUpdatedAt:instant}).success).toBe(false);
  });
  it("requires a blocker reason and constrains task priority, title, and estimate",()=>{
    expect(mentorTaskCreateSchema.safeParse({...task,sprintId:releaseId,expectedSprintUpdatedAt:instant,status:"BLOCKED"}).success).toBe(false);
    expect(mentorTaskCreateSchema.safeParse({...task,sprintId:releaseId,expectedSprintUpdatedAt:instant,status:"BLOCKED",blockerReason:"Waiting on access"}).success).toBe(true);
    expect(mentorTaskCreateSchema.safeParse({...task,priority:"URGENT"}).success).toBe(false);
    expect(mentorTaskCreateSchema.safeParse({...task,estimatePoints:1001}).success).toBe(false);
    expect(mentorTaskCreateSchema.safeParse({...task,title:"x".repeat(201)}).success).toBe(false);
  });
  it("detects only changed task metadata and rejects tenant injection",()=>{
    expect(mentorTaskDetailsInputSchema.safeParse(details).success).toBe(true);
    expect(mentorTaskDetailsInputSchema.safeParse({...details,collegeId:projectId}).success).toBe(false);
    expect(taskDetailsChangedFields(details,details)).toEqual([]);
    expect(taskDetailsChangedFields(details,{...details,title:"Updated"})).toEqual(["title"]);
  });
  it("disallows meeting reschedule after closeout and in provisional states",()=>{
    expect(mentorMeetingCanReschedule("SCHEDULED","ACTIVE")).toBe(true);
    expect(mentorMeetingCanReschedule("RESCHEDULED","PLANNED")).toBe(true);
    expect(mentorMeetingCanReschedule("REQUESTED","ACTIVE")).toBe(false);
    expect(mentorMeetingCanReschedule("SCHEDULED","ARCHIVED")).toBe(false);
    expect(mentorMeetingCanReschedule("SCHEDULED","COMPLETED")).toBe(false);
  });
  it("requires confirmed positive meeting duration not exceeding 12 hours",()=>{
    const base={startsAt:"2099-01-01T08:00:00+05:30",endsAt:"2099-01-01T09:00:00+05:30",expectedUpdatedAt:instant,confirmed:true};
    expect(mentorMeetingRescheduleSchema.safeParse(base).success).toBe(true);
    expect(mentorMeetingRescheduleSchema.safeParse({...base,confirmed:false}).success).toBe(false);
    expect(mentorMeetingRescheduleSchema.safeParse({...base,endsAt:base.startsAt}).success).toBe(false);
    expect(mentorMeetingRescheduleSchema.safeParse({...base,endsAt:"2099-01-02T09:00:00+05:30"}).success).toBe(false);
  });
  it("roundtrips the mentor meeting local IST display independent of browser locale",()=>{
    const iso="2099-01-01T04:00:00.000Z";
    expect(toIstLocalInput(iso)).toBe("2099-01-01T09:30");
    expect(fromIstLocalInput("2099-01-01T09:30")).toBe(iso);
    expect(fromIstLocalInput("01/01/2099 09:30")).toBeNull();
    expect(toIstLocalInput("invalid")).toBe("");
  });
  it("rejects JavaScript, credentials, plain HTTP and overlong external resource URLs",()=>{
    expect(safeHttpsResourceUrl("https://example.org/a")).toBe("https://example.org/a");
    for(const value of ["javascript:alert(1)","http://example.org","https://admin:secret@example.org","x".repeat(2049),""]){
      expect(safeHttpsResourceUrl(value)).toBeNull();
    }
  });
  it("filters resource directory by recorded required, URL and description without leaking unsafe links",()=>{
    const rows=[
      resource("a","Lecture notes",true,"https://example.org/notes","Notes",1),
      resource("b","Campus sheet",false,"http://example.org/untrusted",null,2),
      resource("c","Course plan",true,null,"Plan",3),
    ];
    const query=mentorResourceDirectoryQuerySchema.parse({projectId,required:"REQUIRED",link:"HTTPS"});
    const data=mentorResourceDirectory(rows,query);
    expect(data.registered).toBe(3);
    expect(data.requiredCount).toBe(2);
    expect(data.linkableCount).toBe(1);
    expect(data.items.map(item=>item.id)).toEqual(["a"]);
    expect(data.items[0].safeUrl).toBe("https://example.org/notes");
    expect(mentorResourceDirectoryHref(query)).toContain("required=REQUIRED");
  });
  it("rejects forged or array-valued filter selectors, and constrains paging",()=>{
    expect(parseMentorResourceDirectorySearch(projectId,{collegeId:"other"})).toBeNull();
    expect(parseMentorResourceDirectorySearch(projectId,{link:["HTTPS","UNAVAILABLE"]})).toBeNull();
    expect(parseMentorResourceDirectorySearch(projectId,{page:"10001"})).toBeNull();
    expect(parseMentorResourceDirectorySearch(projectId,{page:"1"})?.page).toBe(1);
  });
  it("bounds resource export and explicitly marks truncated content",()=>{
    const rows=Array.from({length:202},(_,index)=>({id:String(index),title:"Resource "+index,description:null,required:true,safeUrl:null}));
    const csv=mentorResourceDirectoryCsv(rows,0);
    expect(csv).toContain("Truncated");
    expect(csv).toContain("2 additional matching resources");
    expect(csv.startsWith("\uFEFFResource ID")).toBe(true);
  });
  it("treats missing persisted reviews as missing evidence rather than user failure",()=>{
    const records=projectReviewCompleteness([{id:"1",version:1,status:"DRAFT",submittedAt:null,decision:null,reviewedAt:null,feedback:null}]);
    expect(records[0].reviewRecorded).toBe(false);
    expect(records[0].writtenFeedbackRecorded).toBe(false);
    expect(records[0].reviewLabel).toBe("Not submitted");
    const reviewed=projectReviewCompleteness([{id:"2",version:2,status:"APPROVED",submittedAt:new Date(instant),decision:"APPROVED",reviewedAt:new Date(instant),feedback:"Reviewed"}]);
    expect(reviewed[0].reviewRecorded).toBe(true);
    expect(reviewed[0].writtenFeedbackRecorded).toBe(true);
  });
  it("bounds review completeness paging to the actual last page",()=>{
    expect(reviewCompletenessPage(0,1)).toEqual({total:0,pageSize:10,totalPages:1,page:1});
    expect(reviewCompletenessPage(29,9).page).toBe(3);
    expect(mentorReviewCompletenessHref({projectId,page:1})).not.toContain("?");
    expect(mentorReviewCompletenessHref({projectId,page:3})).toContain("page=3");
  });
});
