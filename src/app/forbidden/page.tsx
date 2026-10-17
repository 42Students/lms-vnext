import { GracefulScreen } from "@/components/public/graceful-screen";

/** GR-14: render a real page instead of a redirect loop. */
export default function ForbiddenPage() {
  return <GracefulScreen title="You do not have access to this page"
    message="If you need access, please contact your administrator."
    homeHref="/dashboard" />;
}
