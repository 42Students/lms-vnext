import type { Metadata } from "next";
import { GracefulScreen } from "@/components/public/graceful-screen";

export const metadata: Metadata = { title: "Offline | 42LMS", robots: { index: false, follow: false } };

/** Stable offline destination for connection-recovery and offline browser flows. */
export default function OfflinePage() {
  return <GracefulScreen title="You're offline"
    message="Check your internet connection and try again when you're connected."
    homeHref="/login" homeLabel="Return to sign in" />;
}
