#!/usr/bin/env bash
set -euo pipefail

# Wrapper used in Nixpacks/Coolify deployments to reuse the production start flow
# while keeping the entrypoint explicit for the buildpack configuration.

echo "🚀 Booting application via Nixpacks start wrapper"
exec ./scripts/start-production.sh
