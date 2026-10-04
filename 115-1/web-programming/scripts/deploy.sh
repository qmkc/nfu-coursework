#!/usr/bin/env bash
#
# Deploys out/ to InfinityFree in two steps:
#
#   1. FTP-uploads the control-plane endpoint (scripts/deploy-endpoint.php)
#      under a freshly random filename - never reused across runs - plus
#      its .deploy-state/.htaccess. Never touches .deploy-state/secret.php -
#      that has to already exist on the server (bootstrapped once by
#      hand/FTP, see README).
#   2. Diffs a sha256 manifest of out/ against the manifest the endpoint
#      already has, zips up only the changed/new files, splits that zip
#      into chunks sized for PHP's upload limits, and POSTs them to the
#      endpoint over HTTPS along with the list of files that disappeared
#      locally. The endpoint reassembles + extracts the zip (auto-splitting
#      any resulting file that's too big to store as one piece - see
#      scripts/deploy-endpoint.php), deletes the removed files, and updates
#      its manifest. If nothing changed, nothing is uploaded at all.
#   3. Removes the endpoint again. Normally it has already self-destructed
#      server-side (see scripts/deploy-endpoint.php) as the last thing it
#      did when the deploy finished, so this is usually a no-op; it's the
#      fallback for every path that never reaches that point (a failed
#      chunk upload, a dropped connection, or a "no changes" run that never
#      calls finalize/prune at all). Either way, by the time this script
#      exits - success or failure - the endpoint is gone and there is
#      nothing listening at that URL to attack.
#
# Required env: FTP_HOST, FTP_USER, FTP_PASS, DEPLOY_TOKEN, SITE_URL
# Optional env: FTP_REMOTE_BASE (default /htdocs), CHUNK_SIZE_BYTES (default 4MiB)
#
# Requires: lftp, curl, jq, zip, sha256sum, openssl

set -euo pipefail
umask 077

FTP_HOST="${FTP_HOST:-}"
FTP_USER="${FTP_USER:-}"
FTP_PASS="${FTP_PASS:-}"
DEPLOY_TOKEN="${DEPLOY_TOKEN:-}"
SITE_URL="${SITE_URL:-}"
FTP_REMOTE_BASE="${FTP_REMOTE_BASE:-/htdocs}"
CHUNK_SIZE_BYTES="${CHUNK_SIZE_BYTES:-4194304}"

WORKDIR="$(cd "$(mktemp -d ./.tmp.deploy.XXXXXX)" && pwd)"
TMP_FTP_CMD="$WORKDIR/ftp-cmd"
ZIP_PATH="$WORKDIR/site.zip"
CHUNKS_DIR="$WORKDIR/chunks"
RESPONSE_PATH="$WORKDIR/response.json"
LOCAL_MANIFEST="$WORKDIR/local-manifest.tsv"
REMOTE_MANIFEST="$WORKDIR/remote-manifest.tsv"
UPLOAD_LIST="$WORKDIR/upload-list.txt"

ENDPOINT_UPLOADED=false
ENDPOINT_REMOVED=false
ENDPOINT_SELF_DESTRUCTED=false

# Best-effort FTP removal of the endpoint file. A no-op if it was never
# uploaded, already removed, or already self-destructed server-side (the
# normal case - see scripts/deploy-endpoint.php) - this is only the
# fallback for paths that never reach a finalize/prune response.
remove_remote_endpoint() {
  [ "$ENDPOINT_UPLOADED" = true ] || return 0
  [ "$ENDPOINT_REMOVED" = true ] && return 0
  if [ "$ENDPOINT_SELF_DESTRUCTED" = true ]; then
    ENDPOINT_REMOVED=true
    return 0
  fi

  local cmd_file="$WORKDIR/ftp-cmd-cleanup"
  {
    echo 'set ssl:verify-certificate false'
    echo 'set net:max-retries 2'
    echo 'set net:timeout 10'
    printf 'open %s\n' "$(lftp_quote "$FTP_HOST")"
    printf 'user %s %s\n' "$(lftp_quote "$FTP_USER")" "$(lftp_quote "$FTP_PASS")"
    printf 'rm -f %s\n' "$(lftp_quote "${FTP_REMOTE_BASE}/api/${ENDPOINT_NAME}")"
    echo "bye"
  } > "$cmd_file"

  if lftp -f "$cmd_file" > /dev/null 2>&1; then
    ENDPOINT_REMOVED=true
  else
    echo "Warning: could not remove the deploy endpoint (api/${ENDPOINT_NAME}) - remove it by hand over FTP" >&2
  fi
}

cleanup() {
  local exit_code=$?
  remove_remote_endpoint
  rm -rf "$WORKDIR"
  return "$exit_code"
}
trap cleanup EXIT

error_exit() {
  echo "Error: $*" >&2
  exit 1
}

info() {
  echo "$*"
}

success() {
  echo "$*"
}

