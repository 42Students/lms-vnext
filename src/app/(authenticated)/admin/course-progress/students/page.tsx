import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getSuperAdminStudentCourseProgress} from "@/modules/courses/super-admin-student-course-progress";
import {studentCourseCompletion} from "@/modules/courses/super-admin-student-progress-model";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";

export default async function SuperAdminStudentCourseProgressPage({searchParams}:{
 searchParams:Promise<{offeringId?:string|string[]}>
}){
 const query=await searchParams;
 const offeringId=Array.isArray(query.offeringId)?query.offeringId[0]:query.offeringId;
 const back=<Link href="/admin/course-progress" className="font-semibold text-primary-text">Back to Course Progress</Link>;
 if(!offeringId)return <div className="space-y-5">
  <PageHeader title="Student Course Progress" eyebrow="Super Admin · Courses"/>
  <ErrorState title="Choose a course offering" description="Select a course and class from Course Progress first." action={back}/>
 </div>;
 let report:Awaited<ReturnType<typeof getSuperAdminStudentCourseProgress>>;
 try{report=await getSuperAdminStudentCourseProgress(await getCurrentRequestContext(),{offeringId});}
 catch{return <div className="space-y-5">
  <PageHeader title="Student Course Progress" eyebrow="Super Admin · Courses"/>
  <ErrorState title="Unable to read course progress" description="Check your selected college and course offering." action={back}/>
 </div>;}
 const denominator=report.totals.videos+report.totals.assignments+report.totals.quizzes;
 const average=report.rows.map(row=>studentCourseCompletion({...row,
  totalVideos:report.totals.videos,totalAssignments:report.totals.assignments,
  totalQuizzes:report.totals.quizzes})).filter((n):n is number=>n!==null);
 const mean=average.length?Math.round(average.reduce((a,n)=>a+n,0)/average.length):null;
 return <main className="space-y-5">
  <PageHeader title="Student Course Progress" eyebrow="Super Admin · Courses"
    description="Persisted video completion, assignment submissions and quiz attempts for active enrolled students in the selected course offering."/>
  {back}
  <dl className="grid gap-3 sm:grid-cols-4">
   <div className="rounded border border-border p-3"><dt>Average completion</dt><dd className="text-xl font-semibold">{mean===null?"Not measured":mean+"%"}</dd></div>
   <div className="rounded border border-border p-3"><dt>Students</dt><dd className="text-xl font-semibold">{report.rows.length}</dd></div>
   <div className="rounded border border-border p-3"><dt>Not started</dt><dd className="text-xl font-semibold">{report.rows.filter(row=>row.videos+row.assignments+row.quizzes===0).length}</dd></div>
   <div className="rounded border border-border p-3"><dt>Items measured</dt><dd className="text-xl font-semibold">{denominator}</dd></div>
  </dl>
  <a href={"/api/admin/course-progress/students/export?offeringId="+encodeURIComponent(report.offeringId)}
   className="inline-flex min-h-11 items-center rounded border border-border px-4 text-sm font-semibold text-primary-text">Export CSV</a>
  <p className="text-sm text-body">Video completions, submitted assignments and attempted quizzes are counted from persisted learner records. No completion percentage is inferred when there are no measurable items.</p>
  {report.truncated?<p role="alert" className="text-warning-text">Showing the first 500 students. Narrowing by course offering is required for large cohorts.</p>:null}
  <div className="overflow-x-auto rounded border border-border">
   <table className="w-full text-left text-sm">
    <thead><tr className="border-b border-border"><th className="p-3">Student</th>
      <th className="p-3">Videos</th><th className="p-3">Assignments</th>
      <th className="p-3">Quizzes</th><th className="p-3">Progress</th></tr></thead>
    <tbody>{report.rows.map(row=><tr key={row.membershipId} className="border-b border-border">
      <td className="p-3">{row.studentName}</td>
      <td className="p-3">{row.videos}/{report.totals.videos}</td>
      <td className="p-3">{row.assignments}/{report.totals.assignments}</td>
      <td className="p-3">{row.quizzes}/{report.totals.quizzes}</td>
      <td className="p-3">{studentCourseCompletion({...row,totalVideos:report.totals.videos,
       totalAssignments:report.totals.assignments,totalQuizzes:report.totals.quizzes})??"Not measured"}{denominator?"%":""}</td>
    </tr>)}</tbody>
   </table>
  </div>
 </main>;
}
