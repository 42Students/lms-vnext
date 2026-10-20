"use client";

import {Button} from "@/components/ui/button";
import {PageHeader} from "@/components/ui/page-header";
import {ErrorState} from "@/components/ui/error-state";

export default function HrMessagesError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <>
  <PageHeader title="Messages"/>
  <ErrorState title="Could not load conversations" description="We could not retrieve your employer-college conversations. This does not mean your messages are missing or have been marked read."
   action={<Button type="button" variant="secondary" onClick={reset}>Retry messages</Button>}/>
 </>;
}
