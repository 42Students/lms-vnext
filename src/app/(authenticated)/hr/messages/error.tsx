"use client";
import {Button} from "@/components/ui/button";
export default function HrMessagesError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}) {
 return <section role="alert" className="border-b border-border pb-6 text-left">
  <h1 className="text-[30px] font-semibold leading-10 text-[var(--lms-heading)]">Messages are temporarily unavailable</h1>
  <p className="mt-2 max-w-xl text-sm text-body">
   We could not retrieve your employer-college conversations.
   This does not mean your messages are missing or have been marked read.
  </p>
  <Button className="mt-5" onClick={reset}>Retry messages</Button>
 </section>;
}
