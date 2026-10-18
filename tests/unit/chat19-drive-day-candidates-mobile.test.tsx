import {describe,expect,it} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {PlacementDriveDayOverview} from "@/components/placements/placement-drive-day-overview";

type Data=Parameters<typeof PlacementDriveDayOverview>[0]["driveDay"];
const id="11111111-1111-4111-8111-111111111111";
function data(withRound:boolean):Data{
 return {
  job:{title:"Authorized hiring drive",company:{name:"IIT Dharwad employer"}},
  driveStatus:"ACTIVE",
  summary:{submittedApplications:1,pendingScreening:0,shortlisted:1,roundCount:withRound?1:0},
  attention:[],
  rounds:withRound?[{
   id,sequence:1,kind:"INTERVIEW",name:"Interview",
   scheduledAt:null,timezone:null,venue:null,status:"SCHEDULED",
   participantCount:1,stagedResultCount:0,appliedResultCount:1,missingResultCount:0,
   outcomes:{pass:1},
   participants:[{
    applicationId:id,displayName:"Candidate <script>x</script>",
    roleTitle:"Software Engineer",email:"candidate@example.com",phoneE164:null,
    membershipStatus:"ACTIVE",scheduleException:null,
    result:{status:"APPLIED",outcome:"PASS"},
   }],
  }]:[],
 } as unknown as Data;
}
describe("UX-SPILL-DRIVE-DAY-01: round candidate progress stays readable on phones",()=>{
 it("renders candidate identity, membership, schedule, result without forced 42rem scroll",()=>{
  const html=renderToStaticMarkup(<PlacementDriveDayOverview driveDay={data(true)}/>);
  expect(html).toContain('data-slot="data-table"');
  expect(html).toContain("Round 1 candidate progress");
  expect(html).toContain("Membership");
  expect(html).toContain("Shared round");
  expect(html).toContain("APPLIED");
  expect(html).toContain("PASS");
  expect(html).toContain("candidate@example.com");
  expect(html).toContain("Candidate &lt;script&gt;x&lt;/script&gt;");
  expect(html).not.toContain("<script>x</script>");
  expect(html).not.toContain("min-w-[42rem]");
 });
 it("rounds not configured does not invent candidate or offer rows",()=>{
  const html=renderToStaticMarkup(<PlacementDriveDayOverview driveDay={data(false)}/>);
  expect(html).toContain("Evaluation rounds are not configured yet.");
  expect(html).not.toContain("candidate@example.com");
  expect(html).not.toContain('data-slot="data-table"');
 });
});
