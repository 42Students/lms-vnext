import { GracefulScreen } from "@/components/public/graceful-screen";

/** GR-13: friendly missing or deleted records in this role. */
export default function NotFound() {
  return <GracefulScreen title="Page not found"
    message="This page may have moved or is no longer available. Please return home."
    homeHref="/teach" />;
}
