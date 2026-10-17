#!/usr/bin/env bash
# Emits one line per event: lane idle (no push for IDLE_MIN minutes), branch ready to merge, and a periodic TICK.
# Used with the Monitor tool so the orchestrator is woken by events instead of timers.
cd "$(dirname "$0")/../.." || exit 1
IDLE_MIN=${IDLE_MIN:-12}
LANES=${LANES:-"2 3 4 5 6 7 9 10 11"}
declare -A told
n=0
while true; do
  git fetch -q origin 'refs/heads/chatgpt/*:refs/remotes/origin/chatgpt/*' 2>/dev/null || true
  git fetch -q origin main 2>/dev/null || true
  now=$(date +%s)
  for l in $LANES; do
    ts=$(git log -1 --format=%ct "origin/chatgpt/chat-$l" 2>/dev/null) || continue
    ahead=$(git rev-list --count "origin/main..origin/chatgpt/chat-$l" 2>/dev/null || echo 0)
    age=$(( (now - ts) / 60 ))
    if [ "$age" -ge "$IDLE_MIN" ]; then
      if [ "${told[$l]}" != "$ts" ]; then
        told[$l]=$ts
        echo "LANE-IDLE chat-$l quiet ${age}m ahead=$ahead (re-task it; merge if ahead>0)"
      fi
    fi
  done
  n=$((n+1))
  if [ $((n % 10)) -eq 0 ]; then echo "TICK $(date +%H:%M) (10-min heartbeat: merge ready branches, check agents)"; fi
  sleep 60
done