count_lines() {
  local value="$1"
  [ -z "$value" ] && { echo 0; return; }
  printf '%s\n' "$value" | wc -l | tr -d ' '
}

lftp_quote() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//\$/\\\$}"
  value="${value//\`/\\\`}"
  printf '"%s"' "$value"
}

jq_get() {
  local filter="$1" json="$2"
  printf '%s' "$json" | jq -r "$filter"
}

[ -n "$FTP_HOST" ] || error_exit "FTP_HOST not set"
[ -n "$FTP_USER" ] || error_exit "FTP_USER not set"
[ -n "$FTP_PASS" ] || error_exit "FTP_PASS not set"
[ -n "$DEPLOY_TOKEN" ] || error_exit "DEPLOY_TOKEN not set"
[ -n "$SITE_URL" ] || error_exit "SITE_URL not set"
[ -d "out" ] || error_exit "out directory not found"
[ -f "scripts/deploy-endpoint.php" ] || error_exit "scripts/deploy-endpoint.php not found"

find out -type f -print -quit 2>/dev/null | grep -q . || error_exit "out directory is empty"

SITE_URL="${SITE_URL%/}"

# Freshly random every run, not derived from anything reusable - there's no
# need for it to be reproducible across deploys since this run removes its
# own endpoint before exiting (self-destruct server-side, or this script's
# cleanup trap as a fallback - see the header comment above).
ENDPOINT_HASH="$(openssl rand -hex 16)"
ENDPOINT_NAME="deploy-${ENDPOINT_HASH}.php"
ENDPOINT_URL="${SITE_URL}/api/${ENDPOINT_NAME}"

echo ""
echo "[1/5] Uploading control-plane endpoint over FTP..."

{
  echo 'set ssl:verify-certificate false'
  echo 'set net:max-retries 2'
  echo 'set net:timeout 10'
  echo 'set xfer:clobber on'
  echo 'set cmd:fail-exit true'
  printf 'open %s\n' "$(lftp_quote "$FTP_HOST")"
  printf 'user %s %s\n' "$(lftp_quote "$FTP_USER")" "$(lftp_quote "$FTP_PASS")"
  printf 'mkdir -p -f %s\n' "$(lftp_quote "${FTP_REMOTE_BASE}/api/.deploy-state")"
  printf 'lcd %s\n' "$(lftp_quote "$(pwd)/scripts")"
  printf 'put %s -o %s\n' "$(lftp_quote "deploy-endpoint.php")" "$(lftp_quote "${FTP_REMOTE_BASE}/api/${ENDPOINT_NAME}")"
  printf 'put %s -o %s\n' "$(lftp_quote ".deploy-state/.htaccess")" "$(lftp_quote "${FTP_REMOTE_BASE}/api/.deploy-state/.htaccess")"
  echo "bye"
} > "$TMP_FTP_CMD"

lftp -f "$TMP_FTP_CMD" || error_exit "FTP upload of the control-plane endpoint failed"
ENDPOINT_UPLOADED=true

info "  Endpoint: ${ENDPOINT_URL} (fresh random name, removed again before this script exits)"

echo ""
echo "[2/5] Diffing out/ against the endpoint's manifest..."

http_status="$(curl -sS -o "$RESPONSE_PATH" -w '%{http_code}' \
  -H "X-Deploy-Token: ${DEPLOY_TOKEN}" \
  -F "action=manifest" \
  "$ENDPOINT_URL")" || error_exit "Fetching the remote manifest failed to connect"

response="$(cat "$RESPONSE_PATH")"
if [ "$http_status" != "200" ] || [ "$(jq_get '.ok' "$response")" != "true" ]; then
  error_exit "Fetching the remote manifest failed (HTTP $http_status): $response"
fi

jq -r '.manifest | to_entries[]? | "\(.key)\t\(.value)"' <<< "$response" | LC_ALL=C sort -o "$REMOTE_MANIFEST"

: > "$LOCAL_MANIFEST"
while IFS= read -r -d '' local_file; do
  relative_path="${local_file#out/}"
  hash="$(sha256sum -- "$local_file" | awk '{print $1}')"
  printf '%s\t%s\n' "$relative_path" "$hash" >> "$LOCAL_MANIFEST"
done < <(find out -type f -print0 2>/dev/null | LC_ALL=C sort -z)
LC_ALL=C sort -o "$LOCAL_MANIFEST" "$LOCAL_MANIFEST"

upload_list="$(comm -23 <(LC_ALL=C sort "$LOCAL_MANIFEST") <(LC_ALL=C sort "$REMOTE_MANIFEST") | cut -f1)"
remove_list="$(
  comm -23 \
    <(cut -f1 "$REMOTE_MANIFEST" | LC_ALL=C sort -u) \
    <(cut -f1 "$LOCAL_MANIFEST" | LC_ALL=C sort -u)
)"
upload_list="$(printf '%s\n' "$upload_list" | sed '/^$/d')"
remove_list="$(printf '%s\n' "$remove_list" | sed '/^$/d')"

