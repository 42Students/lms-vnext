"use client";

import { COLLEGE_COURSES_COPY } from "@/modules/courses/college-courses-copy";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import {useGuardedAction} from "@/hooks/use-guarded-action";
import { apiFetch } from "@/lib/api-fetch";
import {collegeCourseDuplicatePrefill} from "@/modules/courses/college-course-duplicate-model";

type Option = { id: string; name: string; code?: string };
type CohortOption = Option & {
  status: "PLANNED" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
  programName: string;
  startPeriodId: string;
  expectedEndPeriodId: string | null;
};
type PeriodOption = Option & {
  status: "PLANNED" | "ACTIVE" | "CLOSED";
  startDate: string;
  endDate: string;
};
type SectionOption = Option & { cohortId: string; academicPeriodId: string };
type CourseOption = Option & { code:string; departmentName:string; departmentId:string;description:string|null;shortTitle?:string|null;officialCode?:string|null;cardColor?:string|null;takeaways?:string|null;introductionHeading?:string|null;thumbnailUrl?:string|null;enabled?:boolean };
type OfferingOption = {
  id: string;
  courseName: string;
  courseCode: string;
  cohortId: string;
  cohortName: string;
  academicPeriodId: string;
  academicPeriodName: string;
};
type DeliveryOption = {
  id: string;
  courseName: string;
  courseCode: string;
  sectionName: string;
  sectionCode: string;
};
type FacultyOption = {
  membershipId: string;
  displayName: string;
  email: string | null;
};

