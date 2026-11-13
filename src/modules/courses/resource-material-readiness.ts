import { featureReady } from "@/config/features";
export function resourceMaterialsRuntimeEnabled() {
  return featureReady("resourceMaterials");
}
