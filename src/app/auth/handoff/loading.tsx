import { PublicPageLoading } from "@/components/public/public-page-loading";

/** Branded public loading with a bounded reload action on slow requests. */
export default function Loading() {
  return <PublicPageLoading label="Returning to sign in..." />;
}
