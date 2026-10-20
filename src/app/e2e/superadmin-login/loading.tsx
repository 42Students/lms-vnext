import { PublicPageLoading } from "@/components/public/public-page-loading";

/** GR-19: loading is bounded by a visible recovery action. */
export default function Loading() {
  return <PublicPageLoading label="Loading sign in..." />;
}
