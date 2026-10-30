#!/usr/bin/env bash
# Compresses the high-quality reel masters into light files ready to upload.
# H.264 + AAC in MP4 (what LinkedIn and Instagram accept everywhere), tuned for
# flat animation, with the index at the start so playback begins immediately.
# Usage: scripts/compress-reels.sh [crf]   (default 28; lower = better and heavier)
set -euo pipefail
cd "$(dirname "$0")/.."
CRF="${1:-28}"
for variant in linkedin instagram; do
  in="out/master-${variant}.mp4"
  out="out/oln-reel-${variant}.mp4"
  ffmpeg -loglevel error -y -i "$in" \
    -c:v libx264 -preset veryslow -tune animation -crf "$CRF" -pix_fmt yuv420p -profile:v high \
    -c:a aac -b:a 96k -ac 2 \
    -movflags +faststart "$out"
  echo "$out: $(du -h "$out" | cut -f1)"
done
