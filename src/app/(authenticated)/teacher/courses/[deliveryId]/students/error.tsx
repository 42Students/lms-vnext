"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section role="alert" className="min-w-0 space-y-4">
 <PageHeader title="Couldn't load the class roster" />
 <p className="max-w-prose text-sm leading-6 text-body">The roster request failed. This is not the same as an empty Section.</p>
 <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
 <Button type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>
 <ButtonLink variant="secondary" href="/teacher/courses" className="w-full sm:w-auto">Courses</ButtonLink>
 </div></section>;
}
