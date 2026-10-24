import Link from "next/link";
import {mentorSearchHighlightParts} from "@/modules/projects/mentor-search-ranking-model";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {mentorUnifiedSearchQuery,mentorSearchPageSchema,searchMentorWorkspacePage} from
  "@/modules/projects/mentor-unified-search-service";

type Params={q?:string|string[];page?:string|string[]};
export default async function MentorSearchPage({searchParams}:{
  searchParams:Promise<Params>;
}){
  const raw=await searchParams;
  const q=Array.isArray(raw.q)?raw.q[0]??"":raw.q??"";
  const parsed=q.trim()?mentorUnifiedSearchQuery.safeParse(q):null;
  const pageRaw=Array.isArray(raw.page)?raw.page[0]:raw.page;
  const pageParse=mentorSearchPageSchema.safeParse(pageRaw??"0");
  const invalid=(parsed!==null&&!parsed.success)||!pageParse.success;
  const page=pageParse.success?pageParse.data:0;
  const found=parsed?.success&&pageParse.success
    ?await searchMentorWorkspacePage(await getCurrentRequestContext(),
       parsed.data,page):{results:[],hasMore:false,page:0};
  const results=found.results;
  const destination=(toPage:number)=>"/mentor/search?"+
    new URLSearchParams({q:parsed?.success?parsed.data:"",page:String(toPage)}).toString();
  const groups=["Project","Task","Student","Resource"] as const;
  return <div className="prototype-mentor-search-page">
    <PageHeader title="Search" description="Search only projects and people you can access as a Mentor."/>
    <form method="get" action="/mentor/search" role="search" className="prototype-mentor-search-form">
      <label htmlFor="mentor-unified-search">Find a team, project, student or task</label>
      <div><input autoFocus id="mentor-unified-search" name="q" type="search"
        minLength={1} maxLength={100} defaultValue={q} placeholder="Find a team, project, student or task"
        required/><button type="submit">Search</button></div>
    </form>
    {invalid?<p role="alert">Search must be between 1 and 100 characters, with a valid results page.</p>:null}
    {!parsed?<p role="status">Enter a search term to find matching work in your assigned projects.</p>:null}
    {parsed?.success&&results.length===0?<p role="status">
      {page>0?"No further results on this page. Return to an earlier page.": 
        "No matching projects, tasks, students or resources in your current Mentor workspaces."}
    </p>:null}
    {groups.map(kind=>{
      const matching=results.filter(row=>row.kind===kind);
      if(!matching.length)return null;
      return <section key={kind} className="prototype-mentor-search-results"
        aria-label={kind+" search results"}>
        <h2>{kind==="Project"?"Teams and projects":kind==="Task"?"Tasks":
          kind==="Student"?"Students":"Resources"} · {matching.length}</h2>
        <ul>{matching.map(row=><li key={row.key}><Link href={row.href}>
          <strong>{mentorSearchHighlightParts(row.title,parsed?.success?parsed.data:"")
             .map((part,index)=>part.highlight?
               <mark key={index} className="rounded bg-primary-subtle text-foreground">{part.text}</mark>:
               <span key={index}>{part.text}</span>)}</strong>
          <small>{row.context}</small><span>Open →</span>
        </Link></li>)}</ul>
      </section>;
    })}
    {parsed?.success&&pageParse.success?<nav
      aria-label="Mentor search results pagination"
      className="flex flex-wrap items-center gap-4">
      {page>0?<Link className="min-h-11 text-link underline"
        href={destination(page-1)}>← Previous results</Link>:null}
      <span aria-live="polite">Page {page+1}</span>
      {found.hasMore?<Link className="min-h-11 text-link underline"
        href={destination(page+1)}>More results →</Link>:null}
    </nav>:null}
    {parsed?.success&&results.length>0?<p className="prototype-mentor-search-note">
      Only currently assigned Mentor projects and their active members are searchable.
      Up to 15 matches per category appear on each page.
    </p>:null}
  </div>;
}
