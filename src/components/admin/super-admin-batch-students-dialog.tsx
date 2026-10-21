"use client";
import {useState} from "react";
import {Dialog} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import {SuperAdminBatchRosterManager} from "@/components/admin/super-admin-batch-roster-manager";
type Student={learnerEnrollmentId:string;memberId:string;name:string|null;email:string|null;roll:string|null;classId:string|null};
type ClassRow={id:string;name:string;code:string;capacity:number|null;status:string;learnerCount:number;academicPeriodId:string};
/** A modal entry like the legacy Batch students drawer, without losing the
 * canonical deep link or the server-checked class move controller. */
export function SuperAdminBatchStudentsDialog({name,students,classes}:{
 name:string;students:readonly Student[];classes:readonly ClassRow[];
}){
 const [open,setOpen]=useState(false);
 return <>
  <Button variant="secondary" type="button" onClick={()=>setOpen(true)}
   className="min-h-11 w-full md:min-h-9 md:w-auto">Manage students ({students.length})</Button>
  <Dialog open={open} onOpenChange={setOpen} title={"Manage students · "+name}
   description="Search and move active class assignments inside this batch."
   className="!max-w-[980px]" footer={<Button type="button" variant="secondary" onClick={()=>setOpen(false)}>Close</Button>}>
   <SuperAdminBatchRosterManager students={students} classes={classes}/>
  </Dialog>
 </>;
}
