import type {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { StatusBadge } from "@/components/ui/status-badge";

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
 return <section id="section-content" className="min-w-0 scroll-mt-24 space-y-[var(--lms-space-4)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-4)]"
  aria-label="Section course content">
  <div className="space-y-1">
   <h2 className="m-0 text-[var(--lms-font-lg)] font-semibold leading-7 text-[var(--lms-heading)]">Section content</h2>
   <p className="max-w-[75ch] text-sm leading-5 text-muted-foreground">Select a Section to see its authorized shared and Section-specific learning items. This is not an impersonated learner session.</p>
  </div>
  <form method="get" className="grid min-w-0 items-end gap-[var(--lms-space-3)] md:grid-cols-[minmax(0,1fr)_auto]">
   <label className="grid min-w-0 flex-1 gap-[6px] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Section
    <Select className="min-h-11 md:min-h-9"
     name="deliveryId" defaultValue={data.selected?.deliveryId??""}>
     <option value="">Shared Learning Path overview (select a Section for its syllabus)</option>
     {data.options.map(item=><option value={item.deliveryId} key={item.deliveryId}>
      {item.sectionName} ({item.sectionCode})
     </option>)}
    </Select>
   </label>
   <Button variant="primary" type="submit" className="min-h-11 w-full justify-center md:min-h-9 md:w-auto">View Section</Button>
  </form>
  {data.invalid?<Alert tone="error">The selected Section is unavailable for this Course Offering.</Alert>:null}
  {data.truncated?<Alert tone="info">Only the first 200 active Sections are listed. A selected Section outside this list is verified independently; use Section management for the full directory.</Alert>:null}
  {data.selected?<div className="space-y-3">
   <p className="text-sm font-semibold">Viewing {data.selected.sectionName} ({data.selected.sectionCode})</p>
   <Alert tone="info">The student-visible summary below is scoped to this Section and publication flags only. It does not represent a specific learner's enrollment, release conditions or progress, and does not expose private file, video or meeting URLs.</Alert>
   {data.lessons.map(lesson=><div key={lesson.id} className="space-y-3 border-b border-border py-4">
    <h3 className="flex min-w-0 flex-wrap items-center gap-2 font-semibold text-foreground">{lesson.name}
     <StatusBadge tone={lesson.visibleToStudents?"success":"neutral"}>{lesson.visibleToStudents?"Lesson visible":"Lesson hidden"}</StatusBadge>
    </h3>
    <div className="space-y-1 rounded-[var(--lms-control-radius)] border border-border p-3" aria-label="Student-visible items">
     <h4 className="text-sm font-semibold text-foreground">Published items visible in this Section</h4>
     {!lesson.visibleToStudents || lesson.lessonStatus!=="ACTIVE" ? <p className="text-xs text-muted-foreground">This lesson is not currently visible to learners.</p> : null}
     <ItemList items={[...lesson.contents,...lesson.assignments,...lesson.quizzes].filter(item=>item.studentVisible)}/>
     <p className="text-xs text-muted-foreground">Item titles only · secure media and per-learner checks remain in the learner workspace.</p>
    </div>
    <div className="space-y-1"><h4 className="text-sm font-semibold text-foreground">Videos, Resources and Live Classes ({lesson.contents.length})</h4>
     <ItemList items={lesson.contents}/></div>
    <div className="space-y-1"><h4 className="text-sm font-semibold text-foreground">Assignments ({lesson.assignments.length})</h4>
     <ItemList items={lesson.assignments}/></div>
    <div className="space-y-1"><h4 className="text-sm font-semibold text-foreground">Quizzes ({lesson.quizzes.length})</h4>
     <ItemList items={lesson.quizzes}/></div>
   </div>)}
   {!data.lessons.length?<p className="text-sm text-muted-foreground">No Lessons have been created for this offering.</p>:null}
  </div>:!data.invalid?<p className="text-xs text-muted-foreground">No Section selected. The shared Learning Path is shown in the overview; choose a Section above to inspect its combined shared and Section-specific content. An all-Section combined view is not available here.</p>:null}
 </section>;
}
