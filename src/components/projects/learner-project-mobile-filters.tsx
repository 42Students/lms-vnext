"use client";
import {useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import type {ProjectParticipantListQuery} from "./project-participant-list-controls";
import {learnerProjectMobileFilterSummary} from "@/modules/projects/learner-project-mobile-filter-model";

const statuses = [
  ["CURRENT","Current only"],["ACTIVE","Active"],["IN_PROGRESS","In progress"],
  ["READY","Ready"],["BLOCKED","Blocked"],["ARCHIVED","Archived"],
] as const;

/** Same always-visible, wrapping filter row as the legacy Projects screen.
 * GET submissions preserve bookmarkable deep links and reset pagination when
 * a filter changes; typing waits 350 ms before submitting all current filters. */
export function LearnerProjectMobileFilters({query}:{query:ProjectParticipantListQuery}){
  const active=learnerProjectMobileFilterSummary(query);
  const form=useRef<HTMLFormElement|null>(null);
  const debounce=useRef<ReturnType<typeof setTimeout>|null>(null);
  const [search,setSearch]=useState(query.search??"");
  const [searchPending,setSearchPending]=useState(false);
  useEffect(()=>{setSearch(query.search??"");setSearchPending(false);},[query.search]);
  useEffect(()=>()=>{if(debounce.current)clearTimeout(debounce.current);},[]);
  function cancelDebounce(){
    if(debounce.current){clearTimeout(debounce.current);debounce.current=null;}
  }
  function submitFilters(event:FormEvent<HTMLFormElement>){
    if(event.target instanceof HTMLSelectElement){
      cancelDebounce();
      setSearchPending(false);
      form.current?.requestSubmit();
    }
  }
  function scheduleSearch(next:string){
    setSearch(next.slice(0,100));
    cancelDebounce();
    setSearchPending(true);
    debounce.current=setTimeout(()=>{
      debounce.current=null;
      form.current?.requestSubmit();
    },350);
  }
  const label="grid min-w-0 gap-[6px] text-[length:var(--lms-font-sm)] font-semibold leading-4 text-[13px] text-[var(--lms-neutral-400)]";
  return (
    <section className="min-w-0 space-y-2 min-[768px]:hidden" aria-label="Project search and filters">
      <form ref={form} method="get" action="/learn/projects"
        onChange={submitFilters} aria-busy={searchPending}
        className="flex min-w-0 flex-wrap items-end gap-3 border-b border-border pb-4">
        <div className={label+" w-full sm:w-[300px]"}>
          <label htmlFor="learner-project-search">Search</label>
          <div className="relative min-w-0">
            <Input id="learner-project-search" type="search" name="search"
              aria-label="Search my projects" autoComplete="off"
              maxLength={100} value={search}
              onChange={event=>scheduleSearch(event.target.value)}
              placeholder="Search project title, course or slug"
              className={"min-h-11 w-full pr-11 "+(search?"[background-image:none]":"")} />
            {search ? (
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Clear project search"
                className="absolute inset-y-0 right-0 my-auto"
                onClick={()=>{scheduleSearch("");}}>
                <span aria-hidden="true">×</span>
              </Button>
            ):null}
          </div>
        </div>
        <label className={label+" w-full sm:w-[170px]"}>Status
          <Select name="status" defaultValue={query.status??""} className="min-h-11 w-full">
            <option value="">All statuses</option>
            {statuses.map(([value,text])=><option value={value} key={value}>{text}</option>)}
          </Select>
        </label>
        <label className={label+" w-full sm:w-[210px]"}>Attention
          <Select name="attention" defaultValue={query.attention??""} className="min-h-11 w-full"
            aria-label="Project attention">
            <option value="">All attention states</option>
            <option value="LEARNER_ACTION">Needs my action</option>
            <option value="BLOCKED">Blocked</option>
          </Select>
        </label>
        <label className={label+" w-full sm:w-[170px]"}>Work attention
          <Select name="work" defaultValue={query.work??""} className="min-h-11 w-full">
            <option value="">All work</option>
            <option value="BLOCKED">Has blocked tasks</option>
            <option value="NO_TASKS">No tracked tasks yet</option>
          </Select>
        </label>
        <label className={label+" w-full sm:w-[170px]"}>Sort projects
          <Select name="sort" defaultValue={query.sort??"RECENT"} className="min-h-11 w-full">
            <option value="RECENT">Recently updated</option>
            <option value="TITLE">Title A–Z</option>
            <option value="PROGRESS">Least progress first</option>
          </Select>
        </label>
        <label className={label+" w-full sm:w-[170px]"}>Results per page
          <Select name="pageSize" defaultValue={String(query.pageSize??25)} className="min-h-11 w-full">
            {[10,25,50].map(size=><option value={size} key={size}>{size}</option>)}
          </Select>
        </label>
        <Button type="submit" className="min-h-11" onClick={cancelDebounce}>Apply</Button>
        <Link href="/learn/projects" onClick={cancelDebounce}
          className="inline-flex min-h-11 items-center rounded-[var(--lms-control-radius)] border border-border px-3 text-sm font-semibold text-body hover:bg-primary-subtle">
          Clear filters
        </Link>
      </form>
      <p role="status" aria-live="polite" className="m-0 text-xs leading-5 text-muted-foreground">
        {searchPending?"Updating project search…":active.count>0
          ?"Active: "+active.labels.join(" · "):"Showing all projects"}
      </p>
    </section>
  );
}
