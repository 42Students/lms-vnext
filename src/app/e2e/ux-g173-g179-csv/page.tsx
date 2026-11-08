import {notFound} from "next/navigation";
import {Heading} from "@/components/ui/heading";
import {ButtonLink} from "@/components/ui/button-link";
import {collegeContentCsv,legacyLessonContentCsv} from "@/modules/courses/college-content-csv-model";
import {buildHrApplicantCsv} from "@/modules/placements/hr-applicant-export-model";
import {buildHrActivityCsv} from "@/modules/placements/hr-activity-csv-model";
import {buildHrCalendarCsv} from "@/modules/placements/hr-calendar-export-model";
import {buildHrCompanyReportCsv} from "@/modules/placements/hr-company-report-export-model";
import {hrDriveProposalHistoryCsv} from "@/modules/placements/hr-drive-proposal-export-model";
import {buildHrDrivesCsv} from "@/modules/placements/hr-drives-csv-model";
import {buildHrInboxCsv} from "@/modules/placements/hr-inbox-csv-model";
import {buildHrOfferCsv} from "@/modules/placements/hr-offer-export-model";
import {buildHrTeamCsv} from "@/modules/placements/hr-team-csv-model";
import {tpoCompanyShareAuditCsv} from "@/modules/placements/company-share/audit-csv-model";

export const dynamic="force-dynamic";

/** Synthetic UX proof only: real serializers, no database or tenant data.
 * Never mount this in production, even with the opt-in fixture flag. */
export default function UxCourseRecruiterCsvFixture(){
 if(process.env.NODE_ENV!=="development"||process.env.UX_G173_G179_FIXTURE!=="1")notFound();
 const unsafe="\u093E=HYPERLINK(1,2)";
 const date=new Date("2026-11-08T07:00:00.000Z");
 const college={title:unsafe,course:"Example course",lesson:"Unit A",
  status:"Published",scope:"College",visible:"Yes",details:"Sample data",
  id:"content-1",type:"VIDEO",sequence:1,points:2};
 const examples=[
  {key:"college-content",title:"College content",file:"college-content.csv",
   csv:collegeContentCsv([college])},
  {key:"legacy-lesson",title:"Lesson content",file:"legacy-lesson-content.csv",
   csv:legacyLessonContentCsv([college])},
  {key:"hr-applicant",title:"Recruiter applicants",file:"recruiter-applicants.csv",
   csv:buildHrApplicantCsv([{id:"app-1",name:unsafe,role:"Engineer",status:"SUBMITTED",
    screening:"SHORTLISTED",submittedAt:date,email:"private@example.invalid"}],1).csv},
  {key:"hr-activity",title:"Recruiter activity",file:"recruiter-activity.csv",
   csv:buildHrActivityCsv([{id:"event-1",jobId:"job-1",title:unsafe,
    status:"PUBLISHED",occurredAt:date}],false).csv},
  {key:"hr-calendar",title:"Recruiter calendar",file:"recruiter-calendar.csv",
   csv:buildHrCalendarCsv([{kind:"ROUND",title:unsafe,jobTitle:"Engineer",
    startsAt:date,status:"SCHEDULED",jobId:"job-1"}],[],"ALL").csv},
  {key:"hr-reports",title:"Recruiter reports",file:"recruiter-reports.csv",
   csv:buildHrCompanyReportCsv([{id:"job-1",title:unsafe,status:"PUBLISHED",
    applications:2,submittedApplications:1,withdrawnApplications:1,
    outstandingOffers:0,acceptedOffers:0,declinedOffers:0,joinedOffers:0}] as never,1).csv},
  {key:"hr-proposals",title:"Recruiter proposals",file:"recruiter-proposals.csv",
   csv:hrDriveProposalHistoryCsv([{referenceId:"proposal-1",title:unsafe,createdAt:date}])},
  {key:"hr-drives",title:"Recruiter drives",file:"recruiter-drives.csv",
   csv:buildHrDrivesCsv([{job:{id:"job-1",title:unsafe,status:"PUBLISHED",
    employmentType:"FULL_TIME",workMode:"REMOTE",applicationDeadline:date}}] as never,false).csv},
  {key:"hr-inbox",title:"Recruiter inbox",file:"recruiter-inbox.csv",
   csv:buildHrInboxCsv([{id:"event-1",jobId:"job-1",title:unsafe,
    label:"Status changed",createdAt:date,unread:true}],1).csv},
  {key:"hr-offers",title:"Recruiter offers",file:"recruiter-offers.csv",
   csv:buildHrOfferCsv([{id:"offer-1",name:unsafe,role:"Engineer",status:"ISSUED",
    annualCtcInr:500000,joiningDate:null,issuedAt:date,expiresAt:null,
    joiningStatus:null}],1).csv},
  {key:"hr-team",title:"Recruiter team",file:"recruiter-team.csv",
   csv:buildHrTeamCsv([{displayName:unsafe,title:"Recruiter",
    email:"recruiter@example.invalid",isYou:true}]).csv},
  {key:"share-audit",title:"Company-share audit",file:"company-share-audit.csv",
   csv:"\uFEFF"+tpoCompanyShareAuditCsv([{sharePrefix:unsafe,kind:"Page view",
    at:date.toISOString()}],true)},
  {key:"empty-proposals",title:"No proposal history",file:"empty-proposals.csv",
   csv:hrDriveProposalHistoryCsv([])},
  {key:"capped-team",title:"Team export cap",file:"capped-team.csv",
   csv:buildHrTeamCsv(Array.from({length:202},(_,i)=>({
    displayName:i===0?unsafe:"Example Recruiter",title:"Recruiter",
    email:"recruiter@example.invalid",isYou:false,
   }))).csv},
 ];
 return <main className="mx-auto min-w-0 w-full max-w-4xl space-y-6 px-4 py-10">
  <header className="space-y-2">
   <Heading level={1} className="text-2xl font-semibold">College and recruiter export quality check</Heading>
   <p className="text-sm text-body">Development-only synthetic CSV records. No live college, learner or recruiter data.</p>
  </header>
  <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
   {examples.map(example=><section key={example.key} className="min-w-0 space-y-3 rounded-xl border border-border p-4">
    <Heading level={2} className="break-words text-base font-semibold">{example.title}</Heading>
    <p className="break-all text-xs text-muted-foreground">{example.file}</p>
    <ButtonLink variant="secondary" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(example.csv)}
     download={example.file}
     className="focus-ring flex min-h-11 w-full items-center justify-center rounded-lg border border-border p-3 text-center text-sm font-semibold">
     Download sample CSV
    </ButtonLink>
   </section>)}
  </div>
 </main>;
}
