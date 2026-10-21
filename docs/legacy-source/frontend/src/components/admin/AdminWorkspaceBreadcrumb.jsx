import Link from "next/link";
import { Typography } from "antd";

/** Lightweight, explicit context for deep links into either administrator's workspace. */
export default function AdminWorkspaceBreadcrumb({ basePath, workspaceId, workspaceName, activeSection }) {
  const name = String(workspaceName || "Workspace").trim();
  return (
    <nav aria-label="Workspace location" style={{ marginBottom: 14 }}>
      <ol style={{ listStyle: "none", display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", padding: 0, margin: 0 }}>
        <li><Link href={`${basePath}/projects/workspaces`}>Projects / Workspaces</Link></li>
        <li aria-hidden="true">›</li>
        <li><Link href={`${basePath}/projects/workspaces/${encodeURIComponent(String(workspaceId))}/summary`}>{name}</Link></li>
        {activeSection && <><li aria-hidden="true">›</li><li aria-current="page"><Typography.Text strong>{activeSection}</Typography.Text></li></>}
      </ol>
    </nav>
  );
}
