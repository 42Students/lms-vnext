"use client";
import Link from "next/link";
import {useEffect,useRef} from "react";
import {usePathname,useSearchParams} from "next/navigation";
import {Button} from "@/components/ui/button";

export default function RouteError({reset}:{
  error: Error & {digest?:string}; reset:()=>void;
}){
 const pathname=usePathname();
 const search=useSearchParams();
 const routeKey=pathname+"?"+search.toString();
 const previous=useRef(routeKey);
 // Quiz, review and embedded destinations cannot retain a previous quiz error.
 useEffect(()=>{
  if(previous.current!==routeKey){previous.current=routeKey;reset();}
 },[routeKey,reset]);
 return <main className="flex min-h-[65vh] items-center justify-center px-4 py-10">
  <section role="alert" className="min-w-0 max-w-xl space-y-4 text-center">
   <h1 className="text-2xl font-semibold text-[var(--lms-heading)]">Something went wrong</h1>
   <p className="text-sm text-body">Failed to load the quiz. Your answers are not being submitted from this error screen.</p>
   <div className="flex flex-wrap justify-center gap-2">
    <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={reset}>Try Again</Button>
    <Button type="button" variant="secondary" className="min-h-11 md:min-h-9" onClick={()=>window.location.reload()}>Refresh page</Button>
    <Link href="/learn/allQuizzes" className="inline-flex min-h-11 items-center justify-center rounded-[var(--lms-control-radius)] border border-border px-4 text-sm font-semibold text-link md:min-h-9">
      Back to quizzes
    </Link>
   </div>
  </section>
 </main>;
}
