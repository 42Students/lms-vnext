import {redirect,notFound} from "next/navigation";
import {getCurrentRequestContext} from "@/auth/request-context";
import {facultyNoticeParamsSchema} from "@/modules/courses/faculty-notices-model";
import {getFacultySectionNotices} from "@/modules/courses/faculty-notices-service";

/** Retired unimplemented notice board; retain scope check for old bookmarks. */
export default async function FacultySectionNoticesPage({params}:{
 params:Promise<{deliveryId:string}>
}){
 const parsed=facultyNoticeParamsSchema.safeParse(await params);
 if(!parsed.success)notFound();
 const {deliveryId}=parsed.data;
 await getFacultySectionNotices(await getCurrentRequestContext(),{deliveryId});
 redirect("/teacher/courses/"+encodeURIComponent(deliveryId)+"/discussions");
}
