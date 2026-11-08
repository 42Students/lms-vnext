"use client";
import {PageHeader} from "@/components/ui/page-header";
import {Button} from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import {usePathname} from "next/navigation";

export default function Error({ reset }: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Return to a known directory tab; never build an arbitrary URL from pathname.
  const tab=(usePathname()??"").split("/")[3];
  const safeTab=tab==="allContacts"||tab==="teachers"||tab==="students"?tab:null;
  const backHref=safeTab?"/teacher/contacts/"+safeTab:"/teacher/contacts";
  return <section className="min-w-0 space-y-4">
    <PageHeader title={"Unable to load Faculty contact detail"} />
    <p role="alert" className="mt-2 text-sm text-body">
      This request failed. The absence of results is not assumed.
    </p>
    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <Button type="button" onClick={reset} className="min-h-11 w-full sm:w-auto md:min-h-9">Retry</Button>
      <ButtonLink variant="secondary" href={backHref} className="w-full sm:w-auto">
        Back to Contacts
      </ButtonLink>
    </div>
  </section>;
}
