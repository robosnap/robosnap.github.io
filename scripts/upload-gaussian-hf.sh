#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "Usage: scripts/upload-gaussian-hf.sh <hf-user-or-org>/robosnap-assets" >&2
  echo "Example: scripts/upload-gaussian-hf.sh hishujie/robosnap-assets" >&2
  exit 2
fi

if ! command -v hf >/dev/null 2>&1; then
  echo "Hugging Face CLI 'hf' is not installed." >&2
  echo "Install it with: curl -LsSf https://hf.co/cli/install.sh | bash" >&2
  exit 127
fi

repo_id="$1"
script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
web_dir="$(cd "${script_dir}/.." && pwd)"

cd "$web_dir"

HF_XET_HIGH_PERFORMANCE="${HF_XET_HIGH_PERFORMANCE:-1}" \
  hf upload "$repo_id" static/robosnap/gaussian gaussian \
    --repo-type=dataset \
    --commit-message "Upload RoboSnap Gaussian splats"

echo
echo "Gaussian base URL:"
echo "https://huggingface.co/datasets/${repo_id}/resolve/main/gaussian"

