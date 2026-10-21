"use client";

import { useEffect, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {apiFetch,FriendlyFetchError} from "@/lib/api-fetch";
import {availableSuperAdminProgramCode,validLegacyProgramYears} from "@/modules/admin-ui/super-admin-program-input";
import { ProgramActions } from "@/components/academics/academics-actions";
import { createCollegeProgramSchema } from "@/modules/academics/college-program-mutation-model";
import { Button } from "@/components/ui/button";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageSizeSelect } from "@/components/ui/page-size-select";
import { useToast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import {
  adminProgramsCsv,
  filterAdminPrograms,
  paginateAdminPrograms,
  type AdminProgramRow,
  programDurationYearsLabel, legacyDurationYearsToTerms,
} from "@/modules/admin-ui/program-directory";

const PROGRAM_SIZE_KEY = "admin-programs-page-size";
const FALLBACK_PROGRAM_SIZE_KEY = "42lms-program-page-size";
function listenSize(fn: () => void) {
  window.addEventListener("storage", fn);
  window.addEventListener("lms-program-size", fn);
  return () => { window.removeEventListener("storage", fn); window.removeEventListener("lms-program-size", fn); };
}
function storedSize(): number {
  try {
    const size = Number(localStorage.getItem(PROGRAM_SIZE_KEY)??localStorage.getItem(FALLBACK_PROGRAM_SIZE_KEY));
    return [10,25,50,100].includes(size) ? size : 25;
  } catch { return 25; }
}
function rememberSize(size: number) {
  try { localStorage.setItem(PROGRAM_SIZE_KEY, String(size)); } catch { return; }
  window.dispatchEvent(new Event("lms-program-size"));
}

const columns = (departments: readonly {id:string;name:string}[]): DataTableColumn<AdminProgramRow>[] => [
  {
    key: "name", header: "Program Name", mobilePriority: "primary",
    cell: (item) => (
      <div>
        <p className="m-0 min-w-0 break-words font-semibold text-foreground">{item.name}</p>
        <p className="m-0 text-xs text-muted-foreground">{item.code}</p>
      </div>
    ),
  },
  { key: "duration", header: "Duration", mobilePriority: "secondary", className:"min-w-[110px]", cell: (item) => programDurationYearsLabel(item.durationTerms) },
  { key: "department", header: "Department", mobilePriority: "secondary", cell: (item) => item.departmentName||"Name unavailable" },
  {
    key: "contents",
    header: "Contents", className:"min-w-[250px]",
    cell: (item) => item.contents
      ? <div className="flex min-w-[220px] flex-wrap gap-1.5" aria-label={"Linked records for "+item.name}>
          {([
            ["Semesters",item.contents.semesters],
            ["Batches",item.contents.batches],
            ["Classes",item.contents.classes],
          ] as const).map(([label,count])=><span key={label}
            title={String(count)+" "+label.toLowerCase()+" linked to this program, including archived records"}
            className={"inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium "+
             (count>0?"border-[var(--lms-info-border)] bg-[var(--lms-info-subtle)] text-[var(--lms-primary-text)]":"border-border bg-muted text-muted-foreground")}>
            {count} {count===1?label.slice(0,-1):label}
           </span>)}
        </div>
      : <span role="status" className="text-xs text-muted-foreground">Checking dependencies…</span>,
  },
  {
    key: "actions",
    mobilePriority: "action",
    header: <span className="sr-only">Actions</span>,
    className: "min-w-[165px] text-right",
    cell: (item) => <ProgramActions compactActions displayDurationYears program={{
      id: item.id,
      name: item.name,
      code: item.code,
      durationTerms: item.durationTerms,
      departmentId: item.departmentId,
    }} departments={departments} contents={item.contents ?? null} />,
  },
];

export function AdminProgramDirectory({
  programs,
  departments,
}: {
  programs: readonly AdminProgramRow[];
  departments: readonly { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname=usePathname();
  const departmentHref=pathname.startsWith("/college/")?"/college/departments":"/admin/departments";
  const { showToast } = useToast();
  const [pending, startTransition] = useTransition();
  const [departmentId, setDepartmentId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [durationYears, setDurationYears] = useState("4");
  const [departmentSearch,setDepartmentSearch]=useState("");
  const [refreshPending,startRefresh]=useTransition();
  const [fieldErrors,setFieldErrors]=useState<{department?:string;name?:string;duration?:string}>({});
  const [createError,setCreateError]=useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch,setDebouncedSearch]=useState("");
  useEffect(()=>{
    const handle=window.setTimeout(()=>setDebouncedSearch(search),220);
    return ()=>window.clearTimeout(handle);
  },[search]);
  const [page, setPage] = useState(1);
  const pageSize = useSyncExternalStore(listenSize, storedSize, () => 25);

  const filtered = filterAdminPrograms(programs, debouncedSearch);
  const result = paginateAdminPrograms(filtered, page, pageSize);
  const csvHref = "data:text/csv;charset=utf-8," +
    encodeURIComponent("\ufeff" + adminProgramsCsv(filtered));

  function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if(pending)return;
    setCreateError("");
    const errors:{department?:string;name?:string;duration?:string}={};
    if(!departmentId)errors.department="Please select a department";
    if(!name.trim())errors.name="Please enter program name";
    else if(name.length>255)errors.name="Maximum 255 characters";
    if(!durationYears.trim())errors.duration="Please enter program duration";
    else if(!validLegacyProgramYears(durationYears))
      errors.duration="Duration must be a whole number from 1 to 10 years.";
    setFieldErrors(errors);
    if(Object.keys(errors).length)return;
    const resolvedCode=code.trim()||availableSuperAdminProgramCode(name,departmentId,programs);
    if(programs.some(row=>row.departmentId===departmentId&&
      row.code.toLowerCase()===resolvedCode.toLowerCase())){
      setCreateError("Program code already exists in this department. Enter another code.");
      return;
    }
    const parsed=createCollegeProgramSchema.safeParse({
      departmentId,name,code:resolvedCode,
      durationTerms:legacyDurationYearsToTerms(Number(durationYears)),
    });
    if(!parsed.success){
      const issue=parsed.error.issues[0],key=issue?.path[0];
      const message=issue?.message??"Enter a valid department, program, code and duration.";
      if(key==="departmentId")setFieldErrors({department:"Please select a department"});
      else if(key==="name")setFieldErrors({name:"Program name cannot be empty"});
      else if(key==="durationTerms")setFieldErrors({duration:message});
      else setCreateError(message);
      return;
    }
    startTransition(async () => {
      try {
        await apiFetch("/api/academics/programs",{
          method:"POST",headers:{"content-type":"application/json"},
          body:JSON.stringify(parsed.data),
        });
        setName("");setCode("");setFieldErrors({});setCreateError("");
        showToast({tone:"success",title:`Created program “${name.trim()}”. Next, create its semesters and batches.`});
        router.refresh();
      }catch(error){
        const message=error instanceof Error?error.message:"Failed to create program.";
        setCreateError(message);
        if(error instanceof FriendlyFetchError){
          if(error.code==="PROGRAM_NAME_CONFLICT"){
            setFieldErrors({name:"Program name already exists in this department"});
            setCreateError("Program name already exists in this department");
          }else if(error.code==="PROGRAM_CODE_CONFLICT")setCreateError("Program code already exists in this department");
          else if(error.fieldErrors.name)setFieldErrors({name:error.fieldErrors.name});
          else if(error.fieldErrors.departmentId)setFieldErrors({department:error.fieldErrors.departmentId});
          else if(error.fieldErrors.durationTerms)setFieldErrors({duration:error.fieldErrors.durationTerms});
        }else if(/dept_id|departmentId|department/i.test(message))setFieldErrors({department:message});
        else if(/duration_years|durationTerms|durationYears/i.test(message))setFieldErrors({duration:message});
        else if(/(?:program )?name/i.test(message))setFieldErrors({name:message});
        showToast({tone:"error",title:"Program was not created",description:message});
      }
    });
  }

  return (
    <div className="grid min-w-0 items-start gap-6 lg:grid-cols-[minmax(0,10fr)_minmax(0,14fr)]">
      <section aria-label="Create New Program" className="min-w-0 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4 print:hidden">
        <h2 className="m-0 font-semibold text-[var(--lms-heading)] text-[var(--lms-font-lg)]">Create New Program</h2>
        <form onSubmit={create} noValidate className="min-w-0 pt-3">
        {createError?<Alert tone="error" role="alert">
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-2">
            <span><strong>Program was not created.</strong> {createError}</span>
            <Button type="button" variant="secondary" size="sm" onClick={()=>setCreateError("")}>Dismiss</Button>
          </div>
        </Alert>:null}
        <p className="mt-1 text-sm text-muted-foreground">
          Programs belong to a department. Choose the usual academic years; two terms are stored per year.
        </p>
        {departments.length === 0 ? (
          <Alert tone="warning" className="mt-3">
            <strong>No departments in this college yet</strong> · Create a department before adding a program. <Link href={departmentHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text underline hover:text-[var(--lms-primary-text)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Go to Departments</Link>
          </Alert>
        ) : null}
        <div className="mt-4 grid min-w-0 grid-cols-1 gap-4">
          <div>
            <label htmlFor="admin-program-department" className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Department</label>
            <Input type="search" className="mb-2 min-h-11 md:min-h-9" value={departmentSearch}
              onChange={event=>setDepartmentSearch(event.target.value)}
              aria-label="Search departments" placeholder="Search departments" maxLength={100}/>
            <Select
              className="min-h-11 md:min-h-9" id="admin-program-department" value={departmentId}
              onChange={(event) => {setDepartmentId(event.target.value);setFieldErrors(old=>({...old,department:undefined}));}}
              aria-invalid={Boolean(fieldErrors.department)} aria-describedby={fieldErrors.department?"admin-program-department-error":undefined}
              required
            >
              <option value="">{departments.length?"Select department":"No departments available"}</option>
              {departments.filter(department=>department.id===departmentId||department.name.toLocaleLowerCase("en").includes(departmentSearch.trim().toLocaleLowerCase("en"))).map(department=>(
                <option key={department.id} value={department.id}>{department.name}</option>
              ))}
            </Select>
            {fieldErrors.department?<p id="admin-program-department-error" role="alert" className="mt-1 text-xs text-error">{fieldErrors.department}</p>:null}
          </div>
          <div>
            <label htmlFor="admin-program-name" className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program Name</label>
            <Input className="min-h-11 md:min-h-9" id="admin-program-name" value={name} maxLength={255} required
              onChange={(event) => {setName(event.target.value);setFieldErrors(old=>({...old,name:undefined}));}}
              aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name?"admin-program-name-error":undefined}
              placeholder="e.g., B.Tech Computer Science" />
            {fieldErrors.name?<p id="admin-program-name-error" role="alert" className="mt-1 text-xs text-error">{fieldErrors.name}</p>:null}
          </div>
          <div>
            <label htmlFor="admin-program-code" className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program code (optional)</label>
            <p className="mb-1 text-xs text-muted-foreground">Leave blank to generate a unique code for this department.</p>
            <Input className="min-h-11 md:min-h-9" id="admin-program-code" value={code} maxLength={64}
              onChange={(event) => setCode(event.target.value)} placeholder="CSE" />
          </div>
          <div>
            <label htmlFor="admin-program-duration" className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Duration (Years)</label>
            <div className="flex min-w-0 items-stretch">
              <Input className="min-h-11 min-w-0 flex-1 rounded-r-none md:min-h-9" id="admin-program-duration" type="number" value={durationYears}
               onChange={(event) => {setDurationYears(event.target.value);setFieldErrors(old=>({...old,duration:undefined}));}}
               aria-invalid={Boolean(fieldErrors.duration)} aria-describedby={fieldErrors.duration?"admin-program-duration-error":undefined}
               placeholder="e.g., 4" min={1} max={10} step={1} required />
              <span className="inline-flex shrink-0 items-center rounded-r-[var(--lms-control-radius)] border border-l-0 border-border bg-muted px-3 text-sm text-body">Years</span>
            </div>
            {fieldErrors.duration?<p id="admin-program-duration-error" role="alert" className="mt-1 text-xs text-error">{fieldErrors.duration}</p>:null}
          </div>
        </div>
        <div className="mt-4 flex justify-stretch md:justify-end">
          <Button type="submit" className="min-h-11 w-full md:min-h-9 md:w-auto" disabled={pending || departments.length === 0}>
            {pending ? <span className="inline-flex items-center gap-2"><svg aria-hidden="true" className="size-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" strokeDasharray="40 16"/></svg>Creating…</span> : <span className="inline-flex items-center gap-2"><svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>Create Program</span>}
          </Button>
        </div>
        </form>
      </section>
      <section className="min-w-0 space-y-3 rounded-[var(--lms-canvas-radius)] border border-[var(--lms-canvas-border)] bg-surface p-4" aria-label="Existing Programs">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <h2 className="m-0 text-base font-semibold">Existing Programs</h2>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <a href={csvHref} download="programs.csv" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border bg-surface px-3 text-sm font-semibold text-primary-text hover:bg-primary-subtle focus-visible:outline-2 focus-visible:outline-[var(--lms-primary-text)] md:min-h-9">Export CSV</a>
            <Button variant="secondary" size="sm" disabled={refreshPending} className="min-h-11 md:min-h-9"
              onClick={()=>startRefresh(()=>router.refresh())}>{refreshPending?"Refreshing programs…":"Refresh"}</Button>
          </div>
        </div>
        {refreshPending?<p role="status" aria-live="polite" className="text-sm text-muted-foreground">Refreshing programs…</p>:null}
        <div className="flex min-w-0 flex-col gap-3 print:hidden sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full min-w-0 md:max-w-xl md:flex-1">
            <label htmlFor="admin-program-search" className="mb-[6px] block text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Search programs or departments</label>
            <Input type="search" className="min-h-11 md:min-h-9" id="admin-program-search" value={search}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Search programs or departments" />
          </div>
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            {result.total} of {programs.length} {programs.length === 1 ? "result" : "results"}
          </p>
          {search.trim() ? <Button variant="ghost" className="min-h-11 md:min-h-9"
            onClick={() => { setSearch(""); setPage(1); }}>Clear search</Button> : null}
        </div>
        <DataTable columns={columns(departments)} rows={result.items}
          mobileMode="scroll" className="min-w-0 [&_table]:min-w-max"
          getRowKey={(item) => item.id}
          empty={<p className="m-0 text-sm text-muted-foreground">
            {search.trim()
              ? "No matching programs. Clear search to see all."
              : "No programs found. Create a department first."}
          </p>} />
        {result.total > 0 ? (
          <div className="flex min-w-0 flex-col gap-3 text-sm text-muted-foreground print:hidden md:flex-row md:items-center md:justify-between">
            <span>Showing {(result.page - 1) * pageSize + 1}–{Math.min(result.page * pageSize, result.total)} of {result.total}</span>
            <div className="flex min-w-0 flex-wrap items-center justify-start gap-2 md:justify-end">
              <PageSizeSelect id="admin-program-page-size" label="Rows per page"
               options={[10,25,50,100]} value={pageSize}
               onChange={event=>{rememberSize(Number(event.target.value));setPage(1);}}
               wrapperClassName="w-28 shrink-0" />
              <Button size="sm" variant="secondary" className="min-h-11 md:min-h-9" disabled={result.page === 1}
                onClick={() => setPage(result.page - 1)}>Previous</Button>
              <span aria-live="polite">Page {result.page} of {result.pages}</span>
              <Button size="sm" variant="secondary" className="min-h-11 md:min-h-9" disabled={result.page === result.pages}
                onClick={() => setPage(result.page + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
