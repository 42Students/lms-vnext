"use client";
import { PageHeader } from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import {ErrorState} from "@/components/ui/error-state";
export default function StudentsDirectoryError({reset}:{error:Error&{digest?:string};reset:()=>void}) {
  return <div className="min-w-0 space-y-6"><PageHeader title="Students" /><ErrorState title="Students directory unavailable"
    description="The directory could not be loaded. No empty-result conclusion is assumed."
    action={<Button type="button" variant="secondary" onClick={reset}>Retry</Button>} /></div>;
}
