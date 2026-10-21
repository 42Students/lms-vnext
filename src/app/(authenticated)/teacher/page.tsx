import {redirect} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {canAccessFacultyRoute} from "@/modules/courses/faculty-route-access-model";

/** The legacy faculty index is a temporary, role-scoped redirect. The
 * authenticated parent layout handles missing/expired sessions first. */
export default async function TeacherIndex(){
 const context=await getCurrentRequestContext();
 if(!canAccessFacultyRoute(context))redirect("/dashboard");
 redirect("/teacher/courses");
}
