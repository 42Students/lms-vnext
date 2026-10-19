import type {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";

type Preview=Awaited<ReturnType<typeof listOfferingSectionPreview>>;
function ItemList({items}:{items:readonly {
 id:string;title:string;status:string;sequence:number;scope:string;kind?:string;
 studentVisible:boolean;
}[]}){
 if(!items.length)return <p className="text-xs text-muted-foreground">No items for this Section.</p>;
 return <ul className="divide-y divide-border border-y border-border">{items.map(item=><li key={item.id}
  className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
  <span className="break-words">{item.title}
   {item.kind?<span className="ml-1 text-xs text-muted-foreground">({item.kind.replaceAll("_"," ")})</span>:null}
  </span>
  <span className="text-xs text-muted-foreground">{item.scope==="SECTION"?"Section-specific":"Shared offering"}
   {" · "}{item.status}{" · "}#{item.sequence+1}
   {" · "}{item.studentVisible?"Visible to students":"Not visible to students"}</span>
 </li>)}</ul>;
}
export function AdminOfferingSectionPreview({data}:{data:Preview}){
 return <section id="section-content" className="space-y-4 border-t border-border pt-5"
  aria-label="Section course content">
  <div className="space-y-1">
   <h2 className="text-lg font-semibold text-foreground">Section content</h2>
   <p className="text-sm text-muted-foreground">Select a class to see the shared and Section-specific learning items available in this Course Offering.</p>
  </div>
  <form method="get" className="flex flex-wrap items-end gap-3">
   <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold">Section
    <select className="min-h-11 w-full rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-4 focus:ring-[var(--lms-focus-ring)] sm:min-h-9"
     name="deliveryId" defaultValue={data.selected?.deliveryId??""}>
     <option value="">Showing every section&apos;s content together</option>
     {data.options.map(item=><option value={item.deliveryId} key={item.deliveryId}>
      {item.sectionName} ({item.sectionCode})
     </option>)}
    </select>
   </label>
   <Button variant="primary" type="submit" className="justify-center">View Section</Button>
  </form>
  {data.invalid?<p role="alert" className="text-sm text-error">The selected Section is unavailable for this Course Offering.</p>:null}
  {data.truncated?<p role="status" className="text-xs text-muted-foreground">Only the first 200 active Sections are listed. Use the Section management page for the full directory.</p>:null}
  {data.selected?<div className="space-y-3">
   <p className="text-sm font-semibold">Viewing {data.selected.sectionName} ({data.selected.sectionCode})</p>
   <p className="text-xs text-muted-foreground">This is a metadata-only view of shared and Section-specific content. It does not reveal private video, file or meeting links. Visibility indicators reflect publication and lesson flags, not an individual learner&apos;s enrolment or progress.</p>
   {data.lessons.map(lesson=><div key={lesson.id} className="space-y-3 rounded-xl border border-border p-3">
    <h3 className="font-semibold">{lesson.name}
     <span className="ml-2 text-xs font-normal text-muted-foreground">
      {lesson.visibleToStudents?"Lesson visible":"Lesson hidden"}
     </span>
    </h3>
    <div className="space-y-1"><h4 className="text-sm font-semibold">Videos, Resources and Live Classes ({lesson.contents.length})</h4>
     <ItemList items={lesson.contents}/></div>
    <div className="space-y-1"><h4 className="text-sm font-semibold">Assignments ({lesson.assignments.length})</h4>
     <ItemList items={lesson.assignments}/></div>
    <div className="space-y-1"><h4 className="text-sm font-semibold">Quizzes ({lesson.quizzes.length})</h4>
     <ItemList items={lesson.quizzes}/></div>
   </div>)}
   {!data.lessons.length?<p className="text-sm text-muted-foreground">No Lessons have been created for this offering.</p>:null}
  </div>:!data.invalid?<p className="text-xs text-muted-foreground">Showing the shared learning structure below. Choose a Section above for its combined content.</p>:null}
 </section>;
}
