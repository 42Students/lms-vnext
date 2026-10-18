import {describe,expect,it} from "vitest";
import {filterMentorCalendar,mentorCalendarFilterHref,mentorCalendarFiltersSchema} from "@/modules/projects/mentor-calendar-filter-model";
import {safeMentorMeetingJoinUrl,mentorMeetingDisplayStatus,splitMentorMeetings,type MentorMeetingCalendarItem} from "@/modules/projects/mentor-calendar-view";
import {mentorCalendarCsv} from "@/modules/projects/mentor-calendar-export-model";
import {mentorResourceDirectory,mentorResourceDirectoryCsv,mentorResourceDirectoryHref,mentorResourceDirectoryQuerySchema,parseMentorResourceDirectorySearch,safeHttpsResourceUrl} from "@/modules/projects/mentor-resource-directory-model";

const A="11111111-1111-4111-8111-111111111111";
const B="22222222-2222-4222-8222-222222222222";
const NOW=new Date("2026-10-18T18:30:00.000Z"); // 19 October, 00:00 IST
const base:MentorMeetingCalendarItem={
 id:A,projectId:A,projectTitle:"Atlas",projectStatus:"ACTIVE",
 title:"Sprint review",status:"SCHEDULED",meetingType:"REVIEW",
 startsAt:"2026-10-18T18:00:00.000Z",endsAt:"2026-10-18T18:20:00.000Z",
 timeZone:"Asia/Kolkata",meetingUrl:"https://video.example.edu/room",linkedSprintTitle:"Sprint 1",
};
const meetings:MentorMeetingCalendarItem[]=[
 base,
 {...base,id:B,status:"REQUESTED",startsAt:"2026-10-17T08:00:00.000Z",endsAt:"2026-10-17T09:00:00.000Z",
  meetingUrl:null,linkedSprintTitle:null,title:"Pending request"},
 {...base,id:"third",status:"SCHEDULED",startsAt:"2026-10-19T10:00:00.000Z",endsAt:"2026-10-19T10:30:00.000Z",
  title:"Next check-in"},
];
const calendar=(extra:Record<string,unknown>={})=>mentorCalendarFiltersSchema.parse(extra);

