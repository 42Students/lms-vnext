import type {listOfferingSectionPreview} from "@/modules/courses/college-offering-section-preview-service";

type Preview=Awaited<ReturnType<typeof listOfferingSectionPreview>>;
function ItemList({items}:{items:readonly {
 id:string;title:string;status:string;sequence:number;scope:string;kind?:string;
 studentVisible:boolean;
}[]}){
 if(!items.length)return <p className="text-xs text-muted-foreground">No items for this Section.</p>;
 return <ul className="space-y-1">{items.map(item=><li key={item.id}
  className="flex flex-wrap items-center justify-between gap-2 rounded border border-border bg-background p-2 text-sm">
  <span className="break-words">{item.title}
   {item.kind?<span className="ml-1 text-xs text-muted-foreground">({item.kind.replaceAll("_"," ")})</span>:null}
  </span>
  <span className="text-xs text-muted-foreground">{item.scope==="SECTION"?"Section-specific":"Shared offering"}
   {" · "}{item.status}{" · "}#{item.sequence+1}
   {" · "}{item.studentVisible?"Visible to students":"Not visible to students"}</span>
 </li>)}</ul>;
}
export function AdminOfferingSectionPreview({data}:{data:Preview}){
 return <section id="section-content" className="space-y-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
  aria-label="Section course content">
  <div className="space-y-1">
   <h2 className="text-lg font-semibold text-foreground">Section content</h2>
   <p className="text-sm text-muted-foreground">Select a class to see the shared and Section-specific learning items available in this Course Offering.</p>
  </div>
  <form method="get" className="flex flex-wrap items-end gap-3">
   <label className="grid min-w-56 flex-1 gap-1 text-sm font-semibold">Section
    <select className="min-h-10 rounded border border-border bg-background p-2"
     name="deliveryId" defaultValue={data.selected?.deliveryId??""}>
     <option value="">Showing every section&apos;s content together</option>
     {data.options.map(item=><option value={item.deliveryId} key={item.deliveryId}>
      {item.sectionName} ({item.sectionCode})
     </option>)}
    </select>
   </label>
   <button type="submit" className="min-h-10 rounded bg-primary px-4 text-sm font-semibold text-on-primary">View Section</button>
  </form>
  {data.invalid?<p role="alert" className="text-sm text-error">The selected Section is unavailable for this Course Offering.</p>:null}
  {data.truncated?<p role="status" className="text-xs text-muted-foreground">Only the first 200 active Sections are listed. Use the Section management page for the full directory.</p>:null}
  {data.selected?<div className="space-y-3">
   <p className="text-sm font-semibold">Viewing {data.selected.sectionName} ({data.selected.sectionCode})</p>
   <p className="text-xs text-muted-foreground">This is a metadata-only view of shared and Section-specific content. It does not reveal private video, file or meeting links, and does not simulate an individual learner&apos;s completion or visibility.</p>
   {data.lessons.map(lesson=><div key={lesson.id} className="space-y-3 rounded-lg border border-border p-3">
    <h3 className="font-semibold">{lesson.name}</h3>
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
