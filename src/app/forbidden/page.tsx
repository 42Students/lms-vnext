import type { Metadata } from "next";
import { GracefulScreen } from "@/components/public/graceful-screen";

export const metadata: Metadata = {
  title: "Access denied | 42LMS",
  robots: { index: false, follow: false },
};

/** UX-G051: recovery destinations never grant or bypass missing permissions. */
export default function ForbiddenPage() {
  return <GracefulScreen
    title="You don't have access to this page"
    message="This account or selected workspace doesn't have permission to view this page. Return to your workspace, sign in with another account, or ask your administrator for access."
    homeHref="/dashboard"
    homeLabel="Go to my workspace"
    alternateHref="/login"
    alternateLabel="Sign in with another account"
  />;
}
