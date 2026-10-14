import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {EmptyState} from "@/components/ui/empty-state";
import {facultyCorrectionHref,facultyCorrectionQuerySchema}
  from "@/modules/attendance/faculty-correction-model";
import {getFacultyCorrectionAvailability}
  from "@/modules/attendance/faculty-correction-service";
type Search={window?:string|string[];page?:string|string[]};
function first(s:string|string[]|undefined){return Array.isArray(s)?s[0]:s;}
export default async function FacultyAttendanceCorrectionsPage({
  params,searchParams,
}:{params:Promise<{deliveryId:string}>;searchParams:Promise<Search>}){
  const [p,search]=await Promise.all([params,searchParams]);
  const parsed=facultyCorrectionQuerySchema.safeParse({
    deliveryId:p.deliveryId,window:first(search.window)??undefined,
    page:first(search.page)??undefined,
  });
  if(!parsed.success) return <section role="alert" className="space-y-2">
    <h1>Invalid attendance query</h1>
    <Link href="/teacher/courses" className="text-primary-text underline">Courses</Link>
  </section>;
  const data=await getFacultyCorrectionAvailability(
    await getCurrentRequestContext(),parsed.data,
  );
  const returnHref="/teacher/courses/"+encodeURIComponent(data.query.deliveryId)+"/attendanceDetail";
  return <div className="space-y-6">
    <PageHeader eyebrow="Faculty · Attendance" title="Correction availability"
      description={data.course.courseName+" · "+data.course.sectionName}
      actions={<Link href={returnHref}
        className="rounded-md border border-border px-4 py-2 text-sm font-semibold text-primary-text">
        Attendance workspace
      </Link>} />
    <section role="status" className="rounded-xl border border-border bg-surface p-5">
      <h2 className="font-semibold text-foreground">Correction request history unavailable</h2>
      <p className="mt-2 text-sm text-body">
        The registered database does not contain attendance correction requests.
        This page cannot list, count or approve requests. Only actual attendance
        sessions and the college correction window are shown below.
      </p>
      <p className="mt-2 text-sm text-body">
        Current policy: {data.correctionWindowHours} hours after session end.
        Marking before session start is not allowed.
      </p>
    </section>
    <nav aria-label="Correction window filters" className="flex flex-wrap gap-2">
      {(["ALL","OPEN","NOT_STARTED","WINDOW_EXPIRED"] as const).map(window=>
        <Link key={window} href={facultyCorrectionHref({...data.query,window,page:1})}
          aria-current={data.query.window===window?"page":undefined}
          className="rounded-full border border-border px-3 py-2 text-sm font-semibold text-primary-text">
          {window.replaceAll("_"," ")}
        </Link>)}
    </nav>
    <p className="text-sm text-body">{data.total} matching registered session{data.total===1?"":"s"}</p>
    {data.items.length===0?<EmptyState title="No matching attendance sessions"
      description="No registered scheduled attendance session matches the selected correction window. This is not a count of correction requests."/>
    :<ol className="grid gap-3">{data.items.map(item=>
      <li key={item.id} className="rounded-xl border border-border bg-surface p-4">
        <h2 className="font-semibold">{item.title}</h2>
        <p className="mt-1 text-sm text-body">
          {new Intl.DateTimeFormat("en-IN",{
            timeZone:"Asia/Kolkata",dateStyle:"medium",timeStyle:"short",
          }).format(item.startsAt)} IST · Attendance {item.attendanceStatus??"UNMARKED"}
        </p>
        <p className="mt-1 text-sm text-body">
          Policy window: {item.window.replaceAll("_"," ")}
        </p>
      </li>)}</ol>}
    <nav aria-label="Attendance correction session pages"
      className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Page {data.page} of {data.totalPages}</p>
      <div className="flex gap-3">
        {data.page>1&&<Link href={facultyCorrectionHref({...data.query,page:data.page-1})}
          className="text-primary-text underline">Previous</Link>}
        {data.page<data.totalPages&&<Link href={facultyCorrectionHref({...data.query,page:data.page+1})}
          className="text-primary-text underline">Next</Link>}
      </div>
    </nav>
  </div>;
}
