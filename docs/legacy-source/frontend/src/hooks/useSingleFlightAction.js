import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared mutation lifecycle for actions that must never overlap.
 *
 * Contract:
 * idle -> pending -> success | error
 * - request ownership is acquired synchronously via a ref before React can re-render
 * - duplicate calls while pending are rejected without invoking the action again
 * - the last accepted action is retained for explicit Retry
 * - failures never auto-reset; the initiating UI decides when to dismiss/reset
 */
export function useSingleFlightAction() {
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);
  const lastActionRef = useRef(null);
  const [state, setState] = useState({
    status: "idle",
    error: null,
    value: undefined,
  });

  useEffect(() => () => {
    mountedRef.current = false;
  }, []);

  const run = useCallback(async (action) => {
    if (typeof action !== "function") {
      throw new TypeError("useSingleFlightAction.run expects a function");
    }
    if (inFlightRef.current) {
      return { accepted: false, ok: false, reason: "pending" };
    }

    inFlightRef.current = true;
    lastActionRef.current = action;
    if (mountedRef.current) {
      setState({ status: "pending", error: null, value: undefined });
    }

    try {
      const value = await action();
      if (mountedRef.current) {
        setState({ status: "success", error: null, value });
      }
      return { accepted: true, ok: true, value };
    } catch (error) {
      if (mountedRef.current) {
        setState({ status: "error", error, value: undefined });
      }
      return { accepted: true, ok: false, error };
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  const retry = useCallback(() => {
    if (!lastActionRef.current) {
      return Promise.resolve({ accepted: false, ok: false, reason: "no-action" });
    }
    return run(lastActionRef.current);
  }, [run]);

  const reset = useCallback(() => {
    if (inFlightRef.current) return false;
    lastActionRef.current = null;
    if (mountedRef.current) {
      setState({ status: "idle", error: null, value: undefined });
    }
    return true;
  }, []);

  return {
    ...state,
    pending: state.status === "pending",
    canRetry: state.status === "error" && lastActionRef.current != null,
    run,
    retry,
    reset,
  };
}

export default useSingleFlightAction;
