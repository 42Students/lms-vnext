"use client";

import Link from "next/link";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {PopoverListbox} from "@/components/ui/popover";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ShellNavItem } from "../shell-model";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import {mentorSearchFeedback} from "@/modules/projects/mentor-command-search-feedback-model";

type LearnerCourse = { deliveryId: string; courseName: string; courseCode: string; sectionName: string; departmentName?: string; shortTitle?: string };
type MentorCommandResult={
  key:string;kind:"Project"|"Task"|"Student"|"Resource";
  title:string;context:string;href:string;
};
import { topbarCommands, topbarConfigForPath, topbarSearchDestinations } from "./portal-config";
import { SearchIcon } from "./icons";
import { TpoFindSuggestions } from "./tpo-find-suggestions";
import {FacultyFindSuggestions} from "./faculty-find-suggestions";
import { RecruiterFindSuggestions } from "./recruiter-find-suggestions";
import style from "./topbar.module.css";

export function TopbarCommandSearch({ items }: { items: readonly ShellNavItem[] }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const config = topbarConfigForPath(pathname);
  const courseMode = config.portal === "learn" && !pathname.startsWith("/learn/my-placements");
  const [query, setQuery] = useState("");
  const [mentorLookup,setMentorLookup]=useState<{
    term:string;results:readonly MentorCommandResult[];failed:boolean;pending:boolean;
  }>({term:"",results:[],failed:false,pending:false});
  const [courses, setCourses] = useState<LearnerCourse[]>([]);
  const [courseError, setCourseError] = useState<string | null>(null);
  const [queryError, setQueryError] = useState("");
  const [courseLoading, setCourseLoading] = useState(courseMode);
  const [reloadCourses,setReloadCourses]=useState(0);
  const [recentIds,setRecentIds]=useState<string[]>([]);
  const [popularity,setPopularity]=useState<Record<string,number>>({});
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const selectionWriteRef=useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const skipNextFocusOpen=useRef(false);
  function closeSearch(restoreFocus=false){
    setOpen(false);setMobileOpen(false);
    setMentorLookup({term:"",results:[],failed:false,pending:false});
    if(restoreFocus && document.activeElement!==input.current){
      skipNextFocusOpen.current=true;
      input.current?.focus();
    }
  }
  // Recent history is session-only and is always intersected with authorized courses.
  useEffect(()=>{
    if(!courseMode)return;
    try {
      const ids:unknown=JSON.parse(sessionStorage.getItem("lms-course-search-recent")??"[]");
      const counts:unknown=JSON.parse(sessionStorage.getItem("lms-course-search-counts")??"{}");
      if(Array.isArray(ids))setRecentIds(ids.filter((id):id is string=>typeof id==="string").slice(0,10));
      if(counts&&typeof counts==="object"&&!Array.isArray(counts))
        setPopularity(Object.fromEntries(Object.entries(counts).filter(([,v])=>typeof v==="number"&&Number.isSafeInteger(v)&&v>=0)));
    }catch{setRecentIds([]);setPopularity({});}
  },[courseMode]);
  function rememberCourse(id:string){
    const nextRecent=[id,...recentIds.filter(item=>item!==id)].slice(0,10);
    const nextCounts={...popularity,[id]:(popularity[id]??0)+1};
    setRecentIds(nextRecent);setPopularity(nextCounts);
    try {
      sessionStorage.setItem("lms-course-search-recent",JSON.stringify(nextRecent));
      sessionStorage.setItem("lms-course-search-counts",JSON.stringify(nextCounts));
    }catch{/* Storage is optional. */}
    // Send the selected authorized delivery to the scoped usage ledger.
    // Navigation is never blocked by a failed optional popularity write.
    if(selectionWriteRef.current)return;
    selectionWriteRef.current = true;
    void fetch("/api/courses/search/selection",{
      method:"POST",credentials:"same-origin",keepalive:true,
      headers:{"content-type":"application/json"},
      body:JSON.stringify({deliveryId:id}),
    }).then(response=>{
      if (!response.ok) setCourseError("Course selection could not be recorded. Retry by selecting the course again.");
    }).catch(()=>{
      setCourseError("Course selection could not be recorded. Retry by selecting the course again.");
    }).finally(()=>{selectionWriteRef.current = false;});
  }
  // Preserve the old learner header's authorized course lookup when moving
  // its search box into the common command bar.
  useEffect(() => {
    if (!courseMode) {setCourses([]);setCourseLoading(false);return;}
    let cancelled = false;
    setCourseLoading(true);
    setCourseError(null);
    void apiFetch<unknown>("/api/courses/learner", { cache: "no-store" })
      .then(payload => {
        if (cancelled) return;
        const value = payload && typeof payload === "object" &&
          "courses" in payload ? (payload as {courses: unknown}).courses : null;
        if (!Array.isArray(value)) throw new Error("Invalid courses");
        setCourses(value.filter((row): row is LearnerCourse =>
          row && typeof row === "object" &&
          typeof row.deliveryId === "string" &&
          typeof row.courseName === "string" &&
          typeof row.courseCode === "string" &&
          typeof row.sectionName === "string",
        ));
        setCourseError(null);
        setCourseLoading(false);
        void apiFetch<{counts:Record<string,number>}>(
          "/api/courses/search/selection",{cache:"no-store"})
          .then(value=>{if(!cancelled)setPopularity(value.counts??{});})
          .catch(()=>{
            if (!cancelled) setCourseError("Popular course suggestions are unavailable. Retry to refresh.");
          });
      })
      .catch(error => {
        if (!cancelled) {
          setCourseError(error instanceof FriendlyFetchError && error.status===401
            ? "Authentication required"
            : "Could not load courses. Search shortcuts remain available.");
          setCourseLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [courseMode,reloadCourses]);
  const courseMatches=useMemo(()=>{
    if(!courseMode)return [];
    const search=query.trim().toLocaleLowerCase("en-IN");
    const result=courses.filter(course=>!search||
      [course.courseName,course.courseCode,course.sectionName,course.shortTitle??"",course.departmentName??""]
        .some(value=>value.toLocaleLowerCase("en-IN").includes(search)));
    return search?result.slice(0,15):result.sort((x,y)=>
      (popularity[y.deliveryId]??0)-(popularity[x.deliveryId]??0)||
      x.courseName.localeCompare(y.courseName)).slice(0,10);
  },[courseMode,courses,query,popularity]);
  const courseById=useMemo(()=>new Map(courses.map(course=>[course.deliveryId,course])),[courses]);
  const recentCourses=courseMode&&!query.trim()?recentIds.map(id=>courseById.get(id))
    .filter((course):course is LearnerCourse=>Boolean(course)):[];
  const displayedCourses=!query.trim()?courseMatches.filter(course=>!recentIds.includes(course.deliveryId)):courseMatches;
  const commands = useMemo(() => topbarCommands(pathname, items), [pathname, items]);
  const destinations = topbarSearchDestinations(pathname, query);
  const mentorTerm=query.trim();
  const mentorFeedback=mentorSearchFeedback({
    portal:config.portal,query:mentorTerm,lookupTerm:mentorLookup.term,
    pending:mentorLookup.pending,failed:mentorLookup.failed,
    resultCount:mentorLookup.results.length,
  });
  const mentorResults=mentorFeedback==="RESULTS"?mentorLookup.results:[];
  // All returned results have already passed the server's active Mentor
  // membership, role, college and assigned-project checks.
  useEffect(()=>{
    if(config.portal!=="mentor"||!open||query.trim().length<2)return;
    const term=query.trim().slice(0,100);
    const controller=new AbortController();
    const handle=window.setTimeout(()=>{
      setMentorLookup({term,results:[],failed:false,pending:true});
      void apiFetch<{results:MentorCommandResult[]}>(
        "/api/mentor/search?q="+encodeURIComponent(term),
        {cache:"no-store",signal:controller.signal},
      ).then(payload=>{
        if(controller.signal.aborted)return;
        const results=Array.isArray(payload.results)?
          payload.results.filter(row=>typeof row.key==="string"&&
            typeof row.title==="string"&&typeof row.context==="string"&&
            typeof row.href==="string"&&row.href.startsWith("/mentor/")&&
            !row.href.startsWith("//")).slice(0,60):[];
        setMentorLookup({term,results,failed:false,pending:false});
      }).catch(()=>{
        if(!controller.signal.aborted)setMentorLookup({term,results:[],failed:true,pending:false});
      });
    },180);
    return ()=>{window.clearTimeout(handle);controller.abort();};
  },[config.portal,open,query]);
  const matches = useMemo(() => {
    const search = query.trim().toLocaleLowerCase("en-IN");
    return (search ? commands.filter(command =>
      command.label.toLocaleLowerCase("en-IN").includes(search)) : commands).slice(0, 8);
  }, [query, commands]);

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(true);
        setMobileOpen(true);
        requestAnimationFrame(() => input.current?.focus());
      }
      if (event.key === "Escape" && open && !event.defaultPrevented &&
          event.target instanceof Node && root.current?.contains(event.target)) {
        event.preventDefault();
        closeSearch();
      }
    };
    const outside = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        closeSearch();
      }
    };
    document.addEventListener("keydown", shortcut);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", shortcut);
      document.removeEventListener("pointerdown", outside);
    };
  }, [open]);

  function submit() {
    // Enter follows the same role-scoped Faculty option that a pointer click uses.
    if(config.portal==="teacher"&&query.trim().length>=2){
      const suggestion=root.current?.querySelector<HTMLButtonElement>(
        'section[aria-label="Matching Faculty records"] button[role="option"]');
      if(suggestion){suggestion.click();return;}
    }
    if (query.trim().length > 200) {
      setQueryError("Query length must not exceed 200");
      setOpen(true);
      return;
    }
    if (query.trim() && courseMatches[0]) {
      rememberCourse(courseMatches[0].deliveryId);
      router.push("/learn/courses/" + encodeURIComponent(courseMatches[0].deliveryId) + "/home");
    } else if (config.portal==="mentor"&&mentorResults[0]) {
      router.push(mentorResults[0].href);
    } else if (matches[0]) {
      router.push(matches[0].href);
    } else if (destinations[0]) {
      router.push(destinations[0].href);
    } else if (query.trim()) {
      // The destination applies the portal\u0027s own tenant and role policy.
      router.push(config.searchHref + "?q=" + encodeURIComponent(query.trim().slice(0,100)));
    }
    setQuery("");
    closeSearch();
  }
  function courseResult(course:LearnerCourse){
    return <Link key={course.deliveryId} role="option" aria-selected={false}
      href={"/learn/courses/"+encodeURIComponent(course.deliveryId)+"/home"} className={style["suggestion"]}
      onClick={()=>{rememberCourse(course.deliveryId);setQuery("");closeSearch();}}>
      <SearchIcon/> <span className="min-w-0"><span className="block truncate">{course.shortTitle||course.courseName}</span>
        <span className="block truncate text-[length:var(--lms-topbar-caption-size,11px)] text-muted-foreground">{course.departmentName||course.sectionName} · {course.courseCode}</span>
      </span>
    </Link>;
  }

  return <div ref={root}
    className={mobileOpen ? style["searchOpen"]+" min-w-0" : "min-w-0"}>
    <div className={style["search"]}>
      <div className={style["searchBox"]}>
        <Button variant="ghost" size="sm" type="button" aria-label="Open command search"
          onClick={() => {
            setOpen(true);
            setMobileOpen(true);
            input.current?.focus();
          }}
          className="inline-flex shrink-0 items-center justify-center text-body">
          <SearchIcon />
        </Button>
        <label className="sr-only" htmlFor="lms-topbar-command-search">Search workspace</label>
        <Input id="lms-topbar-command-search" ref={input} type="search" value={query} maxLength={200}
          autoComplete="off" role="combobox" aria-haspopup="listbox" aria-keyshortcuts="Control+K Meta+K"
          aria-controls={open ? "lms-topbar-command-results" : undefined} aria-expanded={open} aria-describedby="lms-topbar-command-key-help"
          placeholder={config.placeholder} className={style["searchInput"]}
          onFocus={() => {
            if(skipNextFocusOpen.current){skipNextFocusOpen.current=false;return;}
            if(!open)setMentorLookup({term:"",results:[],failed:false,pending:false});
            setOpen(true);setMobileOpen(true);
          }}
          onChange={event => {
            if (event.target.value.length>200) {
              setQueryError("Query length must not exceed 200");
            } else {
              setQueryError("");
              setQuery(event.target.value);
            }
            setOpen(true);
          }}
          onKeyDown={event => {
            if (event.key === "Enter") { event.preventDefault(); submit(); }
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && open) {
              const options = root.current?.querySelectorAll<HTMLElement>('[role="option"]');
              const target = event.key === "ArrowDown" ? options?.[0] : options?.[options.length - 1];
              if (target) { event.preventDefault(); target.focus(); }
            }
            if (event.key === "Escape") { event.preventDefault(); setOpen(false); setMobileOpen(false); }
          }}/>
        <kbd id="lms-topbar-command-key-help" className={style["searchHint"]}>Ctrl K</kbd>
      </div>
      {open ? <PopoverListbox id="lms-topbar-command-results" label="Workspace commands" className={style["dropdown"]}
        onDismiss={() => closeSearch(true)}
        onKeyDown={event => {
          if (event.defaultPrevented || event.nativeEvent.isComposing) return;
          if (event.key === "Escape") {
            event.preventDefault();
            closeSearch(true);
            return;
          }
          if (event.target instanceof Element &&
              event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
          if (event.key === "Backspace" && !event.ctrlKey && !event.metaKey && !event.altKey) {
            event.preventDefault();
            setQuery(value => value.slice(0, -1));
            input.current?.focus();
            return;
          }
          if (!event.ctrlKey && !event.metaKey && !event.altKey &&
              event.key.length === 1) {
            event.preventDefault();
            setQuery(value => (value + event.key).slice(0, 200));
            input.current?.focus();
            return;
          }
          if (event.defaultPrevented ||
              !["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
          const options = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('[role="option"]'));
          const index = options.findIndex(option => option === event.target);
          if (index < 0 || options.length === 0) return;
          event.preventDefault();
          const next = event.key === "Home" ? 0
            : event.key === "End" ? options.length - 1
            : event.key === "ArrowDown" ? (index + 1) % options.length
            : (index - 1 + options.length) % options.length;
          options[next]?.focus();
        }}>
                {courseMode && courseLoading ?
          <p role="status" className="px-2 py-2 text-xs text-muted-foreground leading-[20px]">Loading your courses…</p> : null}
        {queryError ? <p role="alert" className="px-2 py-2 text-xs text-error leading-[20px]">{queryError}</p> : null}
        {courseMode && courseError ? <div role="alert" className="px-2 py-2 text-xs text-error leading-[20px]">{courseError} <Button type="button" variant="link" size="sm" onClick={()=>setReloadCourses(v=>v+1)}>Retry</Button></div> : null}
        {recentCourses.length>0?<p className="border-t border-[var(--lms-canvas-border)] px-2 pt-2 text-xs font-semibold text-muted-foreground">Recent</p>:null}
        {recentCourses.map(courseResult)}
        {displayedCourses.length>0?<p className="border-t border-[var(--lms-canvas-border)] px-2 pt-2 text-xs font-semibold text-muted-foreground">{query.trim()?"Search Results":"Popular"}</p>:null}
        {displayedCourses.map(courseResult)}
        {courseMode&&!courseLoading&&!courseError&&courseMatches.length===0?
          <p role="status" className="px-2 py-2 text-xs text-muted-foreground">No courses found</p>:null}
        {config.portal === "hr" && query.trim().length >= 2
          ? <RecruiterFindSuggestions query={query} onOpen={href => {
              router.push(href);
              setQuery("");
              closeSearch();
            }}/> : null}
        {config.portal === "teacher" && query.trim().length >= 2
          ? <FacultyFindSuggestions query={query} onOpen={href=>{
              router.push(href);
              setQuery("");
              closeSearch();
            }}/> : null}
        {config.portal === "tpo" && query.trim().length >= 2
          ? <TpoFindSuggestions query={query} onOpen={href => {
              router.push(href);
              setQuery("");
              closeSearch();
            }}/> : null}
        {mentorFeedback==="LOADING"?<p role="status" aria-live="polite"
          className="p-2 text-xs text-muted-foreground">
          Searching assigned Mentor projects…
        </p>:null}
        {mentorFeedback==="FAILED"?
          <p role="alert" className="p-2 text-xs text-error">
            Mentor results could not be loaded. Open the full search page to retry.
          </p>:null}
        {mentorFeedback==="EMPTY"?
          <p role="status" className="p-2 text-xs text-muted-foreground">
            No matches in your assigned Mentor projects.
          </p>:null}
        {(["Student","Task","Project","Resource"] as const).map(kind=>{
          const group=mentorResults.filter(result=>result.kind===kind);
          if(!group.length)return null;
          return <div key={kind}>
            <p className="border-t border-border px-2 pt-2 text-xs font-semibold uppercase text-muted-foreground">
              {kind==="Student"?"Students":kind==="Task"?"Tasks":
                kind==="Project"?"Go to projects":"Resources"}
            </p>
            {group.map(result=><Link key={result.key} role="option"
              aria-selected={false} href={result.href} className={style["suggestion"]}
              onClick={()=>{setQuery("");closeSearch();}}>
              <SearchIcon/><span className="min-w-0">
                <span className="block truncate">{result.title}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {result.context}
                </span>
              </span>
            </Link>)}
          </div>;
        })}
        {destinations.length > 0 ? <p className="border-t border-[var(--lms-canvas-border)] px-2 pt-2 text-[length:var(--lms-topbar-caption-size,11px)] font-semibold uppercase tracking-wide text-muted-foreground">Search within</p> : null}
        {destinations.map(destination => <Link key={destination.href}
          role="option" aria-selected={false} href={destination.href}
          className={style["suggestion"]}
          onClick={() => { setQuery(""); setOpen(false); setMobileOpen(false); }}>
          <SearchIcon/> {destination.label}
        </Link>)}
        {matches.length > 0 ? <p className="border-t border-[var(--lms-canvas-border)] px-2 pt-2 text-[length:var(--lms-topbar-caption-size,11px)] font-semibold uppercase tracking-[.08em] text-muted-foreground">Go to</p> : null}
        {matches.map(command => <Link role="option" aria-selected={false}
          key={command.href} href={command.href} className={style["suggestion"]}
          onClick={() => { setQuery(""); setOpen(false); setMobileOpen(false); }}>
          <SearchIcon /> {command.label}
        </Link>)}
        {matches.length === 0 && destinations.length === 0 && courseMatches.length === 0 && !courseMode &&
          !(config.portal === "tpo" && query.trim().length >= 2) &&
          !(config.portal === "teacher" && query.trim().length >= 2) && !courseLoading ? <p role="status" className="min-w-0 break-words p-2 text-xs text-muted-foreground leading-[20px]">
          No matching shortcuts. Press Enter to search this portal.
        </p> : null}
      </PopoverListbox> : null}
    </div>
  </div>;
}
