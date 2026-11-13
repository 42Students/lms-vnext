import {notFound} from "next/navigation";
import {renderBatchCsv,renderSemesterCsv} from "@/modules/academics/college-academic-export-model";
import {renderCollegeClassesCsv} from "@/modules/academics/college-classes-export-model";
import {renderLectureHallsCsv} from "@/modules/academics/college-lecture-halls-export-model";
import { Heading } from "@/components/ui/heading";
import { ButtonLink } from "@/components/ui/button-link";

import { env } from "@/config/env";
export const dynamic="force-dynamic";

/** Browser acceptance fixture for synthetic academic CSV records only.
 * The production export API, auth context and database are never called.
 * This route is denied in every production build, even if the flag is set. */
export default function AcademicExportProof(){
 if(process.env.NODE_ENV!=="development"||env.UX_G166_FIXTURE!=="1")notFound();
 const examples=[
  {id:"batches",title:"Batch export",filename:"batches.csv",csv:renderBatchCsv([{
   id:"batch-1",name:"\u093E=SUM(1)",code:"B",status:"ACTIVE",programId:"program-1",
   programName:"Example Program",programCode:"EX",academicYear:"2026-27",
   startDate:"2026-06-01",endDate:null,currentTermNumber:1,
   currentAcademicYearStart:2026,activeSections:1,activeEnrolledLearners:20,
  }],false)},
  {id:"semesters",title:"Semester export",filename:"semesters.csv",csv:renderSemesterCsv([{
   name:"\u20DD@BAD",termNumber:2,programName:"Example Program",
   programCode:"EX",totalCredits:20,isActive:true,mappedCourses:3,
  }],false)},
  {id:"classes",title:"Class export",filename:"classes.csv",csv:renderCollegeClassesCsv([{
   id:"class-1",name:"\u093E+FORMULA",linkedProgramId:"program-1",
   cohortId:"batch-1",periodStart:"2026-06-01",periodEnd:null,minSize:15,capacity:30,
  }],true)},
  {id:"halls",title:"Lecture hall export",filename:"lecture-halls.csv",csv:renderLectureHallsCsv([{
   name:"\u093E=BAD",capacity:120,roomType:"LECTURE_HALL",
   status:"ACTIVE",departmentName:"Example Department",upcomingClasses:1,
  }],false)},
 ];
 return <main className="mx-auto min-w-0 w-full max-w-3xl space-y-6 px-4 py-10">
  <header className="space-y-2">
   <Heading level={1} className="text-2xl font-semibold">Academic CSV quality check</Heading>
   <p className="text-sm text-body">Synthetic examples only. No real college, teacher, or learner records.</p>
  </header>
  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
   {examples.map(example=><section key={example.id} className="min-w-0 space-y-3 rounded-xl border border-border p-4">
    <Heading level={2} className="text-base font-semibold">{example.title}</Heading>
    <p className="break-all text-xs text-muted-foreground">{example.filename}</p>
    <ButtonLink variant="secondary" href={"data:text/csv;charset=utf-8,"+encodeURIComponent(example.csv)} download={example.filename}
      className="focus-ring flex min-h-11 w-full items-center justify-center rounded-lg border border-border p-3 text-center text-sm font-semibold">
     Download example CSV
    </ButtonLink>
   </section>)}
  </div>
 </main>;
}
