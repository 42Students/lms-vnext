"use client";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {Dialog} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Alert} from "@/components/ui/alert";
import {useRef,useState} from "react";
import {useRouter} from "next/navigation";
import {teachingReassignPrompt} from "@/modules/courses/college-teaching-reassign-model";

export function CollegeFacultyReassignAction({assignmentId,facultyName,role,oldMembershipId,
  expectedUpdatedAt,faculty,deliveryId,deliveries}:{
  assignmentId:string;facultyName:string;role:"PRIMARY"|"CO_TEACHER"|"TA";
  oldMembershipId:string;expectedUpdatedAt:string;faculty:{id:string;label:string}[];
  deliveryId:string;
  deliveries:{id:string;label:string;courseName:string;courseCode:string;sectionName:string;
    semesterNumber:number|null;academicYear:string}[];
}) {
  const router=useRouter();
  const [open,setOpen]=useState(false);
  const [replacementMembershipId,setReplacementMembershipId]=useState("");
  const [pending,setPending]=useState(false);
  const inFlightRef=useRef(false);
  const [error,setError]=useState("");
  const candidates=faculty.filter(f=>f.id!==oldMembershipId);
  const [editOpen,setEditOpen]=useState(false);
  const [editMember,setEditMember]=useState(oldMembershipId);
  const [editDelivery,setEditDelivery]=useState(deliveryId);
  const [editRole,setEditRole]=useState(role);
  const [editActive,setEditActive]=useState(true);
  const currentDelivery=deliveries.find(item=>item.id===deliveryId);
  const [editYear,setEditYear]=useState(currentDelivery?.academicYear??"");
  const [editSemester,setEditSemester]=useState(currentDelivery?.semesterNumber==null?"":String(currentDelivery.semesterNumber));
  const selectedDelivery=deliveries.find(item=>item.id===editDelivery);
  function editHasChanges(){
    return editMember!==oldMembershipId||editDelivery!==deliveryId||editRole!==role||
      !editActive||editYear!==(currentDelivery?.academicYear??"")||
      editSemester!==(currentDelivery?.semesterNumber==null?"":String(currentDelivery.semesterNumber));
  }
  function closeEditor(){
    if(pending)return;
    if(editHasChanges()&&!window.confirm("Discard assignment changes?"))return;
    setEditOpen(false);setError("");
  }
  function closeReassign(){
    if(pending)return;
    if(replacementMembershipId&&!window.confirm("Discard assignment changes?"))return;
    setOpen(false);setReplacementMembershipId("");setError("");
  }
  function openEditor(){
    setEditMember(oldMembershipId);setEditDelivery(deliveryId);setEditRole(role);
    setEditActive(true);setEditYear(currentDelivery?.academicYear??"");
    setEditSemester(currentDelivery?.semesterNumber==null?"":String(currentDelivery.semesterNumber));
    setError("");setEditOpen(true);
  }
  async function submitEdit(){
    if(pending||inFlightRef.current||!editMember||!editDelivery)return;
    if(editActive&&!deliveries.some(item=>item.id===editDelivery)){
      setError("Select a current course and class.");return;
    }
    if(editYear&&!/^[0-9]{4}(?:-[0-9]{2,4})?$/.test(editYear)){
      setError("Use YYYY, YYYY-YY or YYYY-YYYY for Academic Year.");return;
    }
    const semester=editSemester===""?null:Number(editSemester);
    if(semester!==null&&(!Number.isInteger(semester)||semester<1||semester>20)){
      setError("Select a valid semester.");return;
    }
    if(!window.confirm("Save Changes to this faculty assignment? Earlier teaching history will be retained."))return;
    inFlightRef.current=true;setPending(true);setError("");
    try{
      const response=await fetch("/api/college/teaching-assignments/"+encodeURIComponent(assignmentId)+"/edit",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({expectedMembershipId:oldMembershipId,expectedUpdatedAt,
          membershipId:editMember,deliveryId:editDelivery,role:editRole,isActive:editActive,
          academicYear:editYear||null,semesterNumber:semester}),
      });
      if(!response.ok){
        const payload=await response.json().catch(()=>({})) as {error?:string;message?:string};
        throw Error(payload.message??payload.error??"Could not update assignment.");
      }
      setEditOpen(false);router.refresh();
    }catch(cause){setError(cause instanceof Error?cause.message:"Could not update assignment.");}
    finally{inFlightRef.current=false;setPending(false);}
  }
  async function submit(){
    const target=candidates.find(f=>f.id===replacementMembershipId);
    if(!target||pending||inFlightRef.current)return;
    inFlightRef.current=true;
    setPending(true);setError("");
    try {
      const response=await fetch("/api/college/teaching-assignments/"+encodeURIComponent(assignmentId)+"/reassign",{
        method:"PATCH",headers:{"content-type":"application/json"},
        body:JSON.stringify({expectedMembershipId:oldMembershipId,replacementMembershipId,
          expectedUpdatedAt,confirm:true}),
      });
      if(!response.ok){
        const payload=await response.json().catch(()=>({error:"REASSIGNMENT_FAILED"})) as {error?:string};
        throw new Error(payload.error??"REASSIGNMENT_FAILED");
      }
      setOpen(false);setReplacementMembershipId("");router.refresh();
    }catch(reason){setError(reason instanceof Error?reason.message:"Reassignment failed.");}
    finally{inFlightRef.current=false;setPending(false);}
  }
  return <div className="min-w-0 space-y-[var(--lms-space-2)]">
    <Button variant="secondary" type="button" disabled={pending||candidates.length===0} onClick={()=>{setError("");setOpen(true);}}
      aria-label={"Reassign "+facultyName+" · assignment "+assignmentId}
      className="min-h-11 w-full sm:w-auto md:min-h-9">
      Reassign
    </Button>
    <Button variant="secondary" type="button" disabled={pending}
      onClick={openEditor} aria-label={"Edit assignment "+assignmentId+" for "+facultyName}
      className="min-h-11 w-full sm:w-auto md:min-h-9">Edit</Button>
    <Dialog open={editOpen} onOpenChange={value=>{if(!value)closeEditor();}}
      title={"Edit Faculty Assignment · "+facultyName} className="max-w-[500px]"
      dismissible={!pending} footer={<>
        <Button variant="secondary" type="button" disabled={pending}
          onClick={closeEditor}>Cancel</Button>
        <Button variant="primary" type="button" loading={pending} disabled={pending||!editMember||!editDelivery}
          onClick={()=>void submitEdit()}>{pending?"Saving…":"Save Changes"}</Button>
      </>}>
      <div className="grid min-w-0 gap-3">
        <label className="grid gap-1 text-sm font-semibold">Faculty
          <Select value={editMember} disabled={pending} onChange={event=>setEditMember(event.target.value)}>
            {faculty.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Course and class
          <Select value={editDelivery} disabled={pending||!editActive}
            onChange={event=>{
              const found=deliveries.find(item=>item.id===event.target.value);
              setEditDelivery(event.target.value);
              if(found){setEditYear(found.academicYear);
                setEditSemester(found.semesterNumber==null?"":String(found.semesterNumber));}
            }}>
            {!selectedDelivery?<option value={editDelivery}>Current archived or unlisted delivery</option>:null}
            {deliveries.map(item=><option key={item.id} value={item.id}>
              {item.courseName} ({item.courseCode}) · {item.sectionName} · {item.academicYear}
            </option>)}
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Semester
          <Input type="number" min={1} max={20} value={editSemester} disabled={pending||!editActive}
            onChange={event=>setEditSemester(event.target.value)}/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Academic Year
          <Input maxLength={9} value={editYear} disabled={pending||!editActive}
            onChange={event=>setEditYear(event.target.value)} placeholder="YYYY-YY"/>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Role
          <Select value={editRole} disabled={pending||!editActive}
            onChange={event=>setEditRole(event.target.value as typeof role)}>
            <option value="PRIMARY">Primary</option>
            <option value="CO_TEACHER">Co-teacher</option>
            <option value="TA">Teaching assistant</option>
          </Select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">Active
          <Select value={editActive?"YES":"NO"} disabled={pending}
            onChange={event=>setEditActive(event.target.value==="YES")}>
            <option value="YES">Yes</option><option value="NO">No — end assignment</option>
          </Select>
        </label>
        <p className="text-xs text-muted-foreground">
          Course and class follow a verified delivery. Semester and year are historical labels;
          editing them does not change the academic period or enrolled students.
        </p>
        {error?<Alert tone="error">{error}</Alert>:null}
      </div>
    </Dialog>
    <Dialog open={open} onOpenChange={next=>{if(!next)closeReassign();}} title={"Reassign "+facultyName+" · "+role} dismissible={!pending} footer={<>
<Button variant="secondary" type="button" disabled={pending} onClick={closeReassign}
            className="min-h-11 w-full sm:w-auto md:min-h-9">Cancel</Button>
          <Button variant="primary" type="button" disabled={pending||!replacementMembershipId} onClick={submit}
            className="min-h-11 w-full sm:w-auto md:min-h-9" loading={pending}>
            {pending?"Reassigning…":"Confirm replacement"}
          </Button>
</>}>
        <p className="text-sm text-body">Replace {facultyName}; existing teaching history will be retained.</p>
        <label className="grid min-w-0 gap-[6px] text-[13px] font-semibold text-[var(--lms-neutral-400)] leading-4">Replacement Faculty
          <Select value={replacementMembershipId} disabled={pending} onChange={e=>{setReplacementMembershipId(e.target.value);setError("");}}>
            <option value="">Choose Faculty</option>
            {candidates.map(person=><option key={person.id} value={person.id}>{person.label}</option>)}
          </Select>
        </label>
        {replacementMembershipId?<Alert tone="info">{teachingReassignPrompt(facultyName,candidates.find(person=>person.id===replacementMembershipId)?.label??"Faculty",role)}</Alert>:null}
        {error?<Alert tone="error">{error}</Alert>:null}
        
    </Dialog>
    {!open&&error?<Alert tone="error">{error}</Alert>:null}
  </div>;
}
