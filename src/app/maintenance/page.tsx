import type { Metadata } from "next";
import { GracefulScreen } from "@/components/public/graceful-screen";

export const metadata: Metadata = { title: "Maintenance | 42LMS", robots: { index: false, follow: false } };

/** Display-only public recovery URL; maintenance routing is handled independently. */
export default function MaintenancePage() {
  return <GracefulScreen title="We'll be back shortly"
    message="42LMS is undergoing scheduled maintenance. Please try again in a little while."
    homeHref="/login" homeLabel="Return to sign in" />;
}
