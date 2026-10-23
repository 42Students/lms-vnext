import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {mentorUnifiedSearchQuery,searchMentorWorkspace} from
  "@/modules/projects/mentor-unified-search-service";

type Params={q?:string|string[]};
export default async function MentorSearchPage({searchParams}:{
  searchParams:Promise<Params>;
}){
  const raw=await searchParams;
  const q=Array.isArray(raw.q)?raw.q[0]??"":raw.q??"";
  const parsed=q.trim()?mentorUnifiedSearchQuery.safeParse(q):null;
  const invalid=parsed!==null&&!parsed.success;
  const results=parsed?.success
    ? await searchMentorWorkspace(await getCurrentRequestContext(),parsed.data) : [];
  const groups=["Project","Task","Student","Resource"] as const;
  return <div className="prototype-mentor-search-page">
    <PageHeader title="Search" description="Search only projects and people you can access as a Mentor."/>
    <form method="get" action="/mentor/search" role="search" className="prototype-mentor-search-form">
      <label htmlFor="mentor-unified-search">Find a team, project, student or task</label>
      <div><input autoFocus id="mentor-unified-search" name="q" type="search"
        minLength={1} maxLength={100} defaultValue={q} placeholder="Find a team, project, student or task"
        required/><button type="submit">Search</button></div>
    </form>
    {invalid?<p role="alert">Search must be between 1 and 100 characters.</p>:null}
    {!parsed?<p role="status">Enter a search term to find matching work in your assigned projects.</p>:null}
    {parsed?.success&&results.length===0?<p role="status">
      No matching projects, tasks, students or resources in your current Mentor workspaces.
    </p>:null}
    {groups.map(kind=>{
      const matching=results.filter(row=>row.kind===kind);
      if(!matching.length)return null;
      return <section key={kind} className="prototype-mentor-search-results"
        aria-label={kind+" search results"}>
        <h2>{kind==="Project"?"Teams and projects":kind==="Task"?"Tasks":
          kind==="Student"?"Students":"Resources"} · {matching.length}</h2>
        <ul>{matching.map(row=><li key={row.key}><Link href={row.href}>
          <strong>{row.title}</strong><small>{row.context}</small><span>Open →</span>
        </Link></li>)}</ul>
      </section>;
    })}
    {parsed?.success&&results.length>0?<p className="prototype-mentor-search-note">
      Only your currently assigned projects and their active team members are searchable.
      Results are limited per category.
    </p>:null}
  </div>;
}
