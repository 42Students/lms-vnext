"use client";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
export default function Error({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <section className="min-w-0 space-y-4">
 <PageHeader title="Could not load Quiz attempt details" />
 <p role="alert" className="max-w-prose text-sm leading-6 text-body">The scoped report failed to load. No results have been inferred.</p>
 <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
 <Button type="button" onClick={reset} className="w-full sm:w-auto">Retry</Button>
 <ButtonLink variant="secondary" href="/teacher/allQuizzes" className="w-full sm:w-auto">All Quizzes</ButtonLink>
 </div></section>;
}
