#!/usr/bin/env bash
# Simple seeder: creates N users via POST /api/users with random US ZIPs.

set -uo pipefail

API_URL="${API_URL:-http://localhost:8080}"
TOTAL="${TOTAL:-1000}"
DELAY_SEC="${DELAY_SEC:-0.5}"  # sleep between requests (seconds).

# Curated list of valid US ZIP codes across states/cities
ZIPS=(
  00501 01001 01742 01970 02108 02139 02446 02840 02903
  03060 03101 03755 03801 04101 04240 04401 05001 05401
  06010 06103 06457 06604 07030 07302 07601 08002 08540
  08852 10001 10003 10011 11201 11354 11501 11743 11901
  19103 19104 20001 20201 21201 21401 22030 22314 23220
  27601 27701 28202 29401 30030 30301 30309 30605 32003
  32202 32801 33101 33301 33602 34236 37203 38017 38103
  40202 41011 43215 44114 45202 45402 46204 46307 46601
  48201 49503 53202 53703 55101 55401 56301 58102 59001
  59715 59801 60007 60601 60827 63101 64108 66211 66441
  68102 68508 70112 70508 72201 73102 74103 75001 75201
  76102 77002 78205 78701 79901 80202 80302 82001 82901
  83646 83702 84047 84111 85004 85281 85701 86001 87102
  87501 88001 89101 90001 90012 90210 90401 91362 92101
  93001 94102 94301 94607 95014 95110 95814 97035 97205
  97401 97702 98004 98101 98402 99501 99701 96701 96813
)

rand_zip() {
  echo "${ZIPS[$RANDOM % ${#ZIPS[@]}]}"
}

success=0
fail=0

echo "Seeding $TOTAL users to $API_URL ..."
for i in $(seq 1 "$TOTAL"); do
  zip="$(rand_zip)"
  name="User $i"

  http_code=$(curl -sS -m 15 -o /tmp/seed-users.out.$$ -w "%{http_code}" \
    -H "Content-Type: application/json" \
    -X POST "$API_URL/api/users" \
    -d "{\"name\":\"$name\",\"zipCode\":\"$zip\"}") || http_code="000"

  if [[ "$http_code" =~ ^20(0|1)$ ]]; then
    success=$((success+1))
    printf "\rCreated: %4d | Failed: %4d" "$success" "$fail"
  else
    fail=$((fail+1))
    printf "\rCreated: %4d | Failed: %4d" "$success" "$fail"
    echo -e "\n[$i] HTTP $http_code for zip $zip => $(cat /tmp/seed-users.out.$$)" >&2
  fi

  # Throttle to avoid OpenWeather API rate limits
  sleep "$DELAY_SEC"
done

rm -f /tmp/seed-users.out.$$ 2>/dev/null || true
echo -e "\nDone."