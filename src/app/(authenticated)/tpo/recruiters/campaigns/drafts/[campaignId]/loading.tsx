import { GracefulPageLoading } from "@/components/ui/graceful-page-loading";

/** The route retains its own accessible loading identity and bounded retry. */
export default function Loading(){
 return <GracefulPageLoading label="Loading campaign draft"/>;
}
