#!/usr/bin/env bash
# Orchestrator runs after rollout. READY_URL must reach /ready.
set -euo pipefail
NAMESPACE="${NAMESPACE:-lms-dev-2026}"
DEPLOYMENT="${DEPLOYMENT:-lms-vnext}"
READY_URL="${READY_URL:?Set READY_URL}"
notify() {
  [ -n "${TELEGRAM_ALERT_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_ALERT_CHAT_ID:-}" ] || return 0
  local message="$1"
  [ "${APP_ENV:-development}" = production ] || message="[vnext dev] $message"
  curl -fsS --max-time 5 -o /dev/null \
    --data-urlencode "chat_id=$TELEGRAM_ALERT_CHAT_ID" \
    --data-urlencode "text=$message" \
    "https://api.telegram.org/bot$TELEGRAM_ALERT_BOT_TOKEN/sendMessage" >/dev/null 2>&1 || true
}
if ! kubectl -n "$NAMESPACE" rollout status "deployment/$DEPLOYMENT" --timeout=180s; then
  notify "vNext deploy health failed: rollout did not complete"
  exit 1
fi
ready="$(kubectl -n "$NAMESPACE" get deployment "$DEPLOYMENT" -o jsonpath='{.status.readyReplicas}')"
restart_counts="$(kubectl -n "$NAMESPACE" get pods -l "app=$DEPLOYMENT" -o jsonpath='{range .items[*]}{range .status.containerStatuses[*]}{.restartCount}{"\n"}{end}{end}')"
restarts="$(printf '%s\n' "$restart_counts" | awk '{sum += $1} END {print sum+0}')"
if [ "${ready:-0}" -lt 1 ] || [ "$restarts" -gt 0 ] ||
   ! curl -fsS --max-time 10 -o /dev/null "$READY_URL"; then
  notify "vNext deploy health failed: not ready or restarted"
  exit 1
fi
notify "vNext deploy healthy: $ready ready replicas, 0 restarts, /ready passed"
printf 'Deploy healthy: %s ready replicas, %s restarts\n' "$ready" "$restarts"
