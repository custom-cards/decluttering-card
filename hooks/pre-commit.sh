#!/usr/bin/env bash

set -euo pipefail

echo "Pre-Commit hooks running..."

npm run update-version
npm run build
git add src/version-const.ts
