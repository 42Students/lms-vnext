export function lessonContentOrderRuntimeEnabled() {
  return (
    process.env.DB05_CONTENT_ORDER_READY ===
    "DB05_VERIFIED"
  );
}
