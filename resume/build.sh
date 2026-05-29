#!/usr/bin/env bash
# Compile the résumé from LaTeX with Tectonic (lightweight, self-contained engine).
#
#   brew install tectonic     # one-time
#   ./build.sh                # -> Gordon-Gouger-Resume.pdf
#
set -euo pipefail
cd "$(dirname "$0")"

# continue-on-errors recovers like Overleaf (itemize nested in rSubsection's list)

# PUBLIC version — no email/phone. This PDF ships on the website.
tectonic -Z continue-on-errors resume.tex
cp resume.pdf Gordon-Gouger-Resume.pdf
echo "→ Gordon-Gouger-Resume.pdf (public — safe to publish)"

# PRIVATE version — adds email + phone for job applications.
# resume-contact.tex is gitignored; built only if present locally.
if [ -f resume-contact.tex ]; then
  tectonic -Z continue-on-errors resume-contact.tex
  cp resume-contact.pdf Gordon-Gouger-Resume-contact.pdf
  echo "→ Gordon-Gouger-Resume-contact.pdf (private — do NOT publish)"
fi
