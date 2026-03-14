#!/bin/bash
# Collects metrics from Mac mini + Hetzner and pushes to panel API
# Run via cron every 2 minutes

API_URL="https://panel.entrelanzados.es/api/servers/status"
AUTH_TOKEN="${SUPABASE_SERVICE_ROLE_KEY}"

# --- Mac mini ---
CPU_IDLE=$(top -l 1 -n 0 2>/dev/null | grep "CPU usage" | awk '{for(i=1;i<=NF;i++) if($i ~ /idle/) print $(i-1)}' | tr -d '%')
CPU_PCT=$(echo "100 - ${CPU_IDLE:-100}" | bc 2>/dev/null | awk '{printf "%d", $1}')
MEM_FREE=$(memory_pressure 2>/dev/null | tail -1 | grep -o '[0-9]*')
RAM_PCT=$((100 - ${MEM_FREE:-100}))
DISK_LINE=$(df -h / | tail -1)
DISK_USED=$(echo "$DISK_LINE" | awk '{print $3}')
DISK_TOTAL=$(echo "$DISK_LINE" | awk '{print $2}')
DISK_PCT=$(echo "$DISK_LINE" | awk '{print $5}' | tr -d '%')
UPTIME_STR=$(uptime | sed 's/.*up //' | sed 's/,.*//')
LOAD_AVG=$(uptime | sed 's/.*averages: //' | sed 's/,//g')

MAC_JSON=$(cat <<EOF
{
  "name": "Mac mini",
  "host": "localhost",
  "specs": {"cores": 10, "ramGB": 16, "diskGB": 228, "os": "macOS 26.2 (Tahoe)"},
  "metrics": {
    "cpuPercent": ${CPU_PCT:-0},
    "ramPercent": ${RAM_PCT:-0},
    "ramUsed": "$(echo "scale=1; 16 * $RAM_PCT / 100" | bc 2>/dev/null || echo 0)GB",
    "ramTotal": "16GB",
    "diskPercent": ${DISK_PCT:-0},
    "diskUsed": "${DISK_USED:-?}",
    "diskTotal": "${DISK_TOTAL:-228Gi}",
    "uptime": "${UPTIME_STR:-unknown}",
    "loadAvg": "${LOAD_AVG:-0 0 0}"
  },
  "services": [
    {"name": "OpenClaw Gateway", "status": "running"},
    {"name": "LobsterBoard", "status": "running"}
  ],
  "status": "online"
}
EOF
)

# --- Hetzner ---
SSH_CMD="ssh -i /Users/mariscal/.ssh/hetzner_gloria -o ConnectTimeout=5 -o StrictHostKeyChecking=no root@46.224.85.85"
HETZNER_RAW=$($SSH_CMD '
echo "CPU:$(top -bn1 | grep "Cpu(s)" | awk "{print \$2}")"
echo "RAM:$(free -h | grep Mem | awk "{print \$3,\$2}")"
echo "RAMPCT:$(free | grep Mem | awk "{printf \"%.0f\", \$3/\$2*100}")"
echo "DISK:$(df -h / | tail -1 | awk "{print \$3,\$2,\$5}")"
echo "UP:$(uptime -p)"
echo "LOAD:$(cat /proc/loadavg | awk "{print \$1,\$2,\$3}")"
echo "DOCKER:$(docker ps --format "{{.Names}}|{{.Status}}" 2>/dev/null | tr "\n" ";")"
' 2>/dev/null)

if [ -n "$HETZNER_RAW" ]; then
  H_CPU=$(echo "$HETZNER_RAW" | grep "^CPU:" | cut -d: -f2)
  H_RAM_PARTS=$(echo "$HETZNER_RAW" | grep "^RAM:" | cut -d: -f2)
  H_RAM_USED=$(echo "$H_RAM_PARTS" | awk '{print $1}')
  H_RAM_TOTAL=$(echo "$H_RAM_PARTS" | awk '{print $2}')
  H_RAMPCT=$(echo "$HETZNER_RAW" | grep "^RAMPCT:" | cut -d: -f2)
  H_DISK_LINE=$(echo "$HETZNER_RAW" | grep "^DISK:" | cut -d: -f2)
  H_DISK_USED=$(echo "$H_DISK_LINE" | awk '{print $1}')
  H_DISK_TOTAL=$(echo "$H_DISK_LINE" | awk '{print $2}')
  H_DISK_PCT=$(echo "$H_DISK_LINE" | awk '{print $3}' | tr -d '%')
  H_UP=$(echo "$HETZNER_RAW" | grep "^UP:" | cut -d: -f2- | sed 's/up //')
  H_LOAD=$(echo "$HETZNER_RAW" | grep "^LOAD:" | cut -d: -f2)
  H_DOCKER_RAW=$(echo "$HETZNER_RAW" | grep "^DOCKER:" | cut -d: -f2-)

  # Build docker services JSON array
  SERVICES="["
  FIRST=true
  IFS=';' read -ra CONTAINERS <<< "$H_DOCKER_RAW"
  for c in "${CONTAINERS[@]}"; do
    [ -z "$c" ] && continue
    CNAME=$(echo "$c" | cut -d'|' -f1)
    CSTATUS=$(echo "$c" | cut -d'|' -f2)
    [ "$FIRST" = true ] && FIRST=false || SERVICES+=","
    SERVICES+="{\"name\":\"$CNAME\",\"status\":\"$CSTATUS\"}"
  done
  SERVICES+="]"

  HETZNER_JSON=$(cat <<EOF
{
  "name": "Hetzner VPS",
  "host": "46.224.85.85",
  "specs": {"cores": 16, "ramGB": 30, "diskGB": 601, "os": "Ubuntu 22.04"},
  "metrics": {
    "cpuPercent": ${H_CPU:-0},
    "ramPercent": ${H_RAMPCT:-0},
    "ramUsed": "${H_RAM_USED:-?}",
    "ramTotal": "${H_RAM_TOTAL:-30Gi}",
    "diskPercent": ${H_DISK_PCT:-0},
    "diskUsed": "${H_DISK_USED:-?}",
    "diskTotal": "${H_DISK_TOTAL:-601G}",
    "uptime": "${H_UP:-unknown}",
    "loadAvg": "${H_LOAD:-0 0 0}"
  },
  "services": $SERVICES,
  "status": "online"
}
EOF
)
else
  HETZNER_JSON='{"name":"Hetzner VPS","host":"46.224.85.85","specs":{"cores":16,"ramGB":30,"diskGB":601,"os":"Ubuntu 22.04"},"metrics":{"cpuPercent":0,"ramPercent":0,"ramUsed":"?","ramTotal":"30GB","diskPercent":0,"diskUsed":"?","diskTotal":"601GB","uptime":"?","loadAvg":"0 0 0"},"services":[],"status":"offline"}'
fi

# Push to API
PAYLOAD="{\"servers\":[$MAC_JSON,$HETZNER_JSON]}"
curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d "$PAYLOAD" > /dev/null 2>&1

echo "$(date): Pushed metrics OK"
