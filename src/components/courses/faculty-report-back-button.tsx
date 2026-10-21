"use client";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
/** The old report Back returns to the originating quiz, blueprint or report
 * when browser navigation exists. A direct bookmark falls back to All Quizzes. */
export function FacultyReportBackButton({fallbackHref}:{fallbackHref:string}){
 const router=useRouter();
 return <Button variant="secondary" type="button" onClick={()=>{
  if(window.history.length>1)router.back();
  else router.push(fallbackHref);
 }} className="min-h-11 md:min-h-9">
  <span aria-hidden="true">←</span> Back
 </Button>;
}
