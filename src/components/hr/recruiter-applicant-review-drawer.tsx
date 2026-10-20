"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Drawer } from "@/components/ui/drawer";

/** The server-authorized applicant remains selected in the URL. */
export function RecruiterApplicantReviewDrawer({
  closeHref, title, children,
}: { closeHref: string; title: string; children: ReactNode }) {
  const router = useRouter();
  return <Drawer open onOpenChange={next => { if (!next) router.replace(closeHref); }}
    title={title} description="Shared applicant review" dismissible historyMode="route"
    bodyClassName="min-w-0 space-y-4 [&>dl]:min-w-0 [&>dl]:gap-x-6 [&>dl]:gap-y-4 [&>dl]:md:grid-cols-2 [&>dl>div]:min-w-0 [&>dl>div]:break-words [&_dd]:min-w-0 [&_dd]:break-words [&_dd]:[overflow-wrap:anywhere]">
    {children}
  </Drawer>;
}
