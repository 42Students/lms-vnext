import { featureReady } from "@/config/features";
export function lessonContentOrderRuntimeEnabled() {
  return featureReady("contentOrder");
}
