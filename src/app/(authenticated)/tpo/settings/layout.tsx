import {TPO_OWNER_PAGE_COPY} from "@/modules/placements/tpo-page-copy";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
export default function TpoSettingsLayout({children}:{children:ReactNode}){
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="TPO · Administration" title={TPO_OWNER_PAGE_COPY.settings}
   description="How your placement cell runs: its rules, its people, and what students and companies get."/>
  {children}
 </div>;
}
