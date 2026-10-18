import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** Scoped offer loading: stable card geometry, reduced motion and a slow-network recovery. */
export default function Loading(){
 return <GracefulPageLoading label="Loading offer register"/>;
}
