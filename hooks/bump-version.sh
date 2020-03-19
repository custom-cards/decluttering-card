#!/usr/bin/env bash

set -euo pipefail

VERSION=$(jq -r .version package.json)

cat <<EOF >src/version-const.ts
export const CARD_VERSION = '${VERSION}';
EOF
