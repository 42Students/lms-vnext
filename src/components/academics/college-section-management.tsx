"use client";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {useRef,useState,useTransition,type FormEvent} from "react";
import {useToast} from "@/components/ui/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch, FriendlyFetchError } from "@/lib/api-fetch";
import {Dialog} from "@/components/ui/dialog";
import {Disclosure} from "@/components/ui/disclosure";
import {Select} from "@/components/ui/select";
import {ConfirmDialog} from "@/components/ui/confirm-dialog";
import {
  createCollegeSectionSchema, sectionIdentityChanged,
  updateCollegeSectionSchema,
} from "@/modules/academics/college-section-mutation-model";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";

type Cohort = { id: string; name: string; code: string; programName: string; programId: string };
type Period = { id: string; name: string; code: string };
type ClassRow = {
  id: string; name: string; code: string;
  cohortId: string; academicPeriodId: string;
  capacity: number | null; minSize: number | null; description?: string | null; status: "ACTIVE" | "ARCHIVED"; activeLearners: number | null;
  canDelete?:boolean;updatedAt?:Date|string;
};

async function requestWrite(method: "POST" | "PATCH", url: string, input: unknown) {
  await apiFetch(url, {
    method, headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
}

function focusClassField(form: HTMLFormElement | null, field: string) {
  const name = field === "name" ? "className" : field;
  form?.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
}
function classFieldMessage(field: string, fallback: string) {
  if (field === "name") return /255|max|length/i.test(fallback)
    ? "Maximum 255 characters" : "Enter the class or section name";
  if (field === "capacity") return "Maximum must be a whole number from 1 to 200";
  if (field === "minSize" && /maximum|less|exceed/i.test(fallback))
    return "Maximum cannot be less than minimum";
  return fallback;
}
function validateClassNumbers(name: string, capacity: string, minSize: string) {
  if (!name.trim() || name.trim().length > 255)
    return { field: "name", message: name.trim() ? "Maximum 255 characters" : "Enter the class or section name" };
  if (!/^[0-9]+$/.test(capacity) || Number(capacity) < 1 || Number(capacity) > 200)
    return { field: "capacity", message: "Maximum must be a whole number from 1 to 200" };
  if (minSize !== "" && (!/^[0-9]+$/.test(minSize) || Number(minSize) > Number(capacity)))
    return { field: "minSize", message: "Maximum cannot be less than minimum" };
  return null;
}

function capacityInput(value: string): number | null {
  return value.trim() === "" ? null : Number(value);
}

export function CollegeClassCreate({ cohorts, periods,
 academicSetupHref = "/college/academics",alwaysOpen=true }: {
  cohorts: Cohort[]; periods: Period[]; academicSetupHref?: string;alwaysOpen?:boolean;
}) {
  const router = useRouter();
  const {showToast}=useToast();
  const formRef=useRef<HTMLFormElement>(null);
  const [fieldErrors,setFieldErrors]=useState<Record<string,string>>({});
  const [pending, startTransition] = useTransition();
  const [cohortId, setCohortId] = useState("");
  const [programId,setProgramId]=useState("");
  const [programSearch,setProgramSearch]=useState("");
  const uniquePrograms=[...new Map(cohorts.map(cohort=>[cohort.programId,{id:cohort.programId,name:cohort.programName}])).values()]
    .filter(program=>program.name.toLowerCase().includes(programSearch.trim().toLowerCase()));
  const filteredCohorts=cohorts.filter(cohort=>!programId||cohort.programId===programId);
  const [academicPeriodId, setAcademicPeriodId] = useState(periods.length === 1 ? periods[0]!.id : "");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [capacity, setCapacity] = useState("60");
  const [minSize, setMinSize] = useState("0");
  const [description, setDescription] = useState("");
  const derivedCode=code.trim()||name.trim().toUpperCase().replace(/[^A-Z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,64);
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice("");setFieldErrors({});
    if (!programId) {
      setFieldErrors({programId:"Select a program"});setNotice("Select a program");
      formRef.current?.querySelector<HTMLSelectElement>('[name="programId"]')?.focus();return;
    }
    if (!cohortId) {
      setFieldErrors({cohortId:"Select a batch"});setNotice("Select a batch");
      formRef.current?.querySelector<HTMLSelectElement>('[name="cohortId"]')?.focus();return;
    }
    const invalid = validateClassNumbers(name, capacity, minSize);
    if (invalid) {
      setFieldErrors({[invalid.field]: invalid.message}); setNotice(invalid.message);
      focusClassField(formRef.current, invalid.field); return;
    }
    const result = createCollegeSectionSchema.safeParse({
      cohortId, academicPeriodId, name, code:derivedCode, capacity: Number(capacity),
      minSize: minSize === "" ? null : Number(minSize), description: description.trim() || null,
    });
    if (!result.success) {
      const fields=Object.fromEntries(result.error.issues.map(issue=>[
        String(issue.path[0]), classFieldMessage(String(issue.path[0]),issue.message),
      ]));
      setFieldErrors(fields);
      const first=String(result.error.issues[0]?.path[0]??"");
      setNotice(fields[first] ?? "Enter valid class details.");
      focusClassField(formRef.current,first);
      return;
    }
    startTransition(async () => {
      try {
        await requestWrite("POST", "/api/college/classes", result.data);
        setName(""); setCode(""); setDescription("");
        formRef.current?.querySelector<HTMLInputElement>('[name="className"]')?.focus();
        const className=result.data.name;
        setNotice(`Created class “${className}”. Next, register or move students into this section.`);
        showToast({tone:"success",title:`Created class “${className}”.`,
          description:"Next, register or move students into this section."});
        router.refresh();
      } catch (error) {
        const message = academicSetupErrorMessage(error, "Class creation failed.");
        setNotice(message);
        if(error instanceof FriendlyFetchError && Object.keys(error.fieldErrors).length){
          const fields=Object.fromEntries(Object.entries(error.fieldErrors).map(([key,value])=>[
            key,classFieldMessage(key,value),
          ]));
          setFieldErrors(fields);
          focusClassField(formRef.current,Object.keys(fields)[0]!);
        } else {
          const field = /capacity|maximum|minimum/i.test(message) ? "capacity" :
            /batch|cohort/i.test(message) ? "cohortId" :
            /period/i.test(message) ? "academicPeriodId" :
            /name|section/i.test(message) ? "name" : null;
          if(field){setFieldErrors({[field]:message});focusClassField(formRef.current,field);}
        }
        showToast({tone:"error",title:"Failed to create class.",description:message});
      }
    });
  }

  return <Disclosure ariaLabel="Create class" defaultOpen={alwaysOpen} title={<h2 className="m-0 text-lg font-semibold text-foreground">Create New Class/Section</h2>}
    className="min-w-0" contentClassName="pt-[var(--lms-space-3)] pb-[var(--lms-space-4)]">
    {!cohorts.length || !periods.length
      ? <p role="status" className="mt-2 text-sm text-muted-foreground">
        {!cohorts.length
          ? <>No planned or active batches in this college. <Link href="/college/academics" className="font-semibold underline">Set up programs and batches</Link> first.</>
          : <>No usable academic periods in this college. Create a period first.{" "}
            <Link href={academicSetupHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Set up academic periods</Link>
          </>}
      </p>
      : <form ref={formRef} noValidate onSubmit={submit} className="mt-[var(--lms-space-3)] grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)]">
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
          <Input type="search" aria-label="Search programs" placeholder="Search programs" value={programSearch} onChange={event=>setProgramSearch(event.target.value)} className="min-h-9 w-full" />
          <Select required name="programId" aria-invalid={Boolean(fieldErrors.programId)} value={programId} onChange={event=>{setProgramId(event.target.value);setCohortId("");}}
           className="min-h-11 w-full md:min-h-9">
           <option value="">Select program</option>
           {uniquePrograms.map(program=><option key={program.id} value={program.id}>{program.name}</option>)}
          </Select>
          {fieldErrors.programId ? <span role="alert" className="text-xs text-red-700">{fieldErrors.programId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
          <Select required name="cohortId" disabled={!programId} aria-invalid={Boolean(fieldErrors.cohortId)} value={cohortId} onChange={event => setCohortId(event.target.value)}
            className="min-h-11 w-full md:min-h-9">
            <option value="">{programId?"Select batch":"Select program first"}</option>
            {filteredCohorts.map(c => <option key={c.id} value={c.id}>
              {c.programName} · {c.name} ({c.code})
            </option>)}
          </Select>
          {fieldErrors.cohortId ? <span role="alert" className="text-xs text-red-700">{fieldErrors.cohortId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic period
          <Select required name="academicPeriodId" aria-invalid={Boolean(fieldErrors.academicPeriodId)} value={academicPeriodId}
            onChange={event => setAcademicPeriodId(event.target.value)}
            className="min-h-11 w-full md:min-h-9">
            <option value="">Select period</option>
            {periods.map(p => <option key={p.id} value={p.id}>
              {p.name} ({p.code})
            </option>)}
          </Select>
          {fieldErrors.academicPeriodId ? <span role="alert" className="text-xs text-red-700">{fieldErrors.academicPeriodId}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class Name
          <Input required name="className" placeholder="e.g., CSE-A or Section 1" maxLength={255} value={name}
           aria-invalid={Boolean(fieldErrors.name)} onChange={event => setName(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
          {fieldErrors.name ? <span role="alert" className="text-xs text-red-700">{fieldErrors.name}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class code (optional; generated from name)
          <Input name="code" maxLength={64} value={code} onChange={event => setCode(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum students (1–200)
          <Input required name="capacity" aria-invalid={Boolean(fieldErrors.capacity)} type="number" min={1} max={200} step={1} value={capacity}
            onChange={event => setCapacity(event.target.value)}
            className="min-h-11 w-full md:min-h-9" />
          {fieldErrors.capacity ? <span role="alert" className="text-xs text-red-700">{fieldErrors.capacity}</span> : null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum students (0–200)
          <Input name="minSize" aria-invalid={Boolean(fieldErrors.minSize)} type="number" min={0} max={200} step={1} value={minSize}
            onChange={event => setMinSize(event.target.value)} className="min-h-11 w-full md:min-h-9" />
          {fieldErrors.minSize ? <span role="alert" className="text-xs text-red-700">{fieldErrors.minSize}</span> : null}
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] md:col-span-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Description (optional)
          <Textarea maxLength={2000} rows={2} placeholder="Optional description" value={description} onChange={e => setDescription(e.target.value)}
            className="min-h-24 w-full" />
        </label>
        <p className="text-xs text-muted-foreground md:col-span-2">Moving a student into a full section is refused.</p>
        <div className="flex justify-stretch border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:col-span-2 md:justify-end">
          <Button variant="primary" disabled={pending} type="submit" className="w-full md:w-auto">
            {pending ? "Creating…" : "+ Create Class & Add Another"}
          </Button>
        </div>
      </form>}
    {notice ? <p role="status" className="mt-[var(--lms-space-3)] max-w-prose break-words text-sm text-body">{notice}</p> : null}
    <p className="mt-2 text-xs text-muted-foreground">
      Class dates follow the batch/semester academic structure. Schedule actual teaching dates from the Schedule action.
    </p>
  </Disclosure>;
}

export function CollegeClassRowActions({ row, cohorts = [], periods = [] }: {
  row: ClassRow; cohorts?: Cohort[]; periods?: Period[];
}) {
  const router = useRouter();
  const {showToast}=useToast();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);
  const editFormRef=useRef<HTMLFormElement>(null);
  const [editFieldErrors,setEditFieldErrors]=useState<Record<string,string>>({});
  const [discardConfirm, setDiscardConfirm] = useState(false);
  const [deleteConfirm,setDeleteConfirm]=useState(false);
  const [scheduleOpen,setScheduleOpen]=useState(false);
  const [scheduleDiscardConfirm,setScheduleDiscardConfirm]=useState(false);
  const [scheduleLoading,setScheduleLoading]=useState(false);
  const [scheduleError,setScheduleError]=useState("");
  const [scheduleItems,setScheduleItems]=useState<Array<{
    id:string;title:string;startsAt:string|Date;endsAt:string|Date;status:string
  }>>([]);
  const [scheduleTitle,setScheduleTitle]=useState("");
  const [scheduleStart,setScheduleStart]=useState("");
  const [scheduleEnd,setScheduleEnd]=useState("");
  const [scheduleLocation,setScheduleLocation]=useState("");
  const [name, setName] = useState(row.name);
  const [code, setCode] = useState(row.code);
  const [capacity, setCapacity] = useState(row.capacity === null ? "" : String(row.capacity));
  const [minSize, setMinSize] = useState(row.minSize === null ? "" : String(row.minSize));
  const [cohortId, setCohortId] = useState(row.cohortId);
  const [academicPeriodId, setAcademicPeriodId] = useState(row.academicPeriodId);
  const [programId, setProgramId] = useState(cohorts.find(c => c.id === row.cohortId)?.programId ?? "");
  const programs = [...new Map(cohorts.map(c => [c.programId, { id: c.programId, name: c.programName }])).values()];
  const [description, setDescription] = useState(row.description ?? "");
  const [notice, setNotice] = useState("");
  const draft = { name, code, capacity: capacityInput(capacity),
    minSize: minSize.trim() === "" ? null : Number(minSize),
    cohortId, academicPeriodId, description: description.trim() || null };
  const changed = sectionIdentityChanged(row, draft) || row.capacity !== draft.capacity ||
    row.minSize !== draft.minSize || row.cohortId !== cohortId ||
    row.academicPeriodId !== academicPeriodId || (row.description ?? null) !== draft.description;

  const sectionHref="/api/college/classes/"+encodeURIComponent(row.id);
  async function loadSchedule(){
    setScheduleLoading(true);setScheduleError("");
    try{
      const response=await apiFetch<{events:typeof scheduleItems}>(
        "/api/academics/schedule-events?sectionId="+encodeURIComponent(row.id),
        {cache:"no-store"});
      setScheduleItems(response.events);
    }catch(error){
      setScheduleError(academicSetupErrorMessage(error,"Could not load class schedule."));
    }finally{setScheduleLoading(false);}
  }
  function openSchedule(){setScheduleOpen(true);void loadSchedule();}
  function closeSchedule(){
    if(scheduleLoading||pending)return;
    if(scheduleTitle.trim()||scheduleStart||scheduleEnd||scheduleLocation.trim()){
      setScheduleDiscardConfirm(true);return;
    }
    setScheduleOpen(false);
  }
  async function createSchedule(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(pending||scheduleLoading)return;
    if(!scheduleTitle.trim()||!scheduleStart||!scheduleEnd){
      setScheduleError("Enter a title, start time and end time.");return;
    }
    setScheduleLoading(true);setScheduleError("");
    try{
      // Class timetable uses IST across the LMS regardless of browser timezone.
      const at=(value:string)=>value+":00+05:30";
      await apiFetch("/api/academics/schedule-events",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({
          sectionId:row.id,title:scheduleTitle.trim(),
          startsAt:at(scheduleStart),endsAt:at(scheduleEnd),
          location:scheduleLocation.trim()||null,
        }),
      });
      setScheduleTitle("");setScheduleStart("");setScheduleEnd("");setScheduleLocation("");
      showToast({tone:"success",title:"Class schedule updated"});
      await loadSchedule();router.refresh();
    }catch(error){
      setScheduleError(academicSetupErrorMessage(error,"Could not schedule class."));
    }finally{setScheduleLoading(false);}
  }
  async function deleteClass(){
    if(pending||!row.canDelete||!row.updatedAt)return;
    setDeleteConfirm(false);
    const updatedAt=new Date(row.updatedAt).toISOString();
    startTransition(async()=>{
      try{
        await apiFetch(sectionHref,{
          method:"DELETE",headers:{"content-type":"application/json"},
          body:JSON.stringify({expectedUpdatedAt:updatedAt,confirm:true}),
        });
        showToast({tone:"success",title:"Class deleted"});
        router.refresh();
      }catch(error){
        const message=academicSetupErrorMessage(error,"Could not delete class.");
        setNotice(message);
        showToast({tone:"error",title:"Class not deleted",description:message});
      }
    });
  }
  function cancel() {
    if (changed && !discardConfirm) { setDiscardConfirm(true); return; }
    setDiscardConfirm(false); setEditing(false); setNotice("");setEditFieldErrors({});
    setName(row.name); setCode(row.code); setCapacity(row.capacity === null ? "" : String(row.capacity));
    setMinSize(row.minSize === null ? "" : String(row.minSize));
    setCohortId(row.cohortId); setAcademicPeriodId(row.academicPeriodId);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setNotice("");setEditFieldErrors({});
    const invalid=validateClassNumbers(name,capacity,minSize);
    if(invalid){
      setEditFieldErrors({[invalid.field]:invalid.message});setNotice(invalid.message);
      focusClassField(editFormRef.current,invalid.field);return;
    }
    const parsed = updateCollegeSectionSchema.safeParse({ ...draft, confirm: true });
    if (!parsed.success) {
      const fields=Object.fromEntries(parsed.error.issues.map(issue=>[
        String(issue.path[0]),classFieldMessage(String(issue.path[0]),issue.message),
      ]));
      const first=String(parsed.error.issues[0]?.path[0]??"");
      setEditFieldErrors(fields);setNotice(fields[first]??"Invalid class changes.");
      focusClassField(editFormRef.current,first);return;
    }

    startTransition(async () => {
      try {
        await requestWrite("PATCH", "/api/college/classes/" + encodeURIComponent(row.id), parsed.data);
        setEditing(false); setDiscardConfirm(false);
        setNotice('Updated class “'+row.name+'”.');
        showToast({tone:"success",title:'Updated class “'+row.name+'”.'});
        router.refresh();
      } catch (error) {
        const message=academicSetupErrorMessage(error, "Failed to update class.");
        setNotice(message);
        if(error instanceof FriendlyFetchError && Object.keys(error.fieldErrors).length){
          const fields=Object.fromEntries(Object.entries(error.fieldErrors).map(([field,value])=>[
            field,classFieldMessage(field,value),
          ]));
          setEditFieldErrors(fields);focusClassField(editFormRef.current,Object.keys(fields)[0]!);
        }
        showToast({tone:"error",title:"Failed to update class.",description:message});
      }
    });
  }

  return <div className="min-w-0 space-y-2">
    <div className="flex flex-wrap items-center gap-2">
    <Button variant="secondary" type="button" disabled={pending || row.status !== "ACTIVE"}
      onClick={() => { setEditing(true); setDiscardConfirm(false); setNotice(""); setEditFieldErrors({}); }}
      className="min-h-11 w-full sm:w-auto md:min-h-9" aria-label={"Edit class "+row.name}>
      Edit
    </Button>
    <Button variant="secondary" type="button" disabled={pending}
      onClick={openSchedule} aria-label={"Schedule class "+row.name}>Schedule</Button>
    <Button variant="danger" type="button"
      disabled={pending||!row.canDelete||!row.updatedAt}
      title={row.canDelete?"Delete this unused class":
        "Cannot delete a class with learners, faculty, schedules or deliveries"}
      onClick={()=>setDeleteConfirm(true)} aria-label={"Delete class "+row.name}>Delete</Button>
    </div>
    {editing ? <Dialog open={editing} onOpenChange={next=>{if(!next)cancel();}}
      title={'Edit class “'+row.name+'”'} className="max-w-[550px]" dismissible={false}>
      <form ref={editFormRef} noValidate onSubmit={save} className="grid min-w-0 grid-cols-1 items-start gap-[var(--lms-space-4)] md:grid-cols-2">
        
        <p className="text-sm text-muted-foreground md:col-span-2">
          Reassigning a batch, program or academic period requires no dependent students, schedules,
          faculty assignments or course deliveries. The server checks college and period scope.
        </p>
        {cohorts.length > 0 ? <>
          <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground">Program
            <Select value={programId} onChange={event => {
              setProgramId(event.target.value);
              const first = cohorts.find(c => c.programId === event.target.value);
              setCohortId(first?.id ?? "");
            }} className="min-h-11 md:min-h-9">
              <option value="">Select program</option>
              {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select>
          </label>
          <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground">Batch
            <Select value={cohortId} disabled={!programId} onChange={event => setCohortId(event.target.value)} className="min-h-11 md:min-h-9">
              <option value="">{programId?"Select batch":"Select program first"}</option>
              {cohorts.filter(c => !programId || c.programId === programId).map(c =>
                <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
            </Select>
          </label>
        </> : null}
        {periods.length > 0 ? <label className="grid gap-2 text-[13px] font-semibold text-muted-foreground md:col-span-2">Academic period
          <Select value={academicPeriodId} onChange={event => setAcademicPeriodId(event.target.value)}
            className="min-h-11 md:min-h-9">
            {periods.map(p => <option key={p.id} value={p.id}>{p.name} ({p.code})</option>)}
          </Select>
        </label> : null}
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class/Section Name
          <Input required name="className" maxLength={255} placeholder="e.g., CSE-A or Section 1"
             aria-invalid={Boolean(editFieldErrors.name)} value={name} onChange={e => setName(e.target.value)}
             className="min-h-11 w-full md:min-h-9" />
           {editFieldErrors.name?<span role="alert" className="text-xs text-error">{editFieldErrors.name}</span>:null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class code
          <Input required maxLength={64} value={code} onChange={e => setCode(e.target.value)}
            className="min-h-11 w-full md:min-h-9" />
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Maximum students (1–200)
          <Input required name="capacity" aria-invalid={Boolean(editFieldErrors.capacity)} type="number"
             min={1} max={200} step={1} value={capacity} onChange={e => setCapacity(e.target.value)}
             className="min-h-11 w-full md:min-h-9" />
           {editFieldErrors.capacity?<span role="alert" className="text-xs text-error">{editFieldErrors.capacity}</span>:null}
        </label>
        <label className="grid gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Minimum students (0–200)
          <Input name="minSize" aria-invalid={Boolean(editFieldErrors.minSize)} type="number"
             min={0} max={200} step={1} value={minSize}
             onChange={e => setMinSize(e.target.value)} className="min-h-11 w-full md:min-h-9" />
           {editFieldErrors.minSize?<span role="alert" className="text-xs text-error">{editFieldErrors.minSize}</span>:null}
        </label>
        <label className="grid min-w-0 gap-[var(--lms-space-2)] text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)] md:col-span-2">Description
          <Textarea placeholder="Optional description" rows={2} maxLength={2000} value={description} onChange={e => setDescription(e.target.value)}
            className="min-h-24 w-full" />
        </label>
        <p className="text-xs text-muted-foreground md:col-span-2">Active learner enrollments: {row.activeLearners === null ? "Unavailable" : row.activeLearners}.</p>
        {notice ? <p role="alert" className="text-sm text-body md:col-span-2">{notice}</p> : null}
        <div className="flex flex-col-reverse gap-[var(--lms-space-2)] border-t border-[var(--lms-canvas-border)] pt-[var(--lms-space-3)] md:col-span-2 md:flex-row md:justify-end [&>button]:w-full md:[&>button]:w-auto">
          <Button variant="secondary" disabled={pending} type="button" onClick={cancel}
            >
            Cancel
          </Button>
          <Button variant="primary" disabled={pending || !changed} type="submit"
            >
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog> : null}
    <Dialog open={scheduleOpen} onOpenChange={next=>{if(next)setScheduleOpen(true);else closeSchedule();}}
      title={'Schedule class “'+row.name+'”'} className="max-w-[620px]">
      <div className="space-y-4">
        <p className="text-sm text-body">Times are in India Standard Time (IST).
          Teaching sessions cannot overlap existing class, faculty or room bookings.</p>
        {scheduleLoading?<p role="status" className="text-sm">Loading schedule…</p>:null}
        {scheduleError?<p role="alert" className="text-sm text-error">{scheduleError}</p>:null}
        <ul className="max-h-48 space-y-2 overflow-y-auto" aria-label="Existing class sessions">
          {scheduleItems.map(item=><li key={item.id} className="border-b border-border pb-2 text-sm">
            <strong>{item.title}</strong> · {item.status} ·
            {" "}{new Date(item.startsAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"})}
          </li>)}
        </ul>
        {!scheduleLoading&&scheduleItems.length===0?
          <p className="text-sm text-muted-foreground">No class sessions scheduled yet.</p>:null}
        <form onSubmit={event=>void createSchedule(event)} className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-semibold sm:col-span-2">Session title
            <Input required maxLength={255} value={scheduleTitle}
              onChange={event=>setScheduleTitle(event.target.value)} className="mt-1"/>
          </label>
          <label className="text-sm font-semibold">Start (IST)
            <Input required type="datetime-local" value={scheduleStart}
              onChange={event=>setScheduleStart(event.target.value)} className="mt-1"/>
          </label>
          <label className="text-sm font-semibold">End (IST)
            <Input required type="datetime-local" value={scheduleEnd}
              min={scheduleStart} onChange={event=>setScheduleEnd(event.target.value)} className="mt-1"/>
          </label>
          <label className="text-sm font-semibold sm:col-span-2">Location (optional)
            <Input maxLength={500} value={scheduleLocation}
              onChange={event=>setScheduleLocation(event.target.value)} className="mt-1"/>
          </label>
          <div className="flex flex-wrap justify-end gap-2 sm:col-span-2">
            <Button variant="secondary" type="button" disabled={scheduleLoading} onClick={closeSchedule}>Close</Button>
            <Button type="submit" disabled={scheduleLoading||pending}>Add session</Button>
          </div>
        </form>
      </div>
    </Dialog>
    <ConfirmDialog open={scheduleDiscardConfirm} onOpenChange={setScheduleDiscardConfirm}
      title="Discard unsaved schedule?" description="Your unsaved session details will be lost."
      confirmLabel="Discard changes" pending={scheduleLoading}
      onConfirm={()=>{setScheduleDiscardConfirm(false);setScheduleOpen(false);}}/>
    <ConfirmDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}
      title={'Delete class “'+row.name+'”?'}
      description="Only a class with no learners, faculty assignments, schedules or course deliveries can be deleted. This action cannot be undone."
      confirmLabel="Delete class" confirmVariant="danger" pending={pending}
      onConfirm={()=>void deleteClass()}/>
    <ConfirmDialog open={discardConfirm} onOpenChange={setDiscardConfirm}
      title={'Discard edits to “'+row.name+'”?'}
      description="Your unsaved changes will be lost."
      confirmLabel="Discard edits" pending={pending}
      onConfirm={()=>{setDiscardConfirm(false);setEditing(false);setNotice("");}}/>
    {!editing && notice ? <p role="status" className="mt-1 text-xs text-body">{notice}</p> : null}
  </div>;
}
