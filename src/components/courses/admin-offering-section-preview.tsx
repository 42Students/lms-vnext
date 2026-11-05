"use client";
import {useRef} from "react";
import type {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";
import { Select } from "@/components/ui/select";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";
import { Label } from "@/components/ui/label";

type Preview=Awaited<ReturnType<typeof listOfferingSectionPreview>>;
function ItemList({items}:{items:readonly {
 id:string;title:string;status:string;sequence:number;scope:string;kind?:string;
 studentVisible:boolean;
}[]}){
 if(!items.length)return <p className="text-xs text-muted-foreground">No items for this Section.</p>;
 return <ul className="divide-y divide-border border-y border-border">{items.map(item=><li key={item.id}
  className="flex min-w-0 flex-col gap-[var(--lms-space-2)] py-[var(--lms-space-3)] text-sm sm:flex-row sm:items-center sm:justify-between">
  <span className="break-words">{item.title}
   {item.kind?<span className="ml-1 text-xs text-muted-foreground">({item.kind.replaceAll("_"," ")})</span>:null}
  </span>
  <span className="flex min-w-0 flex-wrap items-center gap-2 text-xs text-muted-foreground">{item.scope==="SECTION"?"Section-specific":"Shared offering"}
   <StatusBadge tone={item.status==="PUBLISHED"?"success":item.status==="ARCHIVED"?"neutral":"warning"}>{item.status}</StatusBadge> #{item.sequence+1}
   <StatusBadge tone={item.studentVisible?"success":"neutral"}>{item.studentVisible?"Visible to students":"Not visible to students"}</StatusBadge></span>
 </li>)}</ul>;
}
export function AdminOfferingSectionPreview({data}:{data:Preview}){
 const form=useRef<HTMLFormElement>(null);
 const hasMultipleClasses=data.options.length>1||data.truncated;
 return <section id="section-content" className="min-w-0 scroll-mt-24 space-y-[var(--lms-space-4)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]"
  aria-label="Section course content">
  <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
   <div className="space-y-1">
    <Heading level={2} className="m-0 text-[length:var(--lms-font-lg)] leading-7 text-[var(--lms-heading)]">Lessons</Heading>
    <p className="max-w-[75ch] text-sm leading-5 text-muted-foreground">
     {data.selected?"What the selected class can see, including shared lessons and section-specific items.":"All content in this course (every section)"}
    </p>
   </div>
   {hasMultipleClasses?<form ref={form} method="get" className="min-w-0 max-w-full">
    <Label className="block" htmlFor="offering-class-filter">Class</Label>
    <Select id="offering-class-filter" className="mt-2 w-[220px] max-w-full min-h-11 md:min-h-9"
     name="deliveryId" value={data.selected?.deliveryId??""}
     onChange={()=>form.current?.requestSubmit()}>
     <option value="">All content in this course (every section)</option>
     {data.options.map(item=><option value={item.deliveryId} key={item.deliveryId}>
      {item.sectionName}: what its students see
     </option>)}
    </Select>
   </form>:null}
  </div>
  {data.invalid?<Alert tone="error">The selected Section is unavailable for this Course Offering. <TextLink href="#section-content">Retry</TextLink></Alert>:null}
  {data.truncated?<Alert tone="info">
    The class picker shows the first 200 active sections. To inspect a class outside this list, use its authorized delivery ID below.
    <form method="get" className="mt-2 flex flex-wrap items-center gap-2">
     <Label htmlFor="additional-section-id">Section delivery ID</Label>
     <Input id="additional-section-id" name="deliveryId" type="text" pattern="[0-9a-fA-F-]{36}" maxLength={36}
      placeholder="Delivery UUID" className="w-[240px] max-w-full"/>
     <Button type="submit" >Find class</Button>
    </form>
   </Alert>:null}
  {!data.invalid?<div className="space-y-3">
   <p className="text-sm font-semibold">{data.selected
    ? `Viewing ${data.selected.sectionName} (${data.selected.sectionCode})`
    : "All content in this course (every section)"}</p>
   <Alert tone="info">{data.selected
    ? "The student-visible summary is scoped to this Section and publication flags only. It does not represent a specific learner's enrollment, release conditions or progress, and does not expose private file, video or meeting URLs."
    : "All content is grouped by lesson. Section-specific items may be visible only to students in their assigned class; shared items are listed once."}</Alert>
   {data.lessons.map(lesson=><div key={lesson.id} className="space-y-3 border-b border-border py-4">
    <Heading level={3} className="flex min-w-0 flex-wrap items-center gap-2 text-foreground">{lesson.name}
     <StatusBadge tone={lesson.visibleToStudents?"success":"neutral"}>{lesson.visibleToStudents?"Lesson visible":"Lesson hidden"}</StatusBadge>
    </Heading>
    <div className="space-y-1 rounded-[var(--lms-control-radius)] border border-border p-3" aria-label="Student-visible items">
     <Heading level={4} size="sm" className="text-foreground">Published items visible in this Section</Heading>
     {!lesson.visibleToStudents || lesson.lessonStatus!=="ACTIVE" ? <p className="text-xs text-muted-foreground">This lesson is not currently visible to learners.</p> : null}
     <ItemList items={[...lesson.contents,...lesson.assignments,...lesson.quizzes].filter(item=>item.studentVisible)}/>
     <p className="text-xs text-muted-foreground">Item titles only · secure media and per-learner checks remain in the learner workspace.</p>
    </div>
    <div className="space-y-1"><Heading level={4} size="sm" className="text-foreground">Videos, Resources and Live Classes ({lesson.contents.length})</Heading>
     <ItemList items={lesson.contents}/></div>
    <div className="space-y-1"><Heading level={4} size="sm" className="text-foreground">Assignments ({lesson.assignments.length})</Heading>
     <ItemList items={lesson.assignments}/></div>
    <div className="space-y-1"><Heading level={4} size="sm" className="text-foreground">Quizzes ({lesson.quizzes.length})</Heading>
     <ItemList items={lesson.quizzes}/></div>
   </div>)}
   {!data.lessons.length?<p className="text-sm text-muted-foreground">No Lessons have been created for this offering.</p>:null}
  </div>:null}
 </section>;
}