async function postJson(path: string, body: unknown) {
  return apiFetch<unknown>(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createdRecordId(result:unknown,kind:"course"|"offering"|"delivery"){
 if(!result||typeof result!=="object")return null;
 const value=(result as Record<string,unknown>)[kind];
 if(!value||typeof value!=="object")return null;
 const id=(value as Record<string,unknown>).id;
 return typeof id==="string"&&/^[a-f0-9-]{36}$/i.test(id)?id:null;
}
function safeCourseCoverHref(input:string):string|null{
  if(!input.trim())return null;
  try{
    const target=new URL(input.trim()),host=target.hostname.toLowerCase();
    if(target.protocol!=="https:"||target.username||target.password||target.hash||
      !host||host==="localhost"||host.endsWith(".localhost")||
      host==="0.0.0.0"||host==="[::1]"||host==="[::]")return null;
    const privateHost=/^(?:127|10|192\.168|169\.254|172\.(?:1[6-9]|2\d|3[01]))\./;
    if(privateHost.test(host))return null;
    return target.href;
  }catch{return null;}
}
function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="mb-[var(--lms-space-2)] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{children}</label>;
}

export function AdminCourseCreatePanel({
  departments,
  periods,
  cohorts,
  sections,
  courses,
  offerings,
  deliveries,
  faculty,facultyTruncated=false,duplicateCourseId,courseBasePath="/college/courses",
}: {
  departments: readonly Option[];
  periods: readonly PeriodOption[];
  cohorts: readonly CohortOption[];
  sections: readonly SectionOption[];
  courses: readonly CourseOption[];
  offerings: readonly OfferingOption[];
  deliveries: readonly DeliveryOption[];
  faculty: readonly FacultyOption[];
  facultyTruncated?:boolean;
  duplicateCourseId?:string;
  courseBasePath?:string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const {pending,run:guardedRun}=useGuardedAction();
  const [offeringConfirmOpen, setOfferingConfirmOpen] = useState(false);
  const [nextSetupStep,setNextSetupStep]=useState<"COURSE"|"OFFERING"|"DELIVERY"|"FACULTY"|"DONE">("COURSE");

  const copy=collegeCourseDuplicatePrefill(courses,duplicateCourseId);
  const [courseDepartmentId, setCourseDepartmentId] = useState(copy?.departmentId??"");
  const [departmentSearch,setDepartmentSearch]=useState("");
  const [copyAnnouncement,setCopyAnnouncement]=useState(Boolean(copy));
  useEffect(()=>{
    if(!duplicateCourseId||!copy)return;
    setCopyAnnouncement(true);
    const courseField=document.getElementById("course-name");
    courseField?.scrollIntoView({block:"center",behavior:"smooth"});
    courseField?.focus({preventScroll:true});
  },[duplicateCourseId,copy?.id]);
  const [courseName, setCourseName] = useState(copy?.name??"");
  const [courseCode, setCourseCode] = useState(copy?.code??"");
  const duplicated=courses.find(course=>course.id===duplicateCourseId);
  const [shortTitle,setShortTitle]=useState((duplicated?.shortTitle??copy?.name??"").slice(0,255));
  const [officialCode,setOfficialCode]=useState((duplicated?.officialCode??"").slice(0,40));
  const [cardColor,setCardColor]=useState(duplicated?.cardColor??"");
  const [coverUrl,setCoverUrl]=useState(duplicated?.thumbnailUrl??"");
  const [coverPreviewBroken,setCoverPreviewBroken]=useState(false);
  const [imageFile,setImageFile]=useState<File|null>(null);
  const [imagePreviewUrl,setImagePreviewUrl]=useState("");
  const [imageBusy,setImageBusy]=useState(false);
  const [imageError,setImageError]=useState("");
  const [imageReceipt,setImageReceipt]=useState<string|null>(null);
  const [createdImageCourseId,setCreatedImageCourseId]=useState<string|null>(null);
  const uploadRef=useRef<AbortController|null>(null);
  const tenantSignature=departments.map(row=>row.id).sort().join("|");
  const priorTenantSignature=useRef(tenantSignature);
  useEffect(()=>{
    if(priorTenantSignature.current!==tenantSignature){
      priorTenantSignature.current=tenantSignature;
      setImageBusy(false);setImageFile(null);setImageReceipt(null);
      setCreatedImageCourseId(null);setImageError("");
    }
    return ()=>{uploadRef.current?.abort();uploadRef.current=null;};
  },[tenantSignature]);
  function cancelImageUpload(){
    uploadRef.current?.abort();uploadRef.current=null;setImageBusy(false);
    setImageError("Upload cancelled. The saved course remains unchanged and unverified images stay private.");
  }
  useEffect(()=>{
    if(!imageFile){setImagePreviewUrl("");return;}
    const preview=URL.createObjectURL(imageFile);
    setImagePreviewUrl(preview);
    return ()=>URL.revokeObjectURL(preview);
  },[imageFile]);
  const [takeaways,setTakeaways]=useState(duplicated?.takeaways??"");
  const takeawayItems=takeaways.split(/\r?\n/).filter(item=>item.trim().length>0);
  function updateTakeaway(index:number,value:string){
    setTakeaways(current=>{
      const items=current.split(/\r?\n/).filter(item=>item.trim().length>0);
      items[index]=value;
      return items.join("\n");
    });
  }
  function removeTakeaway(index:number){
    setTakeaways(current=>current.split(/\r?\n/).filter(item=>item.trim().length>0)
      .filter((_,itemIndex)=>index!==itemIndex).join("\n"));
  }
  function moveTakeaway(index:number,direction:-1|1){
    setTakeaways(current=>{
      const items=current.split(/\r?\n/).filter(item=>item.trim().length>0);
      const next=index+direction;
      if(next<0||next>=items.length)return current;
      [items[index],items[next]]=[items[next]!,items[index]!];
      return items.join("\n");
    });
  }
  const [introductionHeading,setIntroductionHeading]=useState(duplicated?.introductionHeading??"In this Course");
  const [visibleToStudents,setVisibleToStudents]=useState(duplicated?.enabled??true);
  const superAdmin=courseBasePath.startsWith("/admin/");

  const [courseDescription, setCourseDescription] = useState(copy?.description??"");
  const [createErrors, setCreateErrors] = useState<Partial<Record<"department"|"name"|"shortTitle"|"code"|"heading"|"description"|"cardColor"|"coverUrl",string>>>({});

  const [offeringCourseId, setOfferingCourseId] = useState("");
  const [offeringCohortId, setOfferingCohortId] = useState("");
  const [offeringAcademicPeriodId, setOfferingAcademicPeriodId] = useState("");
  const [offeringType, setOfferingType] = useState<"CORE" | "ELECTIVE">("CORE");
  const [offeringCredits, setOfferingCredits] = useState("");
  const [offeringDisplayOrder, setOfferingDisplayOrder] = useState("0");

  const [deliveryOfferingId, setDeliveryOfferingId] = useState("");
  const [deliverySectionId, setDeliverySectionId] = useState("");

  const [teacherDeliveryId, setTeacherDeliveryId] = useState("");
  const [teacherMembershipId, setTeacherMembershipId] = useState("");
  const [teacherRole, setTeacherRole] = useState<"PRIMARY" | "CO_TEACHER" | "TA">("PRIMARY");

  const selectedOfferingCohort =
    cohorts.find(
      (cohort) =>
        cohort.id === offeringCohortId,
    ) ?? null;
  const cohortStartPeriod =
    selectedOfferingCohort
      ? periods.find(
          (period) =>
            period.id ===
            selectedOfferingCohort.startPeriodId,
        ) ?? null
      : null;
  const cohortEndPeriod =
    selectedOfferingCohort?.expectedEndPeriodId
      ? periods.find(
          (period) =>
            period.id ===
            selectedOfferingCohort.expectedEndPeriodId,
        ) ?? null
      : null;
  const compatiblePeriods = periods.filter(
    (period) =>
      period.status !== "CLOSED" &&
      (!cohortStartPeriod ||
        period.startDate >=
          cohortStartPeriod.startDate) &&
      (!cohortEndPeriod ||
        period.endDate <=
          cohortEndPeriod.endDate),
  );
  const selectedDeliveryOffering = offerings.find((offering) => offering.id === deliveryOfferingId) ?? null;
  const compatibleSections = useMemo(() => {
    if (!selectedDeliveryOffering) return [];
    return sections.filter(
      (section) =>
        section.cohortId === selectedDeliveryOffering.cohortId &&
        section.academicPeriodId === selectedDeliveryOffering.academicPeriodId,
    );
  }, [sections, selectedDeliveryOffering]);

  function run(task: () => Promise<unknown>, successTitle: string, reset: (result:unknown) => void, failureTitle = "Course update failed") {
    void guardedRun(async () => {
      try {
        const result=await task();
        reset(result);
        showToast({ tone: "success", title: successTitle });
        router.refresh();
      } catch (error) {
        showToast({
          tone: "error",
          title: failureTitle,
          description: academicSetupErrorMessage(error, "The request could not be completed."),
        });
      }
    });
  }

  async function finishCourseImage(courseId:string,receiptId:string,signal?:AbortSignal) {
    const completed=await apiFetch<{image:{status:"READY"|"VERIFYING";imageUrl:string|null}}>(
      "/api/courses/"+encodeURIComponent(courseId)+"/image/complete",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({receiptId}),signal,
      });
    if(signal?.aborted)return;
    if(completed.image.status==="READY"){
      setImageReceipt(null);setCreatedImageCourseId(null);setImageFile(null);setImageError("");
      showToast({tone:"success",title:"Course image verified",
        description:"The uploaded image is now available on the course."});
      router.refresh();
    }else{
      setImageReceipt(receiptId);
      setImageError("Course saved. Its image is being checked. Use Check verification below; unverified images stay private.");
    }
  }

  async function uploadCourseImage(courseId:string,file:File) {
    if(imageBusy)return;
    const controller=new AbortController();
    uploadRef.current?.abort();uploadRef.current=controller;
    setImageBusy(true);setImageError("");
    try{
      if(!["image/jpeg","image/png","image/webp"].includes(file.type)||
        file.size<1||file.size>5*1024*1024)
        throw new Error("Choose a JPEG, PNG or WebP image no larger than 5 MiB.");
      const result=await apiFetch<{grant:{
        receiptId:string;method:"PUT";uploadUrl:string;expiresAt:string;
        requiredHeaders:Record<string,string>;
      }}>(
        "/api/courses/"+encodeURIComponent(courseId)+"/image",{
          method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({originalName:file.name,contentType:file.type,sizeBytes:file.size}),signal:controller.signal,
        });
      if(controller.signal.aborted)return;
      setImageReceipt(result.grant.receiptId);
      const sent=await fetch(result.grant.uploadUrl,{
        method:"PUT",body:file,headers:result.grant.requiredHeaders,
        credentials:"omit",cache:"no-store",signal:controller.signal,
      });
      if(!sent.ok)throw new Error("Upload failed. Your course was saved; retry its image below.");
      await finishCourseImage(courseId,result.grant.receiptId,controller.signal);
    }catch(cause){
      if(!controller.signal.aborted)
        setImageError(cause instanceof Error?cause.message:"Image upload failed. Retry after saving the course.");
    }finally{
      if(uploadRef.current===controller){uploadRef.current=null;setImageBusy(false);}
    }
  }

  function createCourse(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(createdImageCourseId){
      setImageError("This course was created. Finish or retry its image instead of creating a duplicate.");
      return;
    }
    if(imageFile&&(!["image/jpeg","image/png","image/webp"].includes(imageFile.type)||
       imageFile.size<1||imageFile.size>5*1024*1024)){
      setImageError("Choose a JPEG, PNG or WebP image no larger than 5 MiB.");return;
    }
    const issues: Partial<Record<"department"|"name"|"shortTitle"|"code"|"heading"|"description"|"cardColor"|"coverUrl",string>> = {};
    if (!courseDepartmentId) issues.department = "Select a department";
    if (!courseName.trim()) issues.name = "Enter a course name";
    else if (courseName.trim().length > 255) issues.name = "Maximum 255 characters";
    if (!shortTitle.trim()) issues.shortTitle = "Enter short display name";
    else if (shortTitle.trim().length > 255)
      issues.shortTitle = "Maximum 255 characters";
    if (officialCode.trim().length > 40)
      issues.code = "Maximum 40 characters";
    if (!superAdmin && !courseCode.trim()) issues.code = "Enter course code";
    if (!introductionHeading.trim()) issues.heading = "Enter heading";
    else if (introductionHeading.trim().length > 255) issues.heading = "Maximum 255 characters";
    if (!courseDescription.trim())
      issues.description = "Enter course description";
    if (cardColor.trim() && !/^#[0-9a-fA-F]{6}$/.test(cardColor.trim()))
      issues.cardColor = "Enter a valid card colour (#RRGGBB).";
    if(coverUrl.trim()&&!safeCourseCoverHref(coverUrl))
      issues.coverUrl="Enter a valid HTTPS course cover URL.";
    setCreateErrors(issues);
    if (Object.keys(issues).length > 0) {
      const field = issues.department ? "course-department"
        : issues.name ? "course-name"
        : issues.shortTitle ? "course-short-title"
        : issues.code ? (!superAdmin&&!courseCode.trim() ? "course-code" : "course-official-code")
        : issues.heading ? "course-introduction-heading"
        : issues.description ? "course-description" : issues.coverUrl ? "course-cover-url" : "course-card-color";
      document.getElementById(field)?.focus();
      return;
    }
    run(
      () => postJson("/api/courses", {
        departmentId: courseDepartmentId,
        name: courseName,
        code:superAdmin?"SA-"+crypto.randomUUID().replaceAll("-","").slice(0,16):courseCode,
        shortTitle:shortTitle.trim(),
        officialCode:officialCode.trim()||null,
        cardColor:cardColor.trim()||null,
        thumbnailUrl:coverUrl.trim()||null,
        takeaways:takeaways.trim()||null,
        introductionHeading:introductionHeading.trim(),
        enabled:visibleToStudents,
        description: courseDescription.trim() || null,
      }),
      `Created course “${courseName.trim()}”.`,
      (result) => { const id=createdRecordId(result,"course");if(id){setOfferingCourseId(id);setNextSetupStep("OFFERING");}
        setCourseName("");setCourseCode("");setCourseDescription("");setShortTitle("");setOfficialCode("");setTakeaways("");setIntroductionHeading("In this Course");setCoverUrl("");setCoverPreviewBroken(false);setVisibleToStudents(true);setCreateErrors({});
        if(id&&imageFile){setCreatedImageCourseId(id);void uploadCourseImage(id,imageFile);}
        if(copy)router.replace(courseBasePath); },
      COLLEGE_COURSES_COPY.createFailed,
    );
  }

  function createOffering(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!offeringCourseId || !offeringCohortId || !offeringAcademicPeriodId) return;
    setOfferingConfirmOpen(true);
  }

  function commitOffering() {
    run(
      () => postJson("/api/courses/offerings", {
        courseId: offeringCourseId,
        cohortId: offeringCohortId,
        academicPeriodId: offeringAcademicPeriodId,
        type: offeringType,
        credits: offeringCredits ? Number(offeringCredits) : null,
        displayOrder: Number(offeringDisplayOrder),
      }),
      "Course Offering created",
      (result) => {
        const id=createdRecordId(result,"offering");
        if(id){setDeliveryOfferingId(id);setNextSetupStep("DELIVERY");}
        setDeliverySectionId("");
        setOfferingConfirmOpen(false);
        setOfferingCourseId("");
        setOfferingCohortId("");
        setOfferingAcademicPeriodId("");
        setOfferingCredits("");
        setOfferingDisplayOrder("0");
      },
    );
  }

  function createDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(
      () => postJson("/api/courses/deliveries", {
        offeringId: deliveryOfferingId,
        sectionId: deliverySectionId,
      }),
      "Section delivery created",
      (result) => {const id=createdRecordId(result,"delivery");if(id){setTeacherDeliveryId(id);setNextSetupStep("FACULTY");}
        setDeliverySectionId("");},
    );
  }

  function assignTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    run(
      () => postJson("/api/courses/teaching-assignments", {
        deliveryId: teacherDeliveryId,
        membershipId: teacherMembershipId,
        role: teacherRole,
      }),
      "Teaching assignment created",
      () => {setTeacherMembershipId("");setTeacherRole("PRIMARY");setNextSetupStep("DONE");},
    );
  }

  return (
    <section aria-label="Course setup workflow" className="grid min-w-0 grid-cols-1 gap-[var(--lms-space-4)]">
      <nav aria-label="Course setup steps" className="flex min-w-0 flex-nowrap gap-[var(--lms-space-3)] overflow-x-auto whitespace-nowrap border-b border-[var(--lms-canvas-border)] pb-[var(--lms-space-3)] text-sm">
       <a href="#setup-course" className="inline-flex shrink-0 min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">1. Create Course</a>
       <a href="#setup-offering" className="inline-flex shrink-0 min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">2. Course Offering</a>
       <a href="#setup-delivery" className="inline-flex shrink-0 min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">3. Section Delivery</a>
       <a href="#setup-faculty" className="inline-flex shrink-0 min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">4. Assign Course Faculty</a>
      </nav>
      <p role="status" className="border-l-2 border-primary bg-primary-subtle px-4 py-3 text-sm text-body leading-[22px]">
       {nextSetupStep==="COURSE"?"Start by creating or choosing a Course.":
        nextSetupStep==="OFFERING"?"Course created. Choose a Cohort and Academic Period for its Offering.":
        nextSetupStep==="DELIVERY"?"Offering created. Choose the compatible Section for the Delivery.":
        nextSetupStep==="FACULTY"?"Section Delivery created. Assign Faculty to that Section.":
        "Teaching assignment saved. The Course setup flow is complete."}
      </p>
      <form id="setup-course" noValidate onSubmit={createCourse} className="scroll-mt-24 border-b border-border pb-4">
        <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">{COLLEGE_COURSES_COPY.createTitle}</h2>
        {departments.length===0?<p role="status" className="mt-3 text-sm text-body leading-[22px]">
          No departments in this college yet. Create a department before adding a course.{" "}
          <Link className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9" href={courseBasePath.startsWith("/admin/")?"/admin/departments":"/college/departments"}>Go to Departments</Link>
        </p>:null}
        {copy?<div role="status" aria-live="polite" className="mt-3 flex flex-wrap items-center gap-3 rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle p-3">
          <strong>Duplicating “{copy.name}” — review the copy before creating it.</strong>
          <Button variant="ghost" type="button" className="inline-flex min-h-11 items-center font-[650] text-primary-text underline hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9"
            onClick={()=>{setCopyAnnouncement(false);router.replace(courseBasePath);}}>Cancel copy</Button>
          <p className="w-full text-xs text-muted-foreground leading-[20px]">Copy of {copy.name}. Review the unique course code and display metadata. The new course will not inherit learners, offerings, or permissions.</p>
          {copyAnnouncement?<p className="sr-only">Course metadata copied. The course name is ready to edit.</p>:null}
        </div>:null}
        <div className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="course-department">{COLLEGE_COURSES_COPY.departmentLabel}</FieldLabel>
            <Input type="search" aria-label="Search departments" className="mb-2"
              placeholder="Search departments" value={departmentSearch}
              onChange={event=>setDepartmentSearch(event.target.value)}/>
            <Select id="course-department" value={courseDepartmentId} onChange={(event) => {setCourseDepartmentId(event.target.value);setCreateErrors(previous=>({...previous,department:undefined}));}} required>
              <option value="">Select department</option>
              {departments.filter(department=>department.id===courseDepartmentId||
                department.name.toLocaleLowerCase("en-IN").includes(departmentSearch.trim().toLocaleLowerCase("en-IN")))
                .map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
            </Select>
            {createErrors.department ? <p role="alert" className="mt-1 text-xs text-danger">{createErrors.department}</p> : null}
          </div>
          <div>
            <FieldLabel htmlFor="course-name">{COLLEGE_COURSES_COPY.nameLabel}</FieldLabel>
            <Input id="course-name" value={courseName} onChange={(event) => { setCourseName(event.target.value);setCreateErrors(previous=>({...previous,name:undefined})); }} placeholder={COLLEGE_COURSES_COPY.namePlaceholder} maxLength={255} required />
            {createErrors.name ? <p role="alert" className="mt-1 text-xs text-danger">{createErrors.name}</p> : null}
          </div>
          <div className="grid gap-3 md:col-span-2 md:grid-cols-2">
            <div>
              <FieldLabel htmlFor="course-short-title">Short display name</FieldLabel>
              <Input id="course-short-title" value={shortTitle} onChange={event=>{setShortTitle(event.target.value);setCreateErrors(previous=>({...previous,shortTitle:undefined}));}} maxLength={255} placeholder="e.g. DSA" required />
              {createErrors.shortTitle ? <p role="alert" className="mt-1 text-xs text-danger">{createErrors.shortTitle}</p> : null}
            </div>
            <div>
              <FieldLabel htmlFor="course-official-code">Official course code</FieldLabel>
              <Input id="course-official-code" value={officialCode} onChange={event=>{setOfficialCode(event.target.value);setCreateErrors(previous=>({...previous,code:undefined}));}} placeholder="e.g. CS101" maxLength={40}/>
              {createErrors.code ? <p role="alert" className="mt-1 text-xs text-danger">{createErrors.code}</p> : null}
            </div>
            <div className="md:col-span-2 space-y-2" role="group" aria-label="In this Course – Takeaways">
              <FieldLabel htmlFor="course-takeaways-add">In this Course – Takeaways</FieldLabel>
              {takeawayItems.length? <ol className="space-y-2">
                {takeawayItems.map((item,index)=><li key={index} className="flex min-w-0 flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">{index+1}.</span>
                  <Input aria-label={"Takeaway "+(index+1)} value={item} className="min-w-0 flex-1"
                    maxLength={240} onChange={event=>updateTakeaway(index,event.target.value)}/>
                  <Button type="button" variant="ghost" disabled={index===0}
                    aria-label={"Move takeaway "+(index+1)+" up"} onClick={()=>moveTakeaway(index,-1)}>↑</Button>
                  <Button type="button" variant="ghost" disabled={index===takeawayItems.length-1}
                    aria-label={"Move takeaway "+(index+1)+" down"} onClick={()=>moveTakeaway(index,1)}>↓</Button>
                  <Button type="button" variant="ghost"
                    aria-label={"Remove takeaway "+(index+1)} onClick={()=>removeTakeaway(index)}>Remove</Button>
                </li>)}
              </ol>:<p className="text-xs text-muted-foreground">Add the key points students will learn.</p>}
              <Button id="course-takeaways-add" type="button" variant="secondary"
                disabled={takeawayItems.length>=20 || takeaways.length>=1960}
                onClick={()=>setTakeaways(current=>current.trim()?current.trimEnd()+"\nNew takeaway":"New takeaway")}>
                Add takeaway
              </Button>
            </div>
            <div>
              <FieldLabel htmlFor="course-card-color">Card colour</FieldLabel>
              <div className="flex flex-wrap items-center gap-3">
                <Input id="course-card-color" value={cardColor} onChange={event=>{setCardColor(event.target.value);setCreateErrors(previous=>({...previous,cardColor:undefined}));}}
                  maxLength={7} pattern="#[0-9A-Fa-f]{6}" placeholder="Optional #RRGGBB" className="min-w-0 flex-1"/>
                <Input type="color" aria-label="Choose card colour" className="!h-11 !w-14 !p-1"
                  value={/^#[0-9a-fA-F]{6}$/.test(cardColor)?cardColor:"#e4eef4"}
                  onChange={event=>{setCardColor(event.target.value);setCreateErrors(previous=>({...previous,cardColor:undefined}));}}/>
              </div>
              {createErrors.cardColor ? <p role="alert" className="mt-1 text-xs text-danger">{createErrors.cardColor}</p> : null}
            </div>
          </div>
          {!superAdmin?<div>
            <FieldLabel htmlFor="course-code">Code</FieldLabel>
            <Input id="course-code" value={courseCode} onChange={(event) => {setCourseCode(event.target.value);setCreateErrors(previous=>({...previous,code:undefined}));}} placeholder="CS201" maxLength={64} required />
            {createErrors.code ? <p role="alert" className="mt-1 text-xs text-danger">{createErrors.code}</p> : null}
          </div>:null}
          <div className="md:col-span-2">
            <FieldLabel htmlFor="course-cover-url">Course image (optional)</FieldLabel>
            <Input id="course-cover-url" type="url" value={coverUrl} maxLength={2048}
              aria-invalid={Boolean(createErrors.coverUrl)}
              onChange={event=>{setCoverUrl(event.currentTarget.value);setCoverPreviewBroken(false);setCreateErrors(old=>({...old,coverUrl:undefined}));}}
              placeholder="https://example.edu/course-cover.jpg" />
            <p className="mt-1 text-xs text-muted-foreground">
              Choose an approved public HTTPS course image. Private uploaded images require a verified signed-asset grant
              before they can be published; do not paste temporary storage URLs.
            </p>
            {safeCourseCoverHref(coverUrl)&&!coverPreviewBroken?
              <div className="mt-3 space-y-2">
                <p className="text-xs font-semibold text-body">Preview Image</p>
                <Image src={safeCourseCoverHref(coverUrl)!} alt={"Course cover preview for "+(courseName.trim()||"new course")}
                  width={180} height={100} unoptimized
                  onError={()=>setCoverPreviewBroken(true)}
                  className="h-[100px] w-[180px] rounded-[var(--lms-control-radius)] border border-border bg-surface-subtle object-cover"/>
                <div className="flex flex-wrap gap-2">
                  <a href={safeCourseCoverHref(coverUrl)!} rel="noopener noreferrer"
                    className="inline-flex min-h-9 items-center text-xs font-semibold text-link underline">View full image</a>
                  <Button type="button" size="sm" variant="secondary" onClick={()=>{
                    setCoverUrl("");setCoverPreviewBroken(false);setCreateErrors(old=>({...old,coverUrl:undefined}));
                  }}>Remove image</Button>
                </div>
              </div>:null}
            {coverPreviewBroken?<p role="alert" className="mt-2 text-xs text-warning">Could not preview this image. Check the URL before saving.</p>:null}
            {createErrors.coverUrl?<p role="alert" className="mt-1 text-xs text-danger">{createErrors.coverUrl}</p>:null}
            <label htmlFor="course-image-file" className="mt-3 block text-[13px] font-semibold text-body">
              Upload course image
            </label>
            <input id="course-image-file" type="file" accept="image/jpeg,image/png,image/webp"
              disabled={pending||imageBusy||Boolean(createdImageCourseId)}
              className="mt-2 block w-full min-w-0 rounded-[var(--lms-control-radius)] border border-border p-2 text-sm"
              onChange={event=>{setImageFile(event.currentTarget.files?.[0]??null);setImageError("");}}/>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG or WebP, up to 5 MiB. After creating the Course, the image uploads through a short-lived signed grant. Only verified images are shown to students.</p>
            {imagePreviewUrl?<div className="mt-3 flex flex-wrap items-center gap-3">
              <Image src={imagePreviewUrl} width={180} height={100} unoptimized
                alt="Selected course image preview" className="h-[100px] w-[180px] rounded-[var(--lms-control-radius)] border border-border object-cover"/>
              {!createdImageCourseId?<Button type="button" size="sm" variant="secondary"
                disabled={pending||imageBusy} onClick={()=>setImageFile(null)}>Remove selected image</Button>:null}
            </div>:null}
            {imageBusy?<div role="status" className="mt-2 flex flex-wrap items-center gap-2">
              <p className="text-xs text-muted-foreground">Uploading or verifying the course image…</p>
              <Button type="button" variant="secondary" size="sm" onClick={cancelImageUpload}>Cancel upload</Button>
            </div>:null}
            {imageError?<p role="alert" className="mt-2 text-xs text-error">{imageError}</p>:null}
            {createdImageCourseId&&imageFile?<div className="mt-2 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" loading={imageBusy} disabled={imageBusy}
                onClick={()=>void uploadCourseImage(createdImageCourseId,imageFile)}>Retry image upload</Button>
              {imageReceipt?<Button type="button" size="sm" variant="secondary" disabled={imageBusy}
                onClick={()=>{setImageBusy(true);void finishCourseImage(createdImageCourseId,imageReceipt)
                  .catch(cause=>setImageError(cause instanceof Error?cause.message:"Verification failed."))
                  .finally(()=>setImageBusy(false));}}>Check verification</Button>:null}
              <Link href={courseBasePath+"/"+createdImageCourseId}
                className="inline-flex min-h-9 items-center text-sm font-semibold text-link underline">Open saved course</Link>
            </div>:null}
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="course-introduction-heading">In this Course – Heading</FieldLabel>
            <Input id="course-introduction-heading" value={introductionHeading}
              onChange={event=>{setIntroductionHeading(event.target.value);setCreateErrors(old=>({...old,heading:undefined}));}}
              maxLength={255} required aria-invalid={Boolean(createErrors.heading)}
              placeholder="In this Course"/>
            {createErrors.heading?<p role="alert" className="mt-1 text-xs text-danger">{createErrors.heading}</p>:null}
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="course-description">In this Course – Description</FieldLabel>
            <Textarea id="course-description" className="min-h-24" value={courseDescription} onChange={(event) => {setCourseDescription(event.target.value);setCreateErrors(previous=>({...previous,description:undefined}));}} maxLength={5000} placeholder="Enter course description" required />
            {createErrors.description ? <p role="alert" className="mt-1 text-xs text-danger">{createErrors.description}</p> : null}
          </div>
          <label className="md:col-span-2 flex min-h-11 items-center gap-3 text-sm text-body">
            <Checkbox checked={visibleToStudents} onChange={event=>setVisibleToStudents(event.target.checked)}/>
            Course visible to students
          </label>
          {!visibleToStudents?<p role="status" className="md:col-span-2 text-sm text-warning">
            Hidden from students. Only authorized staff can see this course until visibility is enabled.
          </p>:null}
        </div>
        <div className="mt-4">
          <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending}
            disabled={pending||departments.length===0||!courseDepartmentId||!courseName.trim()}>
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none" className="mr-2 inline-block">
              <path d="M8 2.5v11M2.5 8h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>Create Course
          </Button>
        </div>
      </form>

      <form id="setup-offering" onSubmit={createOffering} className="scroll-mt-24 border-b border-border pb-4">
        <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">New Course Offering</h2>
        <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Place a Course into one Cohort and Academic Period.</p>
        <div className="mt-[var(--lms-space-4)] grid min-w-0 gap-[var(--lms-space-3)] md:grid-cols-2">
          <div className="md:col-span-2">
            <FieldLabel htmlFor="offering-course">Course</FieldLabel>
            <Select id="offering-course" value={offeringCourseId} onChange={(event) => setOfferingCourseId(event.target.value)} required>
              <option value="">Select Course</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name} · {course.code} · {course.departmentName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-cohort">Cohort</FieldLabel>
            <Select id="offering-cohort" value={offeringCohortId} onChange={(event) => { setOfferingCohortId(event.target.value); setOfferingAcademicPeriodId(""); }} required>
              <option value="">Select Cohort</option>
              {cohorts.filter((cohort) => cohort.status === "PLANNED" || cohort.status === "ACTIVE").map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name} · {cohort.programName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-period">Academic Period</FieldLabel>
            <Select id="offering-period" value={offeringAcademicPeriodId} onChange={(event) => setOfferingAcademicPeriodId(event.target.value)} required>
              <option value="">Select Period</option>
              {compatiblePeriods.map((period) => <option key={period.id} value={period.id}>{period.name} · {period.code}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-type">Type</FieldLabel>
            <Select id="offering-type" value={offeringType} onChange={(event) => setOfferingType(event.target.value as "CORE" | "ELECTIVE")}>
              <option value="CORE">Core</option>
              <option value="ELECTIVE">Elective</option>
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="offering-credits">Credits</FieldLabel>
            <Input id="offering-credits" type="number" min={1} max={30} value={offeringCredits} onChange={(event) => setOfferingCredits(event.target.value)} placeholder="Optional" />
          </div>
          <div className="md:col-span-2">
            <FieldLabel htmlFor="offering-order">Display order</FieldLabel>
            <Input id="offering-order" type="number" min={0} max={10000} value={offeringDisplayOrder} onChange={(event) => setOfferingDisplayOrder(event.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending || !offeringCourseId || !offeringCohortId || !offeringAcademicPeriodId}>Create Offering</Button>
        </div>
      </form>

      <form id="setup-delivery" onSubmit={createDelivery} className="scroll-mt-24 border-b border-border pb-4">
        <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Add Section Delivery</h2>
        <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Connect an Offering to an exact Section. Only structurally compatible Sections are shown.</p>
        <div className="mt-4 grid gap-3">
          <div>
            <FieldLabel htmlFor="delivery-offering">Offering</FieldLabel>
            <Select id="delivery-offering" value={deliveryOfferingId} onChange={(event) => { setDeliveryOfferingId(event.target.value); setDeliverySectionId(""); }} required>
              <option value="">Select Offering</option>
              {offerings.map((offering) => <option key={offering.id} value={offering.id}>{offering.courseName} · {offering.cohortName} · {offering.academicPeriodName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="delivery-section">Section</FieldLabel>
            <Select id="delivery-section" value={deliverySectionId} onChange={(event) => setDeliverySectionId(event.target.value)} disabled={!deliveryOfferingId} required>
              <option value="">{deliveryOfferingId ? "Select compatible Section" : "Select Offering first"}</option>
              {compatibleSections.map((section) => <option key={section.id} value={section.id}>{section.name} · {section.code}</option>)}
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending || !deliveryOfferingId || !deliverySectionId}>Add Section Delivery</Button>
        </div>
      </form>

      <form id="setup-faculty" onSubmit={assignTeacher} className="scroll-mt-24 border-b border-border pb-4">
        <h2 className="m-0 font-semibold text-[16px] leading-[26px] min-[768px]:text-[18px] min-[768px]:leading-[28px] min-[992px]:text-[20px] min-[992px]:leading-[30px] text-[var(--lms-heading)]">Assign Course Faculty</h2>
        <p className="mt-1 text-xs text-muted-foreground leading-[20px]">Assign an active Faculty Membership to one exact Section Delivery.</p>
        <div className="mt-4 grid gap-3">
          <div>
            <FieldLabel htmlFor="teacher-delivery">Section Delivery</FieldLabel>
            <Select id="teacher-delivery" value={teacherDeliveryId} onChange={(event) => setTeacherDeliveryId(event.target.value)} required>
              <option value="">Select Delivery</option>
              {deliveries.map((delivery) => <option key={delivery.id} value={delivery.id}>{delivery.courseName} · {delivery.sectionName}</option>)}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="teacher-membership">Faculty</FieldLabel>
            <Select id="teacher-membership" value={teacherMembershipId} onChange={(event) => setTeacherMembershipId(event.target.value)} required>
              <option value="">Select Faculty</option>
              {faculty.map((person) => <option key={person.membershipId} value={person.membershipId}>{person.displayName}{person.email ? " · " + person.email : ""}</option>)}
            </Select>
            {facultyTruncated?<p role="status" className="mt-1 text-xs text-muted-foreground leading-[20px]">
             Showing only the first 500 active Faculty accounts. Faculty beyond this list cannot be selected in this picker.
            </p>:null}
          </div>
          <div>
            <FieldLabel htmlFor="teacher-role">Teaching role</FieldLabel>
            <Select id="teacher-role" value={teacherRole} onChange={(event) => setTeacherRole(event.target.value as "PRIMARY" | "CO_TEACHER" | "TA")}>
              <option value="PRIMARY">Primary</option>
              <option value="CO_TEACHER">Co-teacher</option>
              <option value="TA">Teaching assistant</option>
            </Select>
          </div>
        </div>
        <div className="mt-4">
          <Button type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending} disabled={pending || !teacherDeliveryId || !teacherMembershipId}>Assign Faculty</Button>
        </div>
      </form>
      <ConfirmDialog
        open={offeringConfirmOpen}
        onOpenChange={setOfferingConfirmOpen}
        title="Create this Course Offering?"
        description="This binds the selected course, cohort and academic period. Duplicate active bindings and incompatible periods are rejected by the server."
        confirmLabel="Create Offering" confirmVariant="primary"
        pending={pending}
        onConfirm={commitOffering}
      />
    </section>
  );
}