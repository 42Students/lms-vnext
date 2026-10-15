/** Immediate same-render guard for a final learner assessment submission. */
export function createSubmissionFlightGuard() {
  let inFlight = false;
  return {
    begin(): boolean {
      if (inFlight) return false;
      inFlight = true;
      return true;
    },
    end(): void {
      inFlight = false;
    },
  };
}
