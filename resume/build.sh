#!/usr/bin/env bash
# Compile the résumé from LaTeX with Tectonic (lightweight, self-contained engine).
#
#   brew install tectonic     # one-time
#   ./build.sh                # -> Gordon-Gouger-Resume.pdf
#
set -euo pipefail
cd "$(dirname "$0")"
tectonic -Z continue-on-errors resume.tex   # continue-on-errors recovers like Overleaf (itemize nested in rSubsection)
cp resume.pdf Gordon-Gouger-Resume.pdf
echo "→ Gordon-Gouger-Resume.pdf"
