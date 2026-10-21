#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ "${1:-}" = "--check" ]; then exec node scripts/corpus.mjs check; fi
exec node scripts/corpus.mjs generate
