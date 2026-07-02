#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/game/s23 - Audio & fixes/code"
source "$ROOT/.venv/bin/activate"
python main.py
