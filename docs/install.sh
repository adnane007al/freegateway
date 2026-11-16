#!/usr/bin/env bash
# FreeGateway installer.
#
# Clones the repository, creates a .env with a fresh encryption key, and
# starts the Docker stack. Re-running it is safe: an existing .env and
# encryption key are preserved, and the database lives in a named volume.
set -euo pipefail

REPO_URL="https://github.com/adnane007al/freegateway.git"
INSTALL_DIR="${FREEGATEWAY_HOME:-$HOME/freegateway}"
COMPOSE="docker compose"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is required. Install Docker Desktop or Docker Engine, then re-run this script." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "This script needs the 'docker compose' plugin (Docker Compose v2)." >&2
  exit 1
fi

if [[ -d "$INSTALL_DIR/.git" ]]; then
  echo "Updating $INSTALL_DIR ..."
  git -C "$INSTALL_DIR" pull --ff-only
else
  echo "Cloning into $INSTALL_DIR ..."
  git clone "$REPO_URL" "$INSTALL_DIR"
fi

cd "$INSTALL_DIR"

if [[ ! -f .env ]]; then
  echo "Creating .env with a new encryption key ..."
  umask 077
  {
    echo "ENCRYPTION_KEY=$(node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))")"
    echo "PORT=3001"
  } > .env
  echo "Created .env."
else
  echo ".env already exists; leaving it unchanged."
fi

echo "Starting FreeGateway ..."
$COMPOSE up -d --build

cat <<'EOF'

FreeGateway is starting. When it is up:

  Dashboard     http://localhost:3001
  API           http://localhost:3001/v1

Add your provider keys on the Keys page, then copy the unified API key from
the same page's header.

Stop it with:  docker compose down
Logs:          docker compose logs -f
EOF
