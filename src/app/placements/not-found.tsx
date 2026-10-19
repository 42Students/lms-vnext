import { GracefulScreen } from "@/components/public/graceful-screen";

/** Public placement links use the branded missing-page treatment. */
export default function PublicPlacementNotFound() {
  return <GracefulScreen title="This page isn't available"
    message="The placement cell hasn't published a placements page here."
    homeHref="/home" homeLabel="Go to home" />;
}
