import { env } from "@/config/env";
export function lessonContentOrderRuntimeEnabled() {
  return (
    env.DB05_CONTENT_ORDER_READY ===
    "DB05_VERIFIED"
  );
}
