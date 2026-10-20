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
    title={title} description="Shared applicant review" dismissible historyMode="route" bodyClassName="min-w-0 space-y-4">
    {children}
  </Drawer>;
}
