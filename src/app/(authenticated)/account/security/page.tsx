import { redirect } from "next/navigation";
import { getCurrentDeviceSession } from "@/auth/current-session";
import { DeviceList } from "@/components/auth/device-list";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/ui/page-header";
import { describeDevice, deviceTimestampIso } from "@/modules/auth/device-label";
import { listActiveSessions } from "@/modules/auth/session-service";

export default async function AccountSecurityPage() {
  let session: Awaited<ReturnType<typeof getCurrentDeviceSession>>;
  try {
    session = await getCurrentDeviceSession();
  } catch {
    // Dev/test identities have no device session; real sign-in does.
    redirect("/dashboard");
  }

  const rows = await listActiveSessions(session.userId).catch(() => null);

  // A native GET always fetches fresh session data, even when the Next Router
  // already holds the current /account/security route in its client cache.
  const reload = (
    <form method="get" action="/account/security">
      <Button type="submit" variant="secondary" className="min-h-11 w-full sm:w-auto md:min-h-9">
        Refresh device list
      </Button>
    </form>
  );

  return (
    <div className="min-w-0 max-w-full space-y-4 md:space-y-6">
      <PageHeader
        title="Signed-in devices"
        description="Review your active sign-ins and sign out any device you don't recognise."
      />
      {rows === null ? (
        <ErrorState
          title="Unable to load signed-in devices"
          description="We couldn't check your device sessions right now. Your current session has not been signed out. Refresh the list to try again."
          action={reload}
        />
      ) : rows.length === 0 ? (
        <ErrorState
          title="No active sessions returned"
          description="You're signed in, but the device list did not return any sessions. Refresh the list. If this keeps happening, contact support before making changes to your account."
          action={reload}
        />
      ) : (
        <>
          <p role="note" className="max-w-3xl min-w-0 break-words text-sm leading-6 text-muted-foreground">
            Only this account's active sign-ins are shown. Signing out another device ends its session; this device stays signed in unless you choose to sign out here.
          </p>
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
        </>
      )}
    </div>
  );
}
