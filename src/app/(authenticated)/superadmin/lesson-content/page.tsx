import {redirect} from "next/navigation";
import {legacySuperAdminLessonContentHref} from "@/modules/courses/super-admin-content-directory-model";

/** Preserve old LMS bookmarks while the vNext sidebar uses split modules. */
export default async function LegacySuperAdminLessonContent({
 searchParams,
}:{searchParams:Promise<Record<string,string|string[]|undefined>>}) {
 const params=await searchParams;
 redirect(legacySuperAdminLessonContentHref(params));
}
