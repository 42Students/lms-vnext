"use client";
import {Button} from "@/components/ui/button";
export default function HrMessagesError({reset}:{
 error:Error & {digest?:string};reset:()=>void;
}) {
 return <section role="alert" className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
  <h1 className="text-lg font-semibold text-foreground">Notifications are temporarily unavailable</h1>
  <p className="mx-auto mt-2 max-w-xl text-sm text-body">
   We could not retrieve your company-scoped in-app notification records.
   This does not mean your inbox is empty or all notifications have been read.
  </p>
  <Button className="mt-5" onClick={reset}>Retry notifications</Button>
 </section>;
}
