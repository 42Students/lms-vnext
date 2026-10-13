#!/usr/bin/env bash
# Adds an exact-host ingress rule that routes a college hostname to vNext.
#
#   scripts/ops/add-college-host.sh testc.development.42lms.com          # dry run
#   APPLY=1 scripts/ops/add-college-host.sh testc.development.42lms.com  # apply
#
# Safety rules (by design):
#   * dry run unless APPLY=1
#   * refuses any namespace whose name contains "prod"
#   * backs the ingress up before changing it (BACKUP_DIR, default $TMPDIR)
#   * only hosts under *.development.42lms.com are accepted by default: DNS and
#     the TLS certificate already cover them. Any other domain needs
#     ALLOW_CUSTOM_DOMAIN=1 and its own DNS + certificate (see
#     docs/operations/tenant-domain-onboarding.md).
#   * idempotent: an existing rule is left alone
#
# After routing, register the same host for the college in the app
# (Domains page or API) so tenant resolution knows it.
set -euo pipefail

HOST="${1:-}"
NAMESPACE="${NAMESPACE:-lms-dev-2026}"
INGRESS="${INGRESS:-lms-dev-2026-ingress}"
SERVICE="${SERVICE:-lms-vnext-service}"
PORT="${PORT:-8080}"
BACKUP_DIR="${BACKUP_DIR:-${TMPDIR:-/tmp}}"
SUFFIX=".development.42lms.com"

fail() { echo "refused: $*" >&2; exit 1; }

[ -n "$HOST" ] || fail "usage: add-college-host.sh <hostname>"
case "$NAMESPACE" in *prod*) fail "namespace '$NAMESPACE' looks like production" ;; esac

HOST="$(printf '%s' "$HOST" | tr 'A-Z' 'a-z')"
printf '%s' "$HOST" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' \
  || fail "'$HOST' is not a valid hostname"

case "$HOST" in
  *"$SUFFIX")
    labels="${HOST%"$SUFFIX"}"
    case "$labels" in
      *.*) fail "'$HOST' is more than one level below $SUFFIX, so the wildcard certificate does not cover it" ;;
      vnext|development|"") fail "'$HOST' is reserved" ;;
    esac
    ;;
  *)
    [ "${ALLOW_CUSTOM_DOMAIN:-}" = "1" ] \
      || fail "'$HOST' is outside *$SUFFIX; set ALLOW_CUSTOM_DOMAIN=1 only after DNS and a certificate exist"
    ;;
esac

if kubectl get ingress "$INGRESS" -n "$NAMESPACE" \
     -o jsonpath='{range .spec.rules[*]}{.host}{"\n"}{end}' | grep -qx "$HOST"; then
  echo "ok: $HOST already routed by $NAMESPACE/$INGRESS (nothing to do)"
  exit 0
fi

PATCH=$(printf '[{"op":"add","path":"/spec/rules/-","value":{"host":"%s","http":{"paths":[{"path":"/","pathType":"Prefix","backend":{"service":{"name":"%s","port":{"number":%s}}}}]}}}]' \
  "$HOST" "$SERVICE" "$PORT")

if [ "${APPLY:-}" != "1" ]; then
  echo "dry run: would add $HOST -> $SERVICE:$PORT on $NAMESPACE/$INGRESS"
  echo "$PATCH"
  echo "re-run with APPLY=1 to apply"
  exit 0
fi

backup="$BACKUP_DIR/ingress-$INGRESS-$(date +%Y%m%dT%H%M%S).yaml"
kubectl get ingress "$INGRESS" -n "$NAMESPACE" -o yaml > "$backup"
echo "backup: $backup"

kubectl patch ingress "$INGRESS" -n "$NAMESPACE" --type=json -p "$PATCH"

echo "waiting for the load balancer (usually 1-3 minutes)..."
for _ in $(seq 1 30); do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "https://$HOST/health" || true)
  if [ "$code" = "200" ]; then
    echo "live: https://$HOST/health -> 200"
    exit 0
  fi
  sleep 10
done

echo "not live yet (last status: ${code:-none}). The rule is applied; check DNS/TLS for $HOST." >&2
echo "to undo: kubectl apply -f $backup" >&2
exit 2
