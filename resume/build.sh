#!/usr/bin/env bash
# Compile the résumé from LaTeX with Tectonic (lightweight, self-contained engine).
#
#   brew install tectonic     # one-time
#   ./build.sh                # -> Gordon-Gouger-Resume.pdf
#
set -euo pipefail
cd "$(dirname "$0")"
tectonic resume.tex
cp resume.pdf Gordon-Gouger-Resume.pdf
echo "→ Gordon-Gouger-Resume.pdf"
