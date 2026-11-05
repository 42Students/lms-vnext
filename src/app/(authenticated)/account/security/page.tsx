import { redirect } from "next/navigation";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { DeviceList } from "@/components/auth/device-list";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { describeDevice, deviceTimestampIso } from "@/modules/auth/device-label";
import { listActiveSessions } from "@/modules/auth/session-service";
import { ButtonLink } from "@/components/ui/button-link";
import { TextLink } from "@/components/ui/text-link";

export default async function AccountSecurityPage() {
  let session: Awaited<ReturnType<typeof getCurrentDeviceSession>>;
  try {
    session = await getCurrentDeviceSession();
  } catch {
    // Dev/test identities have no device session; real sign-in does.
    redirect("/dashboard");
  }

  const rows = await listActiveSessions(session.userId).catch(() => null);

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Signed-in devices"
        description="Every place you're signed in. Sign out any device you don't recognise."
      />
      {rows === null ? (
        <ErrorState description="Your current session could not be listed."
          action={<ButtonLink variant="secondary" href="/account/security"
            className="min-w-0 w-full md:w-auto">Try again</ButtonLink>}/>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No active devices"
          description="Your current session could not be listed."
          action={<TextLink href="/account/security" className="inline-flex min-h-11 items-center md:min-h-9 w-full md:w-auto justify-center rounded-[var(--lms-control-radius)] px-4">Try again</TextLink>}
        />
      ) : (
        <DeviceList
          devices={rows.map((row) => ({
            id: String(row["id"]),
            label:
              (row["device_name"] as string | null) ??
              describeDevice(row["user_agent"] as string | null),
            createdAt: deviceTimestampIso(row["created_at"]),
            lastSeenAt: deviceTimestampIso(row["last_seen_at"]),
            current: row["id"] === session.sessionId,
          }))}
        />
      )}
    </div>
  );
}
