#!/bin/bash
# every 5 min: per-lane last commit age (tag on origin/main OR newest commit on origin/chatgpt/chat-N-b), commits/hour on main, CPU/RAM
cd /c/Users/LENOVO/Desktop/lms-vnext
while true; do
  git fetch -q origin 2>/dev/null
  now=$(date +%s); out=""
  for n in 2 3 4 5 6 7 9 11 12 13 14 15 16; do
    t1=$(git log origin/main --grep="^\[chat-$n\]" -1 --format=%ct 2>/dev/null)
    t2=$(git log "origin/chatgpt/chat-$n-b" -1 --format=%ct 2>/dev/null)
    ts=$t1; if [ -n "$t2" ] && { [ -z "$ts" ] || [ "$t2" -gt "$ts" ]; }; then ts=$t2; fi
    ahead=$(git rev-list --count origin/main.."origin/chatgpt/chat-$n-b" 2>/dev/null || echo 0)
    if [ -z "$ts" ]; then out="$out chat-$n:none"; else age=$(( (now-ts)/60 )); out="$out chat-$n:${age}m(+${ahead})"; fi
  done
  total=$(git log origin/main --since="60 minutes ago" --no-merges --oneline | wc -l)
  sys=$(powershell.exe -NoProfile -Command '$o=Get-CimInstance Win32_OperatingSystem; $c=(Get-CimInstance Win32_PerfFormattedData_PerfOS_Processor | ? { $_.Name -eq "_Total" }).PercentProcessorTime; "{0}% cpu, {1:N1} GB free" -f $c,($o.FreePhysicalMemory/1MB)' 2>/dev/null | tr -d '\r')
  echo "FASTWATCH $(date +%H:%M) main_commits_last_hour=$total | $sys |$out   (+N = commits on the lane's -b branch not yet merged)"
  sleep 300
done
