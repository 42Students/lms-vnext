import {getCurrentRequestContext} from "@/auth/request-context";
import {FacultyAssignmentsRetention} from "@/components/courses/faculty-assignments-retention";
import type {ReactNode} from "react";

/** Keep only the current member/college's previously loaded assignment rows
 * while a refreshed page is inside its local error boundary.
 */
export default async function FacultyAssignmentsLayout({children}:{children:ReactNode}){
 const context=await getCurrentRequestContext();
 const scope=[context.user.id,context.membership?.id??"",context.membership?.collegeId??""].join(":");
 return <FacultyAssignmentsRetention key={scope}>{children}</FacultyAssignmentsRetention>;
}
