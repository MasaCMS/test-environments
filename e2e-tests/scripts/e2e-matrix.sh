#!/usr/bin/env bash
#
# Run the Playwright smoke tests against fresh engine/DB combinations.
#
# Usage:
#   e2e-tests/e2e-tests/scripts/e2e-matrix.sh             # reduced set (one DB per engine)
#   FULL=1 e2e-tests/scripts/e2e-matrix.sh                # all engines x all databases
#   ENGINE=lucee DB=mysql e2e-tests/scripts/e2e-matrix.sh # a single combination
#   ENGINE=adobe DB=mysql CF_VERSION=cf25 e2e-tests/scripts/e2e-matrix.sh
#
# Each combination runs in its own docker compose project (masae2e-<engine>-<db>),
# so teardown (down -v) only removes the containers and volumes of that run and
# never touches a regular dev environment. Host ports are still shared with the
# dev environment, so the script refuses to start if a required port is in use.
#
# Environment:
#   ENGINE, DB      limit the run (comma separated lists allowed)
#   FULL=1          run the full matrix
#   CF_VERSION      Adobe ColdFusion version (default: cf23)
#   TIMEOUT         seconds to wait for Masa to answer (default: 600)
#   KEEP=1          do not tear down after the run (for debugging)

set -u
ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
E2E_DIR="$ROOT_DIR/e2e-tests"
cd "$ROOT_DIR"   # make and docker compose run from the repo root

if [ ! -d "$E2E_DIR/node_modules" ]; then
  echo "Dependencies missing. Run: (cd e2e-tests && npm install && npx playwright install chromium)" >&2
  exit 2
fi

ENGINES_ALL="lucee boxlang adobe"
DBS_ALL="mysql mariadb postgres mssql"
TIMEOUT="${TIMEOUT:-600}"
CF_VERSION="${CF_VERSION:-cf23}"

engines="${ENGINE:-$ENGINES_ALL}"; engines="${engines//,/ }"
if [ -n "${DB:-}" ]; then
  dbs="${DB//,/ }"
elif [ "${FULL:-0}" = "1" ]; then
  dbs="$DBS_ALL"
else
  dbs="" # reduced: one DB per engine, see pick_dbs
fi

# Reduced matrix: spread the databases over the engines.
pick_dbs() {
  case "$1" in
    lucee) echo "mysql" ;;
    boxlang) echo "postgres" ;;
    adobe) echo "mssql" ;;
  esac
}

# Host port of the engine, read from its compose file so it never drifts.
engine_port() {
  grep -Eo '"[0-9]+:[0-9]+"' "$1/$2/docker-compose.yml" | head -1 | tr -d '"' | cut -d: -f1
}

db_port() {
  case "$1" in mysql) echo 3306 ;; mariadb) echo 3307 ;; postgres) echo 5432 ;; mssql) echo 1434 ;; esac
}

port_in_use() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

teardown() {
  local engine="$1" db="$2" project="masae2e-$1-$2"
  ( cd "$engine/$db" && COMPOSE_PROJECT_NAME="$project" docker compose down -v --remove-orphans >/dev/null 2>&1 )
  ( cd "$db" && COMPOSE_PROJECT_NAME="$project" docker compose down -v --remove-orphans >/dev/null 2>&1 )
}

wait_for_masa() {
  local url="$1" waited=0 code
  while [ "$waited" -lt "$TIMEOUT" ]; do
    code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' -L "$url/" || true)
    # Masa answers 200 once installed; 5xx/000 while the engine/installer boots.
    if [ "$code" = "200" ]; then return 0; fi
    sleep 5; waited=$((waited + 5))
  done
  return 1
}

declare -a results
failures=0

run_combo() {
  local engine="$1" db="$2"
  local project="masae2e-$engine-$db" port start=$SECONDS status="PASS" detail=""

  port=$(engine_port "$engine" "$db")
  echo
  echo "=== $engine + $db (project $project, port $port) ==="

  for p in "$port" "$(db_port "$db")"; do
    if port_in_use "$p"; then
      results+=("$engine|$db|SKIP|port $p already in use (stop your dev environment)")
      failures=$((failures + 1)); return
    fi
  done

  export COMPOSE_PROJECT_NAME="$project"
  if ! make "$engine-$db" CF_VERSION="$CF_VERSION"; then
    status="FAIL"; detail="start failed"
  elif ! wait_for_masa "http://localhost:$port"; then
    status="FAIL"; detail="Masa did not answer within ${TIMEOUT}s"
  else
    # PROJECT: smoke (default), features, or both (comma separated).
    project_args=()
    for pr in $(echo "${PROJECT:-smoke}" | tr ',' ' '); do project_args+=(--project "$pr"); done
    if ! ( cd "$E2E_DIR" && npx bddgen && \
           BASE_URL="http://localhost:$port" \
           PLAYWRIGHT_HTML_REPORT="playwright-report/$engine-$db" \
           npx playwright test "${project_args[@]}" --output "test-results/$engine-$db" ); then
      status="FAIL"; detail="see e2e-tests/playwright-report/$engine-$db"
    fi
  fi

  if [ "$status" = "FAIL" ]; then
    ( cd "$engine/$db" && docker compose logs --tail 40 2>/dev/null ) > "$E2E_DIR/test-results/$engine-$db.log" 2>&1 || true
    failures=$((failures + 1))
  fi
  [ "${KEEP:-0}" = "1" ] || teardown "$engine" "$db"
  unset COMPOSE_PROJECT_NAME
  results+=("$engine|$db|$status|$detail ($((SECONDS - start))s)")
}

mkdir -p "$E2E_DIR/test-results"
for engine in $engines; do
  list="$dbs"; [ -n "$list" ] || list="$(pick_dbs "$engine")"
  for db in $list; do
    if [ ! -d "$engine/$db" ]; then
      results+=("$engine|$db|SKIP|no such environment"); continue
    fi
    run_combo "$engine" "$db"
  done
done

echo
echo "================ E2E summary ================"
printf '%-9s %-9s %-6s %s\n' ENGINE DB RESULT DETAIL
for r in "${results[@]}"; do
  IFS='|' read -r e d s x <<<"$r"
  printf '%-9s %-9s %-6s %s\n' "$e" "$d" "$s" "$x"
done
[ "$failures" -eq 0 ]
