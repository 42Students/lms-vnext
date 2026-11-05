"use client";
import {useEffect,useRef} from "react";
import {Button} from "@/components/ui/button";
import {useToast} from "@/components/ui/toast";
import { Heading } from "@/components/ui/heading";

/** Shared toast viewport is bottom-right. Show the legacy informational
 * notice once, with an accessible Retry; never duplicate an inline alert.
 */
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){
 const {showToast}=useToast();
 const announced=useRef(false);
 useEffect(()=>{
  if(announced.current)return;
  announced.current=true;
  showToast({tone:"info",title:"Couldn't load contacts",
   description:"Something went wrong on our end. Please refresh the page or try again shortly."});
 },[showToast]);
 return <section className="min-w-0 space-y-3">
  <Heading level={2} size="base">Could not load users</Heading>
  <p className="text-sm text-body">Your directory filters are kept for retry.</p>
  <Button onClick={reset} className="min-h-11 w-full md:min-h-9">Retry</Button>
 </section>;
}
