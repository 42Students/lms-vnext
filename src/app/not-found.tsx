import { GracefulScreen } from "@/components/public/graceful-screen";

export default function NotFound() {
  return <GracefulScreen title="Page not found"
    message="This page may have moved or is no longer available. Please return home."
    homeHref="/" />;
}
