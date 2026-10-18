import type { Metadata } from "next";
import { GracefulScreen } from "@/components/public/graceful-screen";

export const metadata: Metadata = { title: "You do not have access to this page | 42LMS", robots: { index: false, follow: false } };

/** GR-14: render a real page instead of a redirect loop. */
export default function ForbiddenPage() {
  return <GracefulScreen title="You do not have access to this page"
    message="If you need access, please contact your administrator."
    homeHref="/dashboard" />;
}
