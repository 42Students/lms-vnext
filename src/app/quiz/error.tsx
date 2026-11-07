"use client";
import {useEffect,useRef} from "react";
import {usePathname,useSearchParams} from "next/navigation";
import {Button} from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button-link";

export default function RouteError({reset}:{
  error: Error & {digest?:string}; reset:()=>void;
}){
 const pathname=usePathname();
 const search=useSearchParams();
 const routeKey=(pathname??"/quiz")+"?"+(search?.toString()??"");
 const previous=useRef(routeKey);
 // Quiz, review and embedded destinations cannot retain a previous quiz error.
 useEffect(()=>{
  if(previous.current!==routeKey){previous.current=routeKey;reset();}
 },[routeKey,reset]);
 return <main className="flex min-h-[65vh] w-full min-w-0 items-center justify-center px-4 py-10">
  <section role="alert" className="w-full min-w-0 max-w-xl space-y-4 text-center">
   <PageHeader title="Something went wrong" />
   <p className="text-sm text-body">Failed to load the quiz. Your answers are not being submitted from this error screen.</p>
   <div className="flex min-w-0 flex-col justify-center gap-2 sm:flex-row sm:flex-wrap">
    <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={reset}>Try Again</Button>
    <Button type="button" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9" onClick={()=>window.location.reload()}>Refresh page</Button>
    <ButtonLink variant="secondary" href="/learn/allQuizzes" className="w-full sm:w-auto">
      Back to quizzes
    </ButtonLink>
   </div>
  </section>
 </main>;
}
