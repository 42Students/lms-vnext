import {describe,it} from "node:test";
import assert from "node:assert/strict";
import {existsSync,readFileSync} from "node:fs";
import {join} from "node:path";

/** The 44 TPO/Recruiter/Public reference states (not 44 unique routes).
 * This is a source/route smoke guard, never a browser or pixel-parity claim.
 * For multiple tabs/modal states, the owned detail route is deliberately shared.
 */
const authenticated="src/app/(authenticated)";
const tpo=(suffix)=>authenticated+"/tpo/"+suffix;
const hr=(suffix)=>authenticated+"/hr/"+suffix;
const recruiter=(suffix)=>authenticated+"/recruiter/"+suffix;
const screens=[
 [1,"Companies · Today",tpo("companies/today/page.tsx")],
 [2,"Companies · Recruiters",tpo("recruiters/page.tsx")],
 [3,"Companies · Companies",tpo("companies/page.tsx")],
 [4,"Companies · Sent email detail",tpo("recruiters/campaigns/drafts/[campaignId]/page.tsx")],
 [5,"Companies · New email",tpo("recruiters/campaigns/new/page.tsx")],
 [6,"Companies · Messages",tpo("messages/page.tsx")],
 [7,"Students · All students",tpo("students/page.tsx")],
 [8,"Students · In placements",tpo("batches/page.tsx")],
 [9,"Students · To verify",tpo("verification/page.tsx")],
 [10,"Students · Requests",tpo("requests/page.tsx")],
 [11,"Students · Announcements",tpo("announcements/page.tsx")],
 [12,"Drives · List",tpo("placements/lifecycle/page.tsx")],
 [13,"Drives · Recruiter request",tpo("placements/lifecycle/page.tsx")],
 [14,"Drives · New/edit",tpo("placements/new/page.tsx")],
 [15,"Drive · Student review",tpo("placements/jobs/[jobId]/applicants/page.tsx")],
 [16,"Drive · Rounds",tpo("placements/jobs/[jobId]/rounds/page.tsx")],
 [17,"Drive · Offers",tpo("placements/jobs/[jobId]/offers/page.tsx")],
 [18,"Drive · Gate day",tpo("placements/jobs/[jobId]/drive-day/page.tsx")],
 [19,"Drive · Talk",tpo("placements/jobs/[jobId]/discussion/page.tsx")],
 [20,"Drive · About",tpo("placements/jobs/[jobId]/about/page.tsx")],
 [21,"TPO · Home",tpo("home/page.tsx")],
 [22,"TPO · Calendar",tpo("calendar/page.tsx")],
 [23,"Team · Chat",tpo("messages/page.tsx")],
 [24,"Team · People",tpo("settings/team/page.tsx")],
 [25,"Reports · Index",tpo("reports/page.tsx")],
 [26,"Reports · Detail",tpo("reports/[slug]/page.tsx")],
 [27,"Settings · Index",tpo("settings/page.tsx")],
 [28,"Settings · Audit log",tpo("audit/page.tsx")],
 [29,"TPO · Search/bell/profile", "src/components/shell/topbar/legacy-topbar.tsx"],
 [30,"Companies · Recruiter detail",tpo("recruiters/[leadId]/page.tsx")],
 [31,"Recruiter · Today",hr("home/page.tsx")],
 [32,"Recruiter · Drives",hr("drives/page.tsx")],
 [33,"Recruiter · Request/fix/hire again",hr("drives/new/page.tsx")],
 [34,"Recruiter · Drive overview",recruiter("drives/[jobId]/page.tsx")],
 [35,"Recruiter · Focused applicants",recruiter("drives/[jobId]/page.tsx")],
 [36,"Recruiter · Rounds and slots",recruiter("drives/[jobId]/page.tsx")],
 [37,"Recruiter · Offers",recruiter("drives/[jobId]/page.tsx")],
 [38,"Recruiter · Drive talk",recruiter("drives/[jobId]/messages/page.tsx")],
 [39,"Recruiter · Calendar",hr("calendar/page.tsx")],
 [40,"Recruiter · Messages",hr("conversations/page.tsx")],
 [41,"Recruiter · Company & Team",hr("company/page.tsx")],
 [42,"Recruiter · Search/bell/profile","src/components/shell/topbar/legacy-topbar.tsx"],
 [43,"Public · Invitation/sign in","src/app/recruiter-invite/[token]/page.tsx"],
 [44,"Public · Shared applicant list","src/app/company-share/[token]/page.tsx"],
];
describe("TPO + Recruiter + related Public prototype route smoke",()=>{
 it("has exactly the 44 original reference states in order",()=>{
  assert.equal(screens.length,44);
  assert.deepEqual(screens.map(row=>row[0]),Array.from({length:44},(_,i)=>i+1));
 });
 for(const [id,label,route] of screens){
  it(`#${id} ${label}: route source exists`,()=>{
   assert.ok(existsSync(join(process.cwd(),route)),`${label} has no source route at ${route}`);
  });
 }
 it("TPO sidebar matches prototype's eight sections and Companies Today route",()=>{
  const source=readFileSync(join(process.cwd(),"src/components/shell/tpo-prototype-navigation.ts"),"utf8");
  for(const label of ["Home","Students","Drives","Companies","Calendar","Team","Reports","Settings"])
   assert.match(source,new RegExp('label:"'+label+'"'));
  assert.match(source,/\/tpo\/companies\/today/);
 });
 it("both public entry points have independently scoped services",()=>{
  const share=readFileSync(join(process.cwd(),"src/app/company-share/[token]/page.tsx"),"utf8");
  const invite=readFileSync(join(process.cwd(),"src/app/recruiter-invite/[token]/page.tsx"),"utf8");
  assert.match(share,/getPublicCompanyApplicantShare/);
  assert.match(invite,/RecruiterInviteLanding/);
 });
});
