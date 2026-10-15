import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";
export default function TpoSettingsLayout({children}:{children:ReactNode}){
 return <div className="min-w-0 space-y-6">
  <PageHeader eyebrow="TPO · Administration" title="Placement Settings"
   description="Manage placement policy, people and company preferences. New settings remain read-only until their proposed migrations are registered."/>
  {children}
 </div>;
}
