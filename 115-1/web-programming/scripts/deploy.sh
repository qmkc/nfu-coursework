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
# Some free hosts (InfinityFree included) silently drop requests that look
# like they're from a bot/script - no error, just a dropped connection
# (curl: (52) Empty reply from server). A browser-like UA avoids that.
CURL_USER_AGENT="${CURL_USER_AGENT:-Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36}"

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

# InfinityFree anti-bot cookie, fetched lazily by endpoint_post() and reused
# across requests until a response comes back as non-JSON (= challenge page).
TEST_COOKIE=''
# HTTP status of the most recent endpoint_post() call.
HTTP_STATUS=''

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

update_test_cookie() {
  local challenge_url="${ENDPOINT_URL}?action=challenge"
  local html key iv cipher i byte   # i/byte must be local: callers loop over $i too
  local -a decrypted iv_bytes
  local cookie=''

  html="$(curl -fsSL -A "$CURL_USER_AGENT" "$challenge_url")" || return 1
  key="$(grep -oP 'a=toNumbers\("\K[0-9a-fA-F]+' <<< "$html")"
  iv="$(grep -oP 'b=toNumbers\("\K[0-9a-fA-F]+' <<< "$html")"
  cipher="$(grep -oP 'c=toNumbers\("\K[0-9a-fA-F]+' <<< "$html")"

  if [[ -z "$key" || -z "$iv" || -z "$cipher" ]]; then
    echo "Failed to extract AES parameters" >&2
    return 1
  fi

  echo "  AES key:    $key"
  echo "  AES IV:     $iv"
  echo "  AES cipher: $cipher"

  read -ra decrypted <<< "$(
    printf '%s' "$cipher" |
      sed 's/../\\x&/g' |
      printf '%b' "$(cat)" |
      openssl enc -d -aes-128-ecb \
        -K "$key" \
        -nosalt \
        -nopad |
      od -An -tu1
  )" || return 1

  read -ra iv_bytes <<< "$(
    printf '%s' "$iv" |
      sed 's/../\\x&/g' |
      printf '%b' "$(cat)" |
      od -An -tu1
  )" || return 1

  if [[ ${#decrypted[@]} -ne 16 || ${#iv_bytes[@]} -ne 16 ]]; then
    echo "Invalid AES block size" >&2
    return 1
  fi

  for i in {0..15}; do
    printf -v byte '%02x' "$((decrypted[i] ^ iv_bytes[i]))"
    cookie+="$byte"
  done

  TEST_COOKIE="$cookie"

  echo "  __test=$TEST_COOKIE"
}

# True if $RESPONSE_PATH holds a JSON object. The endpoint always answers
# with one; anything else (InfinityFree's HTML challenge page, an empty
# body) means the request never reached the PHP code.
response_is_json() {
  jq -e 'type == "object"' "$RESPONSE_PATH" > /dev/null 2>&1
}

# POST multipart form fields ("$@" = curl -F arguments) to the endpoint.
# Writes the body to $RESPONSE_PATH and the status code to $HTTP_STATUS.
# Reuses $TEST_COOKIE; only when the response is not JSON does it fetch a
# fresh challenge cookie and retry exactly once. Retrying is safe for every
# action: a non-JSON reply means PHP never ran, and chunk uploads overwrite
# the same part file anyway.
# Returns 1 only on connection-level failure; HTTP/JSON errors are left for
# the caller to report via require_ok.
endpoint_post() {
  local attempt
  local -a fields=()
  local field

  for field in "$@"; do
    fields+=(-F "$field")
  done

  for attempt in 1 2; do
    if [ -z "$TEST_COOKIE" ] || [ "$attempt" -eq 2 ]; then
      update_test_cookie || error_exit "Failed to obtain InfinityFree challenge cookie"
    fi

    HTTP_STATUS="$(curl -sS -o "$RESPONSE_PATH" -w '%{http_code}' \
      -X POST \
      -A "$CURL_USER_AGENT" \
      -H "X-Deploy-Token: ${DEPLOY_TOKEN}" \
      -b "__test=${TEST_COOKIE}" \
      "${fields[@]}" \
      "$ENDPOINT_URL")" || return 1

    response_is_json && return 0

    if [ "$attempt" -eq 1 ]; then
      echo "  Response was not JSON (HTTP $HTTP_STATUS) - refreshing challenge cookie and retrying once..." >&2
    fi
  done

  return 0
}

# Abort unless the last endpoint_post() got HTTP 200 and {"ok": true}.
require_ok() {
  local what="$1"
  if [ "$HTTP_STATUS" != "200" ] || [ "$(jq -r '.ok' "$RESPONSE_PATH" 2>/dev/null)" != "true" ]; then
    error_exit "$what failed (HTTP $HTTP_STATUS): $(head -c 500 "$RESPONSE_PATH")"
  fi
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
# cleanup trap as a fallback).
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

endpoint_post "action=manifest" || error_exit "Fetching the remote manifest failed to connect"
require_ok "Fetching the remote manifest"

jq -r '.manifest | to_entries[]? | "\(.key)\t\(.value)"' "$RESPONSE_PATH" | LC_ALL=C sort -o "$REMOTE_MANIFEST"

: > "$LOCAL_MANIFEST"
while IFS= read -r -d '' local_file; do
  relative_path="${local_file#out/}"
  hash="$(sha256sum -- "$local_file" | awk '{print $1}')"
  printf '%s\t%s\n' "$relative_path" "$hash" >> "$LOCAL_MANIFEST"
done < <(find out -type f -print0 2>/dev/null | LC_ALL=C sort -z)
LC_ALL=C sort -o "$LOCAL_MANIFEST" "$LOCAL_MANIFEST"

# comm must use the same collation as the sort that produced its inputs,
# otherwise it rejects them as "not in sorted order" (and set -e aborts).
# Both manifests are already sorted with LC_ALL=C above.
upload_list="$(LC_ALL=C comm -23 "$LOCAL_MANIFEST" "$REMOTE_MANIFEST" | cut -f1)"
remove_list="$(
  LC_ALL=C comm -23 \
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

removed_json="$(printf '%s\n' "$remove_list" | sed '/^$/d' | jq -R . | jq -s -c .)"

if [ "$upload_count" -eq 0 ]; then
  echo ""
  echo "[3/5] No file changes, only removals - pruning directly..."
  echo "[4/5] (skipped - no archive to upload)"
  echo ""
  echo "[5/5] Finalizing deployment..."

  endpoint_post "action=prune" "removed=${removed_json}" || error_exit "Prune request failed to connect"
  require_ok "Prune"
  ENDPOINT_SELF_DESTRUCTED=true

  response="$(cat "$RESPONSE_PATH")"
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

  endpoint_post \
    "action=chunk" \
    "uploadId=${ZIP_SHA256}" \
    "part=${i}" \
    "total=${total}" \
    "chunk=@${part};type=application/zip" \
    || error_exit "Chunk upload $((i + 1))/$total failed to connect"
  require_ok "Chunk upload $((i + 1))/$total"

  info "    part $((i + 1))/$total uploaded"
done

echo ""
echo "[5/5] Finalizing deployment..."

endpoint_post \
  "action=finalize" \
  "uploadId=${ZIP_SHA256}" \
  "total=${total}" \
  "sha256=${ZIP_SHA256}" \
  "removed=${removed_json}" \
  || error_exit "Finalize request failed to connect"
require_ok "Finalize"
ENDPOINT_SELF_DESTRUCTED=true

response="$(cat "$RESPONSE_PATH")"
echo ""
success "Deployment completed successfully!"
info "  Written: $(jq_get '.written' "$response") file(s)"
info "  Removed: $(jq_get '.removed' "$response") file(s)"
info "  Endpoint: self-destructed server-side"
info "  Finalized: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
