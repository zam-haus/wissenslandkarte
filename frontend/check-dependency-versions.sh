#!/bin/bash

# Stellt sicher, dass das Skript bei Fehlern abbricht,
# bei ungesetzten Variablen fehlschlägt und Fehler in Pipelines weitergibt.
set -euo pipefail

# --- Konfiguration ---
# Die zu durchsuchende Lock-Datei.
LOCK_FILE="package-lock.json"

# --- Hilfsfunktionen ---

# Gibt die korrekte Verwendung des Skripts aus.
usage() {
  echo "Usage: $0 -a -v -h <csv_datei>"
  echo
  echo "Durchsucht '${LOCK_FILE}' nach Paketen und deren Versionen."
  echo "Ignoriert das Root-Paket und behandelt SemVer-Präfixe."
  echo "Das CSV-Dateiformat muss sein: <paketname>;<paketversion>"
  echo
}

# --- Hauptlogik ---

# 1. Argumente und Voraussetzungen prüfen
# ----------------------------------------------------

MATCH_ANY_VERSION="false"
VERBOSE="false"

# Argumente mit getopts parsen (-a, -v)
while getopts ":av" opt; do
  case "$opt" in
    a)
      MATCH_ANY_VERSION="true"
      ;;
    v)
      VERBOSE="true"
      ;;
    \?)
      echo "Fehler: Ungültige Option: -$OPTARG" >&2
      usage
      exit 1
      ;;
  esac
done
shift $((OPTIND - 1))

if [[ $# -ne 1 ]]; then
  echo "Fehler: Es wurde keine CSV-Datei angegeben." >&2
  usage
  exit 1
fi

CSV_FILE="$1"

if ! command -v jq &> /dev/null; then
    echo "Fehler: 'jq' ist nicht installiert. Bitte installieren Sie es, um fortzufahren." >&2
    exit 1
fi

if [[ ! -f "$CSV_FILE" ]]; then
  echo "Fehler: CSV-Datei '${CSV_FILE}' nicht gefunden." >&2
  exit 1
fi

if [[ ! -f "$LOCK_FILE" ]]; then
  echo "Fehler: '${LOCK_FILE}' nicht im aktuellen Verzeichnis gefunden." >&2
  exit 1
fi

# 2. Pakete durchsuchen und Ergebnisse ausgeben
# ----------------------------------------------------


found_count_lock=0
found_count_cache=0
total_count=0

function searchPackageLock() {
  echo "---"
  echo "🔎🔒 Durchsuche '${LOCK_FILE}' nach Paketen aus '${CSV_FILE}'..."

  while IFS=';' read -r package_name package_version || [[ -n "$package_name" ]]; do
    package_name=$(echo "$package_name" | xargs)
    package_version=$(echo "$package_version" | xargs)

    if [[ -z "$package_name" || -z "$package_version" ]]; then
      continue
    fi

    ((++total_count))

    if [[ "$VERBOSE" == "true" ]]; then
      echo "🔎🔒 Suche in package-lock.json nach $package_name;$package_version"
    fi

    # Die 'jq'-Abfrage wurde vereinfacht und korrigiert.
    result=$(jq --arg pkg "$package_name" --arg ver "$package_version" -r '
      .packages | to_entries[] |
        select(
          .key != "" and
          # Stelle sicher, dass der Wert ein Objekt ist (wichtig für Workspaces).
          (.value | type == "object") and
          # Prüfe, ob der Paketname am Ende des Schlüssels steht.
          (.key | endswith("/" + $pkg)) and
          # Prüfe, ob die Version die gesuchte Zeichenkette enthält.
          (.value.version | contains($ver) or $ver == "*" or '"$MATCH_ANY_VERSION"')
        ) |
      "✅ \($pkg);\($ver) gefunden als \"\(.value.version)\" (Pfad: \(.key))"
    ' "$LOCK_FILE")

    if [[ -n "$result" ]]; then
      echo "$result"
      ((++found_count_lock))
    fi
  done < "$CSV_FILE"
  echo "---"
}

function searchPackageCache() {
  echo "---"
  echo "🔎🗄️ Durchsuche npm cache nach Paketen aus '${CSV_FILE}'..."

  npm_cache_content=$(npm cache ls)
  while IFS=';' read -r package_name package_version || [[ -n "$package_name" ]]; do
    package_name=$(echo "$package_name" | xargs)
    package_version=$(echo "$package_version" | xargs)

    if [[ -z "$package_name" || -z "$package_version" ]]; then
      continue
    fi

    if [[ "$VERBOSE" == "true" ]]; then
      echo "🔎🗄️ Suche in npm cache nach $package_name;$package_version"
    fi

    if [[ "$MATCH_ANY_VERSION" == "true" ]]; then
      result=$(echo "$npm_cache_content" | grep "$package_name" || true)
    else
      result=$(echo "$npm_cache_content" | grep "$package_name-$package_version" || true)
    fi

    if [[ -n "$result" ]]; then
      while IFS= read -r line; do
        echo "✅ $package_name;$package_version im cache gefunden als $line"
      done <<< "$result"
      ((++found_count_cache))
    fi
  done < "$CSV_FILE"
  echo "---"
}

searchPackageLock
searchPackageCache

# 3. Zusammenfassung ausgeben
# ----------------------------------------------------
echo "---"
echo "Suche abgeschlossen. ✨"
echo "Ergebnis package-lock: ${found_count_lock} von ${total_count} Paketen wurden gefunden."
echo "Ergebnis cache: ${found_count_lock} von ${total_count} Paketen wurden gefunden."

if [[ "$found_count_lock" -ne "0" || "$found_count_cache" -ne "0"   ]]; then
  exit 1
fi

exit 0
