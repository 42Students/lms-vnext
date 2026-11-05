"use client";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { ButtonLink } from "@/components/ui/button-link";
export default function FacultyProfileDetailsError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
 return <ErrorState title="Faculty profile could not load" description="Your previous information has not been changed."
 action={<div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row"><Button onClick={reset} className="w-full sm:w-auto">Retry</Button><ButtonLink variant="secondary" href="/teacher/profile" className="w-full sm:w-auto">Profile</ButtonLink></div>}/>;
}
