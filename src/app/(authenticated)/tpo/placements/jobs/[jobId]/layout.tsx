import type { ReactNode } from "react";
import { TpoDriveWorkspaceNav } from "@/components/placements/tpo-drive-workspace-nav";

export default async function TpoDriveWorkspaceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return (
    <div className="min-w-0 space-y-4">
      <TpoDriveWorkspaceNav jobId={jobId} />
      {children}
    </div>
  );
}
