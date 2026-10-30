"use client";

import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";

/** A same-URL Link may reuse the failed server payload. Preserve the current
 * authorized filter URL while requesting fresh teaching assignments. */
export function FacultyCoursesRetry(){
 const router=useRouter();
 return <Button type="button" variant="secondary" size="sm"
  onClick={()=>router.refresh()}>Retry courses</Button>;
}
