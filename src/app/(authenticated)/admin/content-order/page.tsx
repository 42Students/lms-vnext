import { getCurrentRequestContext } from "@/auth/request-context";
import { isSuperAdmin } from "@/modules/identity/context";
import { AuthorizationError } from "@/modules/permissions/policy";
import { PageHeader } from "@/components/ui/page-header";
import { ErrorState } from "@/components/ui/error-state";
import { Banner } from "@/components/ui/banner";
import {
 listSuperAdminContentSectionOptions,listSuperAdminSectionSyllabus,
} from "@/modules/courses/super-admin-content-directory-service";
import { SuperAdminSectionSyllabusOrder } from "@/components/courses/super-admin-section-syllabus-order";
import { Heading } from "@/components/ui/heading";
import { TextLink } from "@/components/ui/text-link";

export default async function AdminSectionSyllabusOrderPage({searchParams}:{
 searchParams:Promise<Record<string,string|string[]|undefined>>;
}){
 const context=await getCurrentRequestContext();
 if(!isSuperAdmin(context))throw new AuthorizationError("courses.read");
 if(!context.adminScope?.collegeId)return <div className="min-w-0 space-y-4">
  <PageHeader title="Class syllabus order"/>
  <Banner tone="warning">Select a college in the header to manage its class syllabus.</Banner>
 </div>;
 const raw=await searchParams;
 const rawOffering=raw["offeringId"];
 const rawDelivery=raw["deliveryId"];
 const offeringId=typeof rawOffering==="string"&&/^[\da-f-]{36}$/i.test(rawOffering)?rawOffering:null;
 const deliveryId=typeof rawDelivery==="string"&&/^[\da-f-]{36}$/i.test(rawDelivery)?rawDelivery:null;
 const choices=await listSuperAdminContentSectionOptions(context);
 const validChoice=choices.some(choice=>choice.id===deliveryId&&choice.offeringId===offeringId);
 const selectionInvalid=(rawOffering!==undefined||rawDelivery!==undefined)&&!validChoice;
 let syllabus:Awaited<ReturnType<typeof listSuperAdminSectionSyllabus>>|null=null;
 let loadFailed=false;
 if(validChoice&&offeringId&&deliveryId){
  try{syllabus=await listSuperAdminSectionSyllabus(context,offeringId,deliveryId);}
  catch(error){
   if(error instanceof AuthorizationError)throw error;
   loadFailed=true;
  }
 }
 const selected=choices.find(choice=>choice.id===deliveryId);
 const groups=new Map<string,NonNullable<typeof syllabus>["items"]>();
 for(const item of syllabus?.items??[]){
  const previous=groups.get(item.lessonId)??[];
  previous.push(item);groups.set(item.lessonId,previous);
 }
 return <div className="min-w-0 space-y-5">
  <PageHeader title="Class syllabus order"
   description="View and arrange videos, resources, YouTube and live classes in one sequence per lesson and class."/>
  <TextLink href="/admin/resources" className="inline-flex min-h-9 items-center text-sm">
    Back to Courses &amp; Content
  </TextLink>
  <p className="text-sm font-semibold text-body">Choose an active class and course:</p>
  <nav aria-label="Choose class syllabus" className="flex max-h-36 flex-wrap gap-2 overflow-auto">
   {choices.map(choice=><TextLink variant="bare" key={choice.id}
    href={"/admin/content-order?offeringId="+encodeURIComponent(choice.offeringId)+"&deliveryId="+encodeURIComponent(choice.id)}
    aria-current={choice.id===selected?.id?"page":undefined}
    className={"inline-flex min-h-9 items-center border px-2 text-xs font-semibold "+
     (choice.id===selected?.id?"border-primary text-primary-text":"border-border text-body")}>
     {choice.courseCode} · {choice.sectionName}
   </TextLink>)}
  </nav>
  {choices.length===0?<Banner tone="info">No active college classes are available for ordering.</Banner>:null}
  {selectionInvalid?<ErrorState title="Class not found"
    description="Select a course and class in your current college. Previous college IDs cannot be reused."/>:null}
  {loadFailed?<ErrorState title="Syllabus unavailable"
    description="Could not load the class syllabus; no saved order was changed."/>:null}
  {syllabus?<section className="space-y-4" aria-label="Class syllabus">
   <Heading level={2} size="base" className="text-foreground">
    {selected?.courseCode} · {selected?.courseName} · {selected?.sectionName}
   </Heading>
   {syllabus.truncated?<Banner tone="warning">
    More than 500 content entries exist. Reordering is disabled until this class is reduced to a supported size.
   </Banner>:null}
   {!syllabus.canReorder?<Banner tone="info">
    Class ordering is read-only until the verified content-order database migration is enabled.
   </Banner>:null}
   {groups.size===0?<Banner tone="info">No published or draft content is available for this class.</Banner>:null}
   {[...groups].map(([lessonId,items])=><SuperAdminSectionSyllabusOrder key={lessonId}
    lessonId={lessonId} deliveryId={syllabus.deliveryId!}
    lessonName={items[0]?.lessonName??"Lesson"}
    items={items.map(item=>({id:item.id,title:item.title,contentType:item.contentType}))}
    editable={syllabus.canReorder}/>)}
  </section>:null}
 </div>;
}
