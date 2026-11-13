import { featureReady } from "@/config/features";
export function courseDisplayRuntimeEnabled() {
  return featureReady("courseDisplay");
}
