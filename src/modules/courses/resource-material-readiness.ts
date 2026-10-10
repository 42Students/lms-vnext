export function resourceMaterialsRuntimeEnabled() {
  return process.env.DB05_RESOURCE_MATERIALS_READY === "DB05_VERIFIED";
}
