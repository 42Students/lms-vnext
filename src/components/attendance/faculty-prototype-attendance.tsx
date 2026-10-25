import Link from "next/link";
import type {FacultyAttendanceWorkspaceData} from "@/components/attendance/faculty-attendance-workspace";
export function FacultyPrototypeAttendance({workspace,deliveryId,selectedSessionId}:{
 workspace:FacultyAttendanceWorkspaceData;deliveryId:string;selectedSessionId:string|null;
}){
 const base="/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail";
 const sessions=[...workspace.sessions].sort((a,b)=>b.startsAt.localeCompare(a.startsAt));
 const selected=sessions.find(session=>session.id===selectedSessionId)??sessions[0]??null;
 const records=new Map(workspace.records.filter(r=>r.scheduleEventId===selected?.id)
  .map(record=>[record.membershipId,record.status] as const));
 const fmt=(value:string)=>new Intl.DateTimeFormat("en-IN",{
  timeZone:"Asia/Kolkata",weekday:"long",day:"numeric",month:"short",year:"numeric",
  hour:"numeric",minute:"2-digit",
 }).format(new Date(value));
 const all=workspace.roster.length;
 const absent=workspace.roster.filter(row=>{
  const status=records.get(row.membershipId);return status&&status!=="PRESENT";
 }).length;
 return <section aria-label="Faculty prototype attendance" className="space-y-5">
  <div className="flex flex-wrap justify-between gap-4">
   <div><h2 className="faculty-proto-heading">Attendance</h2>
    <p className="faculty-proto-subtitle mt-1">{workspace.course.sectionName} · {sessions.length} scheduled class sessions</p>
   </div>
   {selected?<Link className="faculty-proto-action" href={base+"?sessionId="+encodeURIComponent(selected.id)+"#faculty-attendance-editor"}>
    {selected.attendanceStatus==="MARKED"?"Review attendance":"Mark attendance"}
   </Link>:null}
  </div>
  <div className="flex flex-wrap gap-2">
   <Link className="faculty-proto-pill no-underline" href={base} aria-current={!selectedSessionId?"page":undefined}>All sessions</Link>
   {sessions.slice(0,10).map(session=><Link key={session.id}
    className="faculty-proto-pill no-underline"
    style={selected?.id===session.id?{background:"#ebf8fa",borderColor:"#078191",color:"#007f8e"}:undefined}
    href={base+"?sessionId="+encodeURIComponent(session.id)}>
    {new Intl.DateTimeFormat("en-IN",{timeZone:"Asia/Kolkata",day:"numeric",month:"short"}).format(new Date(session.startsAt))}
   </Link>)}
  </div>
  {!selected?<p className="faculty-proto-subtitle rounded-lg border border-[#e5ebf2] p-5">No scheduled sessions available yet.</p>:
   <section className="space-y-4">
    <div className="rounded-xl border border-[#e5ebf2] p-5">
     <h3 className="text-base font-bold text-[#1d293f]">{fmt(selected.startsAt)} IST</h3>
     <p className="faculty-proto-subtitle mt-1">
      {selected.title} · {workspace.course.sectionName} · {selected.location??"Location not provided"}</p>
     <div className="mt-3 flex flex-wrap gap-3 text-sm">
      <span>{selected.attendanceStatus==="MARKED"?"Attendance recorded":"Attendance not marked"}</span>
      <span>{all} current students</span>
      {selected.attendanceStatus==="MARKED"?<span>{all-absent} present · {absent} with absence/exception</span>:null}
     </div>
    </div>
    <div className="faculty-proto-table-wrap"><table className="faculty-proto-table">
     <thead><tr><th>Student</th><th>Roll no</th><th>Attendance status</th><th>Mark / correct</th></tr></thead>
     <tbody>{workspace.roster.map(student=>{
      const status=records.get(student.membershipId);
      const display=selected.attendanceStatus==="MARKED"?(status??"PRESENT"):"Not marked";
      const link=base+"?sessionId="+encodeURIComponent(selected.id)+"#faculty-attendance-editor";
      return <tr key={student.membershipId}>
       <td>{student.displayName?.trim()||"Student"}</td>
       <td>{student.rollNumber??"—"}</td>
       <td><span className={"rounded-full px-2.5 py-1 text-xs font-bold "+
        (display==="PRESENT"?"bg-emerald-50 text-emerald-700":display==="Not marked"?"bg-[#f1f4f7] text-[#60718b]":"bg-red-50 text-red-700")}>{display.replaceAll("_"," ").toLowerCase()}</span></td>
       <td><Link className="faculty-proto-link" href={link}>Edit</Link></td>
      </tr>;
     })}</tbody>
    </table></div>
   </section>}
  <p className="faculty-proto-subtitle">This table is a read-only attendance summary. Use Mark attendance below to save or correct the class record with confirmation and auditing.</p>
 </section>;
}
