#!/usr/bin/env bash
# Télécharge depuis npm les bibliothèques embarquées dans le site (versions figées) et les extrait dans le dossier donné.
# Usage : bash scripts/fetch-libs.sh /chemin/libs   puis   python3 src/build.py /chemin/libs
set -euo pipefail
OUT="${1:?dossier de destination}"; mkdir -p "$OUT"; cd "$OUT"
for p in jspdf@2.5.1 jspdf-autotable@3.8.2 jsbarcode@3.11.6 xlsx@0.18.5 firebase@10.12.2 mermaid@10.9.1 \
         @fontsource/public-sans@5.0.18 @fontsource/jetbrains-mono@5.0.20 @fontsource-variable/bricolage-grotesque@5.3.0; do
  f=$(npm pack "$p" --silent | tail -1); d="${f%.tgz}"; mkdir -p "$d"; tar xzf "$f" -C "$d"; rm -f "$f"
done
echo "Bibliothèques prêtes dans $OUT"
