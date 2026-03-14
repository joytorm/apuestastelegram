#!/bin/bash
# Push Mac mini metrics to Supabase directly
SUPABASE_URL="https://yujhjyculpqxbgjhvvln.supabase.co"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# CPU
CPU_IDLE=$(top -l 1 -n 0 2>/dev/null | grep "CPU usage" | awk '{for(i=1;i<=NF;i++) if($i ~ /idle/) print $(i-1)}' | tr -d '%')
CPU_PCT=$(echo "100 - ${CPU_IDLE:-100}" | bc 2>/dev/null | awk '{printf "%d", $1}')

# RAM
MEM_FREE=$(memory_pressure 2>/dev/null | tail -1 | grep -o '[0-9]*')
RAM_PCT=$((100 - ${MEM_FREE:-100}))
RAM_USED=$(echo "scale=1; 16 * $RAM_PCT / 100" | bc 2>/dev/null || echo "0")

# Disk
DISK_LINE=$(df -h / | tail -1)
DISK_USED=$(echo "$DISK_LINE" | awk '{print $3}')
DISK_TOTAL=$(echo "$DISK_LINE" | awk '{print $2}')
DISK_PCT=$(echo "$DISK_LINE" | awk '{print $5}' | tr -d '%')

# Uptime + Load
UPTIME_STR=$(uptime | sed 's/.*up //' | sed 's/,.*//')
LOAD_AVG=$(uptime | sed 's/.*averages: //' | sed 's/,//g')

NOW=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -s -X POST "${SUPABASE_URL}/rest/v1/server_metrics" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=minimal" \
  -d "[{
    \"name\": \"Mac mini\",
    \"host\": \"localhost\",
    \"specs\": {\"cores\": 10, \"ramGB\": 16, \"diskGB\": 228, \"os\": \"macOS 26.2 (Tahoe)\"},
    \"metrics\": {\"cpuPercent\": ${CPU_PCT:-0}, \"ramPercent\": ${RAM_PCT:-0}, \"ramUsed\": \"${RAM_USED}GB\", \"ramTotal\": \"16GB\", \"diskPercent\": ${DISK_PCT:-0}, \"diskUsed\": \"${DISK_USED}\", \"diskTotal\": \"${DISK_TOTAL}\", \"uptime\": \"${UPTIME_STR}\", \"loadAvg\": \"${LOAD_AVG}\"},
    \"services\": [{\"name\": \"OpenClaw Gateway\", \"status\": \"running\"}, {\"name\": \"LobsterBoard\", \"status\": \"running\"}],
    \"status\": \"online\",
    \"checked_at\": \"${NOW}\"
  }]"

echo ""
echo "$(date): Mac mini metrics pushed"