describe("PROJ-BREAK-MENTOR calendar and resource directory independent user safety",()=>{
 it("PROJ-BREAK-MENTOR-40 meeting links allow only credential-free web protocols",()=>{
  for(const link of ["https://user:password@example.edu/room","http://user@example.edu/room",
   "javascript:alert(1)","data:text/html,test","file:///tmp/token","//example.edu/room"]){
   expect(safeMentorMeetingJoinUrl({...base,meetingUrl:link}),link).toBeNull();
  }
  expect(safeMentorMeetingJoinUrl(base)).toBe("https://video.example.edu/room");
  expect(safeMentorMeetingJoinUrl({...base,status:"REQUESTED"})).toBeNull();
  expect(safeMentorMeetingJoinUrl(base,NOW)).toBeNull();
  expect(mentorMeetingDisplayStatus(base,NOW)).toBe("MISSED");
  expect(mentorMeetingDisplayStatus(base,new Date("2026-10-18T18:20:00Z")))
   .toBe("SCHEDULED");
 });
 it("PROJ-BREAK-MENTOR-41 IST-day calendar filters count requests and missed meetings independently",()=>{
  expect(filterMentorCalendar(meetings,calendar({attention:"MISSED_SCHEDULED"}),NOW)
   .map(row=>row.id)).toEqual([A]);
  expect(filterMentorCalendar(meetings,calendar({attention:"OVERDUE_REQUESTED"}),NOW)
   .map(row=>row.id)).toEqual([B]);
  expect(filterMentorCalendar(meetings,calendar({attention:"SOON_SCHEDULED"}),NOW)
   .map(row=>row.id)).toEqual(["third"]);
  expect(filterMentorCalendar(meetings,calendar({period:"TODAY"}),NOW)
   .map(row=>row.id)).toEqual(["third"]);
  expect(filterMentorCalendar(meetings,calendar({join:"NO_SAFE_LINK"}),NOW)
   .map(row=>row.id)).toEqual([B]);
  expect(filterMentorCalendar(meetings,calendar({sprint:"UNLINKED"}),NOW)
   .map(row=>row.id)).toEqual([B]);
  expect(filterMentorCalendar(meetings,calendar({projectId:B}),NOW)).toEqual([]);
  expect(splitMentorMeetings(meetings,NOW).upcoming.some(row=>row.id===B)).toBe(true);
  expect(mentorCalendarFiltersSchema.safeParse({collegeId:A}).success).toBe(false);
  expect(mentorCalendarFiltersSchema.safeParse({period:"ALL_TIME"}).success).toBe(false);
  const href=mentorCalendarFilterHref(calendar({attention:"MISSED_SCHEDULED",period:"TODAY"}));
  expect(href).toContain("attention=MISSED_SCHEDULED");
  expect(href).not.toContain("collegeId=");
 });
 it("PROJ-BREAK-MENTOR-42 calendar CSV exports only redacted rows, in IST, bounded to 500",()=>{
  const csv=mentorCalendarCsv(Array.from({length:502},(_,i)=>({
   ...base,id:"meeting-"+i,title:i===0?"=cmd":"Sprint review",
  })),3);
  expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(502);
  expect(csv).toContain("5 additional matching meetings");
  expect(csv).toContain("'=cmd");
  expect(csv).toContain("IST");
  expect(csv).not.toContain("meeting-501");
  expect(csv).not.toContain("https://video.example.edu/room");
  expect(mentorCalendarCsv([],Number.NaN)).not.toContain("Truncated");
 });
 it("PROJ-BREAK-MENTOR-43 resource links must be safe HTTPS and not disclose secrets in CSV",()=>{
  const safe=safeHttpsResourceUrl("https://example.edu/resources?unit=1");
  expect(safe).toContain("https://example.edu");
  for(const url of ["http://example.edu","javascript:alert(1)","data:text/html,hi",
   "https://user:password@example.edu","//example.edu/path",null,
   "https://example.edu/"+("a".repeat(3000))]){
   expect(safeHttpsResourceUrl(url),String(url).slice(0,30)).toBeNull();
  }
  const q=mentorResourceDirectoryQuerySchema.parse({projectId:A,required:"REQUIRED",link:"HTTPS"});
  const rows=[
   {id:"a",title:"=Secret formula",description:"Guide",url:"https://example.edu/guide",required:true,sequence:2},
   {id:"b",title:"Hidden link",description:null,url:"https://alice:password@example.edu",required:true,sequence:1},
   {id:"c",title:"Optional",description:null,url:null,required:false,sequence:3},
  ];
  const data=mentorResourceDirectory(rows,q);
  expect(data.registered).toBe(3);
  expect(data.requiredCount).toBe(2);
  expect(data.linkableCount).toBe(1);
  expect(data.items.map(item=>item.id)).toEqual(["a"]);
  expect(data.items[0].safeUrl).toBe("https://example.edu/guide");
  const csv=mentorResourceDirectoryCsv(data.items,0);
  expect(csv).toContain("'=Secret formula");
  expect(csv).not.toContain("https://example.edu/guide");
  expect(csv).not.toContain("password");
  expect(mentorResourceDirectoryHref(q)).toContain("required=REQUIRED");
 });
 it("PROJ-BREAK-MENTOR-44 resource filters reject forged actor, multi-value, unbounded search and unknown status",()=>{
  const parsed=parseMentorResourceDirectorySearch(A,{required:"REQUIRED",page:"2",search:"tests"});
  expect(parsed).toMatchObject({required:"REQUIRED",page:2,search:"tests"});
  expect(parseMentorResourceDirectorySearch(A,{collegeId:A})).toBeNull();
  expect(parseMentorResourceDirectorySearch(A,{required:["REQUIRED","OPTIONAL"]})).toBeNull();
  expect(parseMentorResourceDirectorySearch(A,{page:"10001"})).toBeNull();
  expect(parseMentorResourceDirectorySearch(A,{search:"x".repeat(101)})).toBeNull();
  expect(parseMentorResourceDirectorySearch("forged",{required:"ALL"})).toBeNull();
  expect(mentorResourceDirectoryQuerySchema.safeParse({projectId:A,role:"ADMIN"}).success).toBe(false);
 });
 it("PROJ-BREAK-MENTOR-45 CSV formatter caps 200 resources even when called without list paginator",()=>{
  const rows=Array.from({length:203},(_,i)=>({
   id:"resource-"+i,title:"Resource",description:null,required:false,safeUrl:null,
  }));
  const csv=mentorResourceDirectoryCsv(rows,2);
  expect(csv.replace(/^\uFEFF/,"").trim().split("\r\n")).toHaveLength(202);
  expect(csv).toContain("5 additional matching resources");
  expect(csv).not.toContain("resource-202");
 });
});
