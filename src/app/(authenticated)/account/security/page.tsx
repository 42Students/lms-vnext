import { redirect } from "next/navigation";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { DeviceList } from "@/components/auth/device-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { describeDevice } from "@/modules/auth/device-label";
import { listActiveSessions } from "@/modules/auth/session-service";

export default async function AccountSecurityPage() {
  let session: Awaited<ReturnType<typeof getCurrentDeviceSession>>;
  try {
    session = await getCurrentDeviceSession();
  } catch {
    // Dev/test identities have no device session; real sign-in does.
    redirect("/dashboard");
  }

  const rows = await listActiveSessions(session.userId);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Signed-in devices"
        description="Every place you're signed in. Sign out any device you don't recognise."
      />
      {rows.length === 0 ? (
        <EmptyState
          title="No active devices"
          description="Your current session could not be listed."
        />
      ) : (
        <DeviceList
          devices={rows.map((row) => ({
            id: String(row.id),
            label:
              (row.device_name as string | null) ??
              describeDevice(row.user_agent as string | null),
            createdAt: new Date(row.created_at as string).toISOString(),
            lastSeenAt: new Date(row.last_seen_at as string).toISOString(),
            current: row.id === session.sessionId,
          }))}
        />
      )}
    </div>
  );
}
