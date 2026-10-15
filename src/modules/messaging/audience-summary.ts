import type { OutboundDecision } from "./model";
export function summarizeAudience(decisions: readonly OutboundDecision[]) {
  const reasons: Partial<Record<Extract<OutboundDecision,{status:"SUPPRESSED"}>["reason"],number>> = {};
  let eligible = 0;
  for (const decision of decisions) {
    if (decision.status === "QUEUED") eligible++;
    else reasons[decision.reason] = (reasons[decision.reason] ?? 0) + 1;
  }
  return {total:decisions.length,eligible,suppressed:decisions.length-eligible,reasons};
}
