import Link from "next/link";
import {getCurrentRequestContext} from "@/auth/request-context";
import {PageHeader} from "@/components/ui/page-header";
import {Banner} from "@/components/ui/banner";
import {ErrorState} from "@/components/ui/error-state";
import {SuperAdminSectionSyllabusOrder} from "@/components/courses/super-admin-section-syllabus-order";
import {
 listCollegeSectionSyllabusChoices,listCollegeSectionSyllabus,
} from "@/modules/courses/college-section-syllabus-service";

export default async function CollegeContentOrderPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 const membership=context.membership;
 if(!membership)return <div className="min-w-0 space-y-4">
  <PageHeader title="Class syllabus order"/>
  <Banner tone="warning">Select a College Admin workspace to manage class syllabus order.</Banner>
 </div>;
 const raw=await searchParams;
 const idPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
 const offeringId=typeof raw["offeringId"]==="string"&&idPattern.test(raw["offeringId"])?raw["offeringId"]:null;
 const deliveryId=typeof raw["deliveryId"]==="string"&&idPattern.test(raw["deliveryId"])?raw["deliveryId"]:null;
 const choices=await listCollegeSectionSyllabusChoices(context);
 const selected=choices.find(item=>item.id===deliveryId&&item.offeringId===offeringId);
 const invalid=(raw["offeringId"]!==undefined||raw["deliveryId"]!==undefined)&&!selected;
 let syllabus:Awaited<ReturnType<typeof listCollegeSectionSyllabus>>|null=null;
 let failed=false;
 if(selected&&offeringId&&deliveryId){
  try{syllabus=await listCollegeSectionSyllabus(context,offeringId,deliveryId);}
  catch{failed=true;}
 }
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Class syllabus order"
   description="Arrange Videos, YouTube, Resources and Live Classes together in their complete Lesson sequence for a selected Section."/>
  <Link href="/college/videos" className="inline-flex min-h-11 items-center text-sm font-semibold text-primary-text underline md:min-h-9">Back to Courses &amp; Content</Link>
  <p className="text-sm font-semibold text-body">Choose an active Course and Section:</p>
  {choices.length?<nav aria-label="Choose a class" className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
   {choices.map(item=><Link key={item.id}
    href={"/college/content-order?offeringId="+encodeURIComponent(item.offeringId)+"&deliveryId="+encodeURIComponent(item.id)}
    aria-current={selected?.id===item.id?"page":undefined}
    className={"inline-flex min-h-11 items-center rounded border px-3 text-xs font-semibold md:min-h-9 "+
     (selected?.id===item.id?"border-primary text-primary-text":"border-border text-body hover:border-primary")}>
    {item.courseCode} · {item.sectionName}
   </Link>)}
  </nav>:<Banner tone="info">No active Sections are available for content ordering in this college.</Banner>}
  {invalid?<ErrorState title="Class not found"
   description="Choose an active Course and Section in your selected college. Previous-college IDs are not reusable."/>:null}
  {failed?<ErrorState title="Syllabus unavailable"
   description="Could not load the selected class. Your saved content order has not changed."/>:null}
  {syllabus?<section aria-label="Selected class syllabus" className="min-w-0 space-y-4">
   <h2 className="text-base font-semibold text-foreground">{selected?.courseCode} · {selected?.courseName} · {selected?.sectionName}</h2>
   <p className="text-sm text-body">Use the focusable Up and Down controls to move an item. Changes are a preview until you choose Save lesson order; Undo restores the last saved order.</p>
   {syllabus.truncated?<Banner tone="warning">More than 500 content entries exist. Reduce the class syllabus before reordering.</Banner>:null}
   {!syllabus.canReorder?<Banner tone="info">Class ordering is read-only until the verified content-order database migration is enabled.</Banner>:null}
   {syllabus.ordered.length===0?<Banner tone="info">No published or draft content is available in this Section.</Banner>:null}
   {syllabus.ordered.map(group=><SuperAdminSectionSyllabusOrder key={group.lessonId}
    lessonId={group.lessonId} lessonName={group.lessonName}
    deliveryId={syllabus.deliveryId}
    items={group.items.map(item=>({id:item.id,title:item.title,contentType:item.contentType}))}
    editable={syllabus.canReorder}/>)}
  </section>:null}
 </div>;
}
