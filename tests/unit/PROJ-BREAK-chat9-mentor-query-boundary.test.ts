import {describe,expect,it} from "vitest";
import {readFileSync} from "node:fs";
import {parseProjectAdminReassignMentorQuery} from "@/modules/projects/admin-reassign-mentor-query-model";

describe("IIT Dharwad Projects: admin mentor reassignment deep link hostility",()=>{
  it("PROJ-BREAK-mentor-83 valid selected mentor and workspace survive strict parsing",()=>{
    expect(parseProjectAdminReassignMentorQuery({})).toMatchObject({
      success:true,data:{page:1,pageSize:10,mentorSearch:""},
    });
    const selected={
      fromMentorId:"11111111-1111-4111-8111-111111111111",
      projectId:"22222222-2222-4222-8222-222222222222",
      mentorSearch:"  Faculty  ",q:"  Dharwad  ",
      status:"ACTIVE",page:"2",pageSize:"50",
    };
    expect(parseProjectAdminReassignMentorQuery(selected)).toMatchObject({
      success:true,data:{...selected,mentorSearch:"Faculty",q:"Dharwad",page:2,pageSize:50},
    });
    expect(parseProjectAdminReassignMentorQuery({fromMentorId:"UNASSIGNED"}).success).toBe(true);
    expect(parseProjectAdminReassignMentorQuery({fromMentorId:"",projectId:"",status:""}).success).toBe(true);
  });
  it("PROJ-BREAK-mentor-84 duplicate, spoofed and exotic URL values fail closed",()=>{
    const invalid=[
      {page:"0x10"},{page:"1e2"},{page:""},{page:" 2"},
      {page:"0"},{page:"10001"},{page:"-1"},
      {pageSize:""},{pageSize:"0x20"},{pageSize:"101"},{pageSize:"9"},
      {page:["1","2"]},{status:["ACTIVE","ARCHIVED"]},
      {mentorSearch:"a".repeat(101)},{q:"b".repeat(121)},
      {status:"OTHER_TENANT"},{fromMentorId:"INVALID"},
      {projectId:"OTHER_TENANT"},{collegeId:"22222222-2222-4222-8222-222222222222"},
    ];
    for(const input of invalid)
      expect(parseProjectAdminReassignMentorQuery(input).success,JSON.stringify(input)).toBe(false);
  });
  it("PROJ-BREAK-mentor-85 invalid links display a recovery before request context and private services",()=>{
    const page=readFileSync("src/components/projects/project-admin-reassign-mentor-page.tsx","utf8");
    const context=page.indexOf("getCurrentRequestContext()");
    const recovery=page.indexOf("resolveLegacyReassignMentorBookmark(searchParams");
    const parser=page.indexOf("parseProjectAdminReassignMentorQuery(recovered.params)");
    const guard=page.indexOf("if(!parsed.success)");
    const firstRead=page.indexOf("listCollegeReassignmentWorkspaces(");
    // A legacy numeric ID first requires the selected-college actor for a
    // scoped identity crosswalk. Private directories remain behind both guards.
    expect(recovery).toBeGreaterThan(context);
    expect(parser).toBeGreaterThan(recovery);
    expect(guard).toBeGreaterThan(parser);
    expect(firstRead).toBeGreaterThan(guard);
    expect(page).toContain('title="Invalid mentor reassignment filters"');
    expect(page).toContain("Clear filters");
  });
});
