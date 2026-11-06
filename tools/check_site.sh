#!/usr/bin/env bash
# Repoyu yerelde sunar, şifreli blobları doğrular ve uçtan uca denetimi çalıştırır.
# Kullanım: MEDLOCK_PASS=... bash tools/check_site.sh [ekran-görüntüsü-klasörü]
set -u
cd "$(dirname "$0")/.."
python3 tools/medlock.py check || exit 1
du -sh d | awk '{print "d/ boyutu: " $1}'
PORT=8765
python3 -m http.server $PORT --bind 127.0.0.1 >/dev/null 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1
NODE_PATH="$(npm root -g 2>/dev/null)" node tools/e2e.js "http://127.0.0.1:$PORT/" "${1:-}"
