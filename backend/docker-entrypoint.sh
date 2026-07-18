#!/bin/sh
set -eu

if [ -z "${SPRING_DATASOURCE_URL:-}" ] && [ -n "${DATABASE_URL:-}" ]; then
  database_url_without_scheme="${DATABASE_URL#postgresql://}"
  database_credentials="${database_url_without_scheme%@*}"
  database_host_and_name="${database_url_without_scheme#*@}"

  database_username="${database_credentials%%:*}"
  database_password="${database_credentials#*:}"
  database_host_port="${database_host_and_name%%/*}"
  database_name="${database_host_and_name#*/}"

  case "$database_host_port" in
    *:*) jdbc_host_port="$database_host_port" ;;
    *) jdbc_host_port="$database_host_port:5432" ;;
  esac

  export SPRING_DATASOURCE_URL="jdbc:postgresql://${jdbc_host_port}/${database_name}"
  export SPRING_DATASOURCE_USERNAME="${SPRING_DATASOURCE_USERNAME:-$database_username}"
  export SPRING_DATASOURCE_PASSWORD="${SPRING_DATASOURCE_PASSWORD:-$database_password}"
fi

case ",${SPRING_PROFILES_ACTIVE:-}," in
  *,prod,*)
    if [ -z "${SPRING_DATASOURCE_URL:-}" ] || [ -z "${SPRING_DATASOURCE_USERNAME:-}" ] || [ -z "${SPRING_DATASOURCE_PASSWORD:-}" ]; then
      echo "Production startup requires PostgreSQL datasource URL, username, and password." >&2
      exit 1
    fi
    ;;
esac

exec java -jar app.jar
