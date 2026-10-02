export type HealthPayload = {
  status: "ok";
  service: "lms-vnext";
  timestamp: string;
};

export function getHealthPayload(now = new Date()): HealthPayload {
  return {
    status: "ok",
    service: "lms-vnext",
    timestamp: now.toISOString(),
  };
}
