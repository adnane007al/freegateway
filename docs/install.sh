#!/usr/bin/env bash
# The FreeGateway installer moved to https://freegateway.co/install.sh
# This shim keeps old `curl ... github.io ... | bash` one-liners working.
set -euo pipefail
exec bash -c "$(curl -fsSL https://freegateway.co/install.sh)"
