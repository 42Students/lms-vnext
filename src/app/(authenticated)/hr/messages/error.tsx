"use client";

import { TextLink } from "@/components/ui/text-link";
import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";

export default function HrMessagesError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <div className="min-w-0 max-w-full space-y-4">
  <PageHeader title="Messages"/>
  <ErrorState title="Could not load conversations" description="We could not retrieve your employer-college conversations. This does not mean your messages are missing or have been marked read."
   action={<span className="inline-flex min-w-0 flex-wrap items-center gap-3"><Button type="button" variant="secondary" onClick={reset} className="min-h-11 md:min-h-9">Retry messages</Button><TextLink href="/hr/conversations" className="inline-flex min-h-11 items-center justify-center text-sm md:min-h-9">Back to conversations</TextLink></span>}/>
 </div>;
}