upload_count="$(count_lines "$upload_list")"
removed_count="$(count_lines "$remove_list")"

info "  $upload_count changed/new file(s), $removed_count removed file(s)"

if [ "$upload_count" -eq 0 ] && [ "$removed_count" -eq 0 ]; then
  echo ""
  success "No changes detected - remote is already synchronized"
  exit 0
fi

removed_json="$(printf '%s\n' "$remove_list" | sed '/^$/d' | jq -R . | jq -s .)"

if [ "$upload_count" -eq 0 ]; then
  echo ""
  echo "[3/5] No file changes, only removals - pruning directly..."
  echo "[4/5] (skipped - no archive to upload)"
  echo ""
  echo "[5/5] Finalizing deployment..."

  http_status="$(curl -sS -o "$RESPONSE_PATH" -w '%{http_code}' \
    -H "X-Deploy-Token: ${DEPLOY_TOKEN}" \
    -F "action=prune" \
    -F "removed=${removed_json}" \
    "$ENDPOINT_URL")" || error_exit "Prune request failed to connect"

  response="$(cat "$RESPONSE_PATH")"
  if [ "$http_status" != "200" ] || [ "$(jq_get '.ok' "$response")" != "true" ]; then
    error_exit "Prune failed (HTTP $http_status): $response"
  fi
  ENDPOINT_SELF_DESTRUCTED=true

  echo ""
  success "Deployment completed successfully!"
  info "  Written: 0 file(s)"
  info "  Removed: $(jq_get '.removed' "$response") file(s)"
  info "  Endpoint: self-destructed server-side"
  info "  Finalized: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
  echo ""
  exit 0
fi

echo ""
echo "[3/5] Zipping $upload_count changed/new file(s)..."

printf '%s\n' "$upload_list" > "$UPLOAD_LIST"
( cd out && zip -q -X "$ZIP_PATH" -@ < "$UPLOAD_LIST" )

[ -s "$ZIP_PATH" ] || error_exit "Zip creation failed or produced an empty archive"

ZIP_SHA256="$(sha256sum -- "$ZIP_PATH" | awk '{print $1}')"
info "  Archive: $(du -h "$ZIP_PATH" | cut -f1) sha256=${ZIP_SHA256}"

echo ""
echo "[4/5] Uploading archive to ${ENDPOINT_URL}..."

mkdir -p "$CHUNKS_DIR"
split -b "$CHUNK_SIZE_BYTES" -d -a 4 "$ZIP_PATH" "$CHUNKS_DIR/part-"

mapfile -t parts < <(find "$CHUNKS_DIR" -type f -name 'part-*' | LC_ALL=C sort)
total="${#parts[@]}"
[ "$total" -gt 0 ] || error_exit "Splitting the archive produced no chunks"

info "  Uploading in $total chunk(s) of up to $CHUNK_SIZE_BYTES bytes each"

for i in "${!parts[@]}"; do
  part="${parts[$i]}"

  http_status="$(curl -sS -o "$RESPONSE_PATH" -w '%{http_code}' \
    -H "X-Deploy-Token: ${DEPLOY_TOKEN}" \
    -F "action=chunk" \
    -F "uploadId=${ZIP_SHA256}" \
    -F "part=${i}" \
    -F "total=${total}" \
    -F "chunk=@${part};type=application/zip" \
    "$ENDPOINT_URL")" || error_exit "Chunk upload $((i + 1))/$total failed to connect"

  response="$(cat "$RESPONSE_PATH")"
  if [ "$http_status" != "200" ] || [ "$(jq_get '.ok' "$response")" != "true" ]; then
    error_exit "Chunk upload $((i + 1))/$total failed (HTTP $http_status): $response"
  fi

  info "    part $((i + 1))/$total uploaded"
done

echo ""
echo "[5/5] Finalizing deployment..."

http_status="$(curl -sS -o "$RESPONSE_PATH" -w '%{http_code}' \
  -H "X-Deploy-Token: ${DEPLOY_TOKEN}" \
  -F "action=finalize" \
  -F "uploadId=${ZIP_SHA256}" \
  -F "total=${total}" \
  -F "sha256=${ZIP_SHA256}" \
  -F "removed=${removed_json}" \
  "$ENDPOINT_URL")" || error_exit "Finalize request failed to connect"

response="$(cat "$RESPONSE_PATH")"
if [ "$http_status" != "200" ] || [ "$(jq_get '.ok' "$response")" != "true" ]; then
  error_exit "Finalize failed (HTTP $http_status): $response"
fi
ENDPOINT_SELF_DESTRUCTED=true

echo ""
success "Deployment completed successfully!"
info "  Written: $(jq_get '.written' "$response") file(s)"
info "  Removed: $(jq_get '.removed' "$response") file(s)"
info "  Endpoint: self-destructed server-side"
info "  Finalized: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
