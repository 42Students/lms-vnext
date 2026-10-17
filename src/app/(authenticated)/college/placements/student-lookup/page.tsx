import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {lookupCollegeStudentPlacement} from "@/modules/placements/college-placement-student-lookup-service";
export default async function CollegePlacementStudentLookup({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const params=await searchParams,q=typeof params.q==="string"?params.q.trim():"";
 const data=q.length>=3?await lookupCollegeStudentPlacement(await getCurrentRequestContext(),q):null;
 return <div className="space-y-5">
  <PageHeader eyebrow="College Admin · Placements" title="Student placement lookup"
   actions={<Link href="/college/hiring-dashboard" className="font-semibold text-primary-text underline">Analytics</Link>}/>
  <form action="/college/placements/student-lookup" className="rounded-xl border border-border bg-surface p-5">
   <label className="grid max-w-xl gap-2 text-sm font-semibold">Name, roll number or email
    <input type="search" name="q" minLength={3} maxLength={150} required defaultValue={q}
      placeholder="Find one student in this college"
      className="min-h-11 rounded border border-border bg-surface px-3"/>
   </label>
   <button className="mt-3 min-h-10 rounded bg-primary px-4 font-semibold text-on-primary">Search students</button>
  </form>
  {data&&!data.students.length?<p className="rounded border border-border p-5">No matching college students.</p>:null}
  {data?.students.map(person=><section key={person.membershipId} className="space-y-3 rounded-xl border border-border bg-surface p-5">
   <div className="flex flex-wrap items-center justify-between gap-2">
    <div><h2 className="font-semibold">{person.name??person.roll??"Student"}</h2>
     <p className="text-xs text-muted-foreground">{person.roll??"No roll number"} · {person.email??"No email"}</p></div>
    <strong>{person.placed?"Joined (confirmed)":"No confirmed joining recorded"}</strong>
   </div>
   {!person.applications.length?<p className="text-sm">No applications found.</p>:<div className="overflow-x-auto"><table className="w-full min-w-[43rem] text-sm">
    <thead><tr className="border-b border-border text-left"><th className="p-2">Company / drive</th>
     <th className="p-2">Application</th><th className="p-2">Offer</th>
     <th className="p-2">Joining</th></tr></thead>
    <tbody>{person.applications.map((row,i)=><tr key={row.jobId+":"+i} className="border-b border-border">
     <td className="p-2">{row.company} · {row.job}</td><td className="p-2">{row.applicationStatus}</td>
     <td className="p-2">{row.offerStatus??"None"}</td><td className="p-2">{row.joining??"Not recorded"}</td>
    </tr>)}</tbody>
   </table></div>}
   {person.truncated?<p className="text-xs text-muted-foreground">Showing newest 100 application/offer records.</p>:null}
  </section>)}
  {data?.truncated?<p className="text-xs text-muted-foreground">Showing first 15 matching students; narrow the search.</p>:null}
 </div>;
}
