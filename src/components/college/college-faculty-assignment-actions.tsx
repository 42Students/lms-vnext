"use client";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

import { useCollegeConfirmation } from "@/components/college/use-college-confirmation";

import { FACULTY_ASSIGNMENT_COPY, FACULTY_ASSIGNMENT_ROLE_LABELS } from "@/modules/courses/college-courses-copy";
import { apiFetch } from "@/lib/api-fetch";
import { academicSetupErrorMessage } from "@/modules/academics/academic-setup-error-copy";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Option = { id: string; label: string };
type CourseTeachingRole = "PRIMARY" | "CO_TEACHER" | "TA";

type BulkResult={
  created?:string[];
  failed?:Array<{deliveryId:string;reason:string}>;
};

type DeliveryOption = Option & {
  programId: string; programName: string; cohortId: string; cohortName: string;
  sectionId: string; sectionName: string; semesterNumber: number | null;
  academicYear: string; courseName: string; courseCode: string;
};
export function CollegeFacultyAssignmentCreate({
  deliveries, faculty, deliveriesTruncated, facultyTruncated,
}: {
  deliveries: DeliveryOption[]; faculty: Option[];
  deliveriesTruncated: boolean; facultyTruncated: boolean;
}) {
  const router = useRouter();
  const {ask,confirmation}=useCollegeConfirmation();
  const [programId, setProgramId] = useState("");
  const [cohortId, setCohortId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [semesterNumber, setSemesterNumber] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [membershipId, setMembershipId] = useState("");
  const [role, setRole] = useState<CourseTeachingRole>("PRIMARY");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [messageWarning, setMessageWarning] = useState(false);
  const programs = Array.from(new Map(deliveries.map(item =>
    [item.programId, item.programName])).entries());
  const batches = Array.from(new Map(deliveries.filter(item => item.programId === programId)
    .map(item => [item.cohortId, item.cohortName])).entries());
  const classes = Array.from(new Map(deliveries.filter(item => item.cohortId === cohortId)
    .map(item => [item.sectionId, item.sectionName])).entries());
  const scoped = deliveries.filter(item => item.programId === programId &&
    item.cohortId === cohortId && item.sectionId === sectionId);
  const semesters = [...new Set(scoped.map(item => item.semesterNumber).filter(
    (item): item is number => item !== null))].sort((a, b) => a - b);
  const years = [...new Set(scoped.map(item => item.academicYear))].sort();
  // Preserve legacy custom-year entry without falsely creating an academic
  // offering that does not exist in the authoritative vNext delivery catalog.
  const yearSuggestions = [...new Set([
    ...years,
    ...Array.from({length:27},(_,index)=>String(new Date().getFullYear()-13+index)),
  ])].sort();
  const yearFormat = /^[0-9]{4}(?:-(?:[0-9]{2}|[0-9]{4}))?$/;
  const choices = scoped.filter(item =>
    (semesterNumber === "" || String(item.semesterNumber) === semesterNumber) &&
    (academicYear === "" || item.academicYear === academicYear));
  function resetParents(next: "program" | "batch" | "class", id: string) {
    if (next === "program") {
      setProgramId(id); setCohortId(""); setSectionId("");
    } else if (next === "batch") { setCohortId(id); setSectionId(""); }
    else setSectionId(id);
    setSemesterNumber(""); setAcademicYear(""); setSelected([]); setError(null);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setMessage(null);setMessageWarning(false);
    if (!programId) { setError("Select a program");return; }
    if (!cohortId) { setError("Select a batch");return; }
    if (!sectionId) { setError("Select a class");return; }
    if (!semesterNumber) { setError("Select a semester");return; }
    if (!academicYear || !yearFormat.test(academicYear)) {
      setError("Use YYYY-YY, YYYY-YYYY or YYYY.");return;
    }
    if(!scoped.some(item=>String(item.semesterNumber)===semesterNumber &&
      item.academicYear===academicYear)){
      setError("No course delivery exists for that semester and academic year. Create the period and course delivery first.");return;
    }
    if (!membershipId) {setError("Select faculty");return;}
    if (!selected.length) {setError("Select one or more courses");return;}
    const allowed = new Set(choices.map(item=>item.id));
    if(selected.some(id=>!allowed.has(id))){
      setError("Selected courses changed with the semester/year. Choose them again.");return;
    }
    const teacher = faculty.find(item => item.id === membershipId)?.label ?? "Faculty";
    if (!(await ask(`Assign ${teacher} to ${selected.length} selected course(s)? Existing assignments and duplicate primary lecturers will be refused.`))) return;
    setSaving(true);
    try {
      const data=await apiFetch<BulkResult>("/api/college/teaching-assignments/bulk",{
        method:"POST",headers:{"content-type":"application/json"},
        body:JSON.stringify({deliveryIds:selected,membershipId,role}),
      });
      const successes = data?.created?.length ?? 0;
      const failures = data?.failed ?? [];
      setMessageWarning(failures.length>0||successes===0);
      const successCopy=successes===1?"Created teaching assignment for this class.":
        successes>1?"Bulk associations created successfully.":"No teaching assignments were created.";
      setMessage(successCopy +
        (failures.length ? " " + failures.map(item => {
          const option = deliveries.find(row => row.id === item.deliveryId);
          return (option?.courseName ?? "Selected course") + ": could not be assigned; review and retry.";
        }).join("; ") : ""));
      setSelected(failures.map(item => item.deliveryId));
      router.refresh();
    } catch (cause) {
      setError(academicSetupErrorMessage(cause, FACULTY_ASSIGNMENT_COPY.createFailed));
    } finally { setSaving(false); }
  }
  const fieldClass = "min-w-0";
  return <>{confirmation}<section aria-label="Assign Faculty to multiple courses"
    className="min-w-0">
    <h2 className="sr-only">{FACULTY_ASSIGNMENT_COPY.createTitle}</h2>
    <form onSubmit={event => void submit(event)} className="mt-[var(--lms-space-3)] grid min-w-0 max-w-[1100px] gap-[var(--lms-space-3)] md:grid-cols-2 xl:grid-cols-4">
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Program
        <Select required className={fieldClass} value={programId}
          onChange={event => resetParents("program", event.target.value)}>
          <option value="">Choose program</option>
          {programs.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Batch
        <Select required className={fieldClass} value={cohortId}
          onChange={event => resetParents("batch", event.target.value)}>
          <option value="">Choose batch</option>
          {batches.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Class/Section
        <Select required className={fieldClass} value={sectionId}
          onChange={event => resetParents("class", event.target.value)}>
          <option value="">Choose class</option>
          {classes.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Semester
        <Select required className={fieldClass} value={semesterNumber}
          onChange={event => { setSemesterNumber(event.target.value); setSelected([]); }}>
          <option value="">Select a semester</option>
          {semesters.map(term => <option key={term} value={term}>Semester {term}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Academic Year
        <Input required className={fieldClass} value={academicYear} list="faculty-assignment-year-options"
          placeholder="YYYY-YY, YYYY-YYYY or YYYY"
          maxLength={9}
          onChange={event => { setAcademicYear(event.target.value.trim()); setSelected([]); }}/>
        <datalist id="faculty-assignment-year-options">
          {yearSuggestions.map(year=><option key={year} value={year}/>)}
        </datalist>
        <span className="text-xs font-normal text-muted-foreground">
          Historic and future years can be entered, but assigning requires a matching saved course delivery.
        </span>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">Faculty
        <Select required className={fieldClass} value={membershipId}
          onChange={event => setMembershipId(event.target.value)}>
          <option value="">Choose faculty</option>
          {faculty.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
        </Select>
      </label>
      <label className="grid min-w-0 gap-2 text-[13px] font-semibold leading-4 text-[var(--lms-neutral-400)]">{FACULTY_ASSIGNMENT_COPY.roleLabel}
        <Select className={fieldClass} value={role}
          onChange={event => setRole(event.target.value as CourseTeachingRole)}>
          <option value="PRIMARY">{FACULTY_ASSIGNMENT_ROLE_LABELS.PRIMARY}</option>
          <option value="CO_TEACHER">{FACULTY_ASSIGNMENT_ROLE_LABELS.CO_TEACHER}</option>
          <option value="TA">{FACULTY_ASSIGNMENT_ROLE_LABELS.TA}</option>
        </Select>
      </label>
      <fieldset className="min-w-0 space-y-[var(--lms-space-3)] md:col-span-2 xl:col-span-4">
        <legend className="text-sm font-semibold">Courses to Assign ({selected.length} selected)</legend>
        <div className="max-h-[20rem] min-w-0 space-y-[var(--lms-space-2)] overflow-y-auto rounded-[var(--lms-control-radius)] border border-[var(--lms-canvas-border)] p-[var(--lms-space-3)]">
          {choices.length === 0 && <EmptyState title="No eligible courses" description="Select a program, batch and class to view eligible courses."/>}
          {choices.map(item => <label key={item.id} className="flex min-h-11 min-w-0 items-center gap-[var(--lms-space-2)] rounded-[var(--lms-control-radius)] px-[var(--lms-space-2)] text-sm leading-5 hover:bg-[var(--lms-primary-subtle)]">
            <Checkbox checked={selected.includes(item.id)}
              onChange={event => setSelected(previous => event.target.checked
                ? [...previous, item.id] : previous.filter(id => id !== item.id))} />
            {item.courseName} ({item.courseCode}) · {item.academicYear}
          </label>)}
        </div>
      </fieldset>
      <div className="min-w-0 md:col-span-2 xl:col-span-4">
        <Button variant="primary" type="submit" className="min-h-11 w-full sm:w-auto md:min-h-9" loading={saving} disabled={saving}>
          {saving ? "Assigning…" : `Assign to ${selected.length} course(s)`}
        </Button>
      </div>
    </form>
    {(deliveriesTruncated || facultyTruncated) && <Alert tone="warning" className="mt-[var(--lms-space-3)]">Only the first 200 active delivery or faculty records are listed. Narrow the selection or use its own course workspace.</Alert>}
    {error && <Alert tone="error" className="mt-[var(--lms-space-3)]">{error}</Alert>}
    {message && <Alert tone={messageWarning?"warning":"success"} className="mt-[var(--lms-space-3)]">{message}</Alert>}
    <p className="mt-3 text-xs text-muted-foreground">
      vNext bulk selection assigns multiple courses to one faculty member at a time.
      Use a separate confirmed operation per faculty member. Assignments reference saved
      course deliveries, preserving the enrolled class, academic period and semester;
      ending an assignment retains teaching history rather than hard-deleting it.
    </p>
  </section></>;
}

export function CollegeFacultyAssignmentEnd({
  assignmentId, facultyName, courseName, role,
}: {
  assignmentId: string;
  facultyName: string;
  courseName: string;
  role: CourseTeachingRole;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [confirming,setConfirming]=useState(false);
  const [success,setSuccess]=useState("");
  const [error, setError] = useState<string | null>(null);
  async function end() {

    setError(null);
    setSaving(true);
    try {
      await apiFetch<void>(
        "/api/courses/teaching-assignments/" + encodeURIComponent(assignmentId),
        {method:"DELETE"},
      );
      setSuccess("Association deactivated successfully. Teaching history is retained.");setConfirming(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Assignment could not be ended.");
    } finally {
      setSaving(false);
    }
  }
  return <div className="min-w-0 space-y-[var(--lms-space-2)]">
    <Button variant="secondary" type="button" loading={saving} disabled={saving}
      onClick={()=>{setConfirming(true);setError(null);}} className="min-h-11 w-full sm:w-auto md:min-h-9">
      {saving?"Ending…":"End assignment"}
    </Button>
    {success?<Alert tone="success">{success}</Alert>:null}
    {!confirming&&error?<Alert tone="error">{error}</Alert>:null}
    <ConfirmDialog open={confirming} onOpenChange={setConfirming}
      title={"End "+role+" assignment?"}
      description={"End "+role+" assignment for "+facultyName+" in "+courseName+"? This cannot be undone. Teaching history is retained."}
      confirmLabel="Confirm end" confirmVariant="danger" pending={saving}
      onConfirm={()=>void end()}>
      {error?<Alert tone="error">{error}</Alert>:<p className="text-sm text-body">Teaching history will be retained.</p>}
    </ConfirmDialog>
  </div>;
}
