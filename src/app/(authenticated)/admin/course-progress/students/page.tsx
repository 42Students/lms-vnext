import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminStudentCourseProgress} from "@/modules/courses/super-admin-student-course-progress";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
import {parseSuperAdminStudentProgressParams} from "@/modules/courses/super-admin-course-progress-query";
import {requirePermission} from "@/modules/permissions/policy";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";
import {DataTable} from "@/components/ui/data-table";

export default async function SuperAdminStudentCourseProgressPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>
}){
 const context=await getCurrentRequestContext();
 requirePermission(context,"admin-scope.select");
 const offeringId=parseSuperAdminStudentProgressParams(await searchParams);
 const back=<Link href="/admin/course-progress" className="inline-flex min-h-11 sm:min-h-9 items-center font-semibold text-primary-text underline">Back to Course Progress</Link>;
 if(!offeringId)return <div className="space-y-5">
  <PageHeader title="Student Course Progress" eyebrow="Super Admin · Courses"/>
  <ErrorState title="Choose a course offering" description="Select a course and class from Course Progress first." action={back}/>
 </div>;
 let report:Awaited<ReturnType<typeof getSuperAdminStudentCourseProgress>>;
 try{report=await getSuperAdminStudentCourseProgress(context,{offeringId});}
 catch{return <div className="space-y-5">
  <PageHeader title="Student Course Progress" eyebrow="Super Admin · Courses"/>
  <ErrorState title="Unable to read course progress" description="Check your selected college and course offering." action={back}/>
 </div>;}
 const measuredCounts=report.rows.map(row=>row.totalVideos+row.totalAssignments+row.totalQuizzes);
 const lowestMeasured=measuredCounts.length?Math.min(...measuredCounts):0;
 const highestMeasured=measuredCounts.length?Math.max(...measuredCounts):0;
 const average=report.rows.map(row=>studentCourseCompletion(row))
  .filter((n):n is number=>n!==null);
 const mean=average.length?Math.round(average.reduce((a,n)=>a+n,0)/average.length):null;
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Student Course Progress" eyebrow="Super Admin · Courses"
    description="Persisted video completion, assignment submissions and quiz attempts for active enrolled students in the selected course offering."/>
  {back}
  <dl className="grid gap-4 border-y border-border py-4 sm:grid-cols-4">
   <div className="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pr-4 sm:last:border-r-0"><dt>Average completion</dt><dd className="text-xl font-semibold">{mean===null?"Not measured":mean+"%"}</dd></div>
   <div className="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pr-4 sm:last:border-r-0"><dt>Students</dt><dd className="text-xl font-semibold">{report.rows.length}</dd></div>
   <div className="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pr-4 sm:last:border-r-0"><dt>Not started</dt><dd className="text-xl font-semibold">{report.rows.filter(row=>row.videos+row.assignments+row.quizzes===0).length}</dd></div>
   <div className="border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pr-4 sm:last:border-r-0"><dt>Items measured</dt><dd className="text-xl font-semibold">{lowestMeasured===highestMeasured?
     highestMeasured:lowestMeasured+"–"+highestMeasured+" per learner"}</dd></div>
  </dl>
  <a href={"/api/admin/course-progress/students/export?offeringId="+encodeURIComponent(report.offeringId)}
   className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-4 text-sm font-semibold text-primary-text hover:bg-primary-subtle sm:min-h-9">Export CSV</a>
  <p className="text-sm text-body">Video completions, submitted assignments and attempted quizzes are counted from persisted learner records. No completion percentage is inferred when there are no measurable items.</p>
  {report.truncated?<p role="alert" className="text-warning-text">Showing the first 500 students. Narrowing by course offering is required for large cohorts.</p>:null}
  <DataTable<(typeof report.rows)[number]>
    caption="Student Course Progress"
    rows={report.rows}
    getRowKey={row=>row.membershipId}
    columns={[
      {key:"student",header:"Student",mobilePriority:"primary",cell:row=>row.studentName},
      {key:"videos",header:"Videos",mobilePriority:"secondary",cell:row=>row.videos+"/"+row.totalVideos},
      {key:"assignments",header:"Assignments",mobilePriority:"secondary",cell:row=>row.assignments+"/"+row.totalAssignments},
      {key:"quizzes",header:"Quizzes",mobilePriority:"secondary",cell:row=>row.quizzes+"/"+row.totalQuizzes},
      {key:"progress",header:"Progress",mobilePriority:"secondary",cell:row=>{
        const completed=studentCourseCompletion(row);
        return completed===null?"Not measured":completed+"%";
      }},
    ]}
    empty={<p role="status" className="text-sm text-body">No students are enrolled in this course offering.</p>}
  />
 </div>;
}
