#!/usr/bin/env bash
set -euo pipefail

if command -v docker >/dev/null 2>&1; then
  docker compose up -d
  exit 0
fi

export PATH="/usr/local/opt/postgresql@16/bin:/opt/homebrew/opt/postgresql@16/bin:${PATH}"

if ! command -v pg_isready >/dev/null 2>&1; then
  echo "Docker is not installed, and PostgreSQL was not found."
  echo "Install Docker Desktop, or: brew install postgresql@16 && brew services start postgresql@16"
  exit 1
fi

if ! pg_isready -q; then
  if command -v brew >/dev/null 2>&1; then
    brew services start postgresql@16
    sleep 2
  else
    echo "PostgreSQL is installed but not running. Start it, then retry."
    exit 1
  fi
fi

pg_isready
echo "PostgreSQL is accepting connections on localhost:5432"
