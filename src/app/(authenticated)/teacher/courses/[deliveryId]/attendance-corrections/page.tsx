import {redirect,notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {getFacultyCorrectionAvailability} from "@/modules/attendance/faculty-correction-service";
import {facultyCorrectionQuerySchema} from "@/modules/attendance/faculty-correction-model";

/** Retire the unimplemented request-history surface without relaxing scope. */
export default async function FacultyAttendanceCorrectionsPage({params}:{
 params:Promise<{deliveryId:string}>
}){
 const {deliveryId}=await params;
 const parsed=facultyCorrectionQuerySchema.safeParse({deliveryId,window:"ALL",page:1});
 if(!parsed.success)notFound();
 await getFacultyCorrectionAvailability(await getCurrentRequestContext(),parsed.data);
 redirect("/teacher/courses/"+encodeURIComponent(deliveryId)+"/attendanceDetail");
}
