import type { Metadata } from "next";
import { OfflineRecovery } from "./offline-recovery";

export const metadata: Metadata = {
  title: "Offline | 42LMS",
  robots: { index: false, follow: false },
};

/** Public recovery destination; all navigation remains same-origin and role-aware. */
export default function OfflinePage() {
  return <OfflineRecovery />;
}
