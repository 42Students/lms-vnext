import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/page-header";

export default function TpoSettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="TPO · Administration"
        title="Placement Settings"
        description="Read-only college placement configuration. Values labelled Persisted come from the database; Source default means no overriding record was found."
      />
      {children}
    </div>
  );
}
