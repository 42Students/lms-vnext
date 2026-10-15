import{it,expect}from"vitest";import{filterMentorCalendar,mentorCalendarFiltersSchema,mentorCalendarFilterHref}from"@/modules/projects/mentor-calendar-filter-model";
const now=new Date("2026-10-15T12:00:00Z");const base={id:"a",projectId:"p",projectTitle:"Project",projectStatus:"ACTIVE",title:"Meeting",meetingType:"GENERAL" as const,startsAt:"2026-10-14T08:00:00Z",endsAt:"2026-10-14T08:30:00Z",timeZone:"Asia/Kolkata",meetingUrl:null,linkedSprintTitle:null};
it("retains past-dated REQUESTED meetings as actionable instead of hiding them",()=>{const rows=[{...base,status:"REQUESTED" as const},{...base,id:"b",status:"CANCELLED" as const}];const q=mentorCalendarFiltersSchema.parse({attention:"OVERDUE_REQUESTED"});expect(filterMentorCalendar(rows,q,now).map(r=>r.id)).toEqual(["a"]);expect(mentorCalendarFilterHref(q)).toContain("attention=OVERDUE_REQUESTED")});
it("rejects unregistered meeting action filters",()=>expect(mentorCalendarFiltersSchema.safeParse({attention:"EXTERNAL"}).success).toBe(false));
it("filters upcoming scheduled meetings within 48 hours exactly",()=>{
 const records=[{...base,id:"soon",status:"SCHEDULED" as const,startsAt:"2026-10-16T12:00:00Z"},
  {...base,id:"later",status:"SCHEDULED" as const,startsAt:"2026-10-18T12:00:00Z"},
  {...base,id:"requested",status:"REQUESTED" as const,startsAt:"2026-10-16T12:00:00Z"}];
 const query=mentorCalendarFiltersSchema.parse({attention:"SOON_SCHEDULED"});
 expect(filterMentorCalendar(records,query,now).map(r=>r.id)).toEqual(["soon"]);
 expect(mentorCalendarFilterHref(query)).toContain("attention=SOON_SCHEDULED");
});
