import { GracefulScreen } from "@/components/public/graceful-screen";

export default function NotFound() {
  return <GracefulScreen title="Page not found"
    message="The page you are looking for doesn't exist, moved, or is no longer available."
    homeHref="/" />;
}
