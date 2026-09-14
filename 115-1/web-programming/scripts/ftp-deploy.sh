#!/usr/bin/env bash

set -euo pipefail
umask 077

FTP_HOST="${FTP_HOST:-}"
FTP_USER="${FTP_USER:-}"
FTP_PASS="${FTP_PASS:-}"
FTP_REMOTE_BASE="/htdocs"
MANIFEST_FILENAME=".deploy-manifest"

TMP_LOCAL_MANIFEST="$(mktemp ./.tmp.manifest.local.XXXXXX)"
TMP_REMOTE_MANIFEST="$(mktemp ./.tmp.manifest.remote.XXXXXX)"
TMP_FTP_CMD="$(mktemp ./.tmp.ftp-cmd.XXXXXX)"
TMP_FTP_ERR="$(mktemp ./.tmp.ftp-err.XXXXXX)"

upload_list=""
remove_list=""
dir_list=""

cleanup() {
  local exit_code=$?
  rm -f "$TMP_LOCAL_MANIFEST" "$TMP_REMOTE_MANIFEST" "$TMP_FTP_CMD" "$TMP_FTP_ERR"
  return "$exit_code"
}
trap cleanup EXIT

error_exit() {
  echo "Error: $*" >&2
  exit 1
}

warn() {
  echo "Warning: $*" >&2
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

validate_manifest() {
  local manifest="$1"
  local path hash

  while IFS=$'\t' read -r path hash; do
    [[ "$path" == "$FTP_REMOTE_BASE"/* ]] || return 1
    [[ "$hash" =~ ^[0-9a-fA-F]{64}$ ]] || return 1
  done < "$manifest"
}

generate_ftp_config() {
  local cmd_file="$1"

  : > "$cmd_file"

  {
    echo 'set ssl:verify-certificate false'
    echo 'set net:max-retries 2'
    echo 'set net:timeout 10'
    echo 'set xfer:clobber on'
    echo 'set cmd:fail-exit true'
    printf 'open %s\n' "$(lftp_quote "$FTP_HOST")"
    printf 'user %s %s\n' "$(lftp_quote "$FTP_USER")" "$(lftp_quote "$FTP_PASS")"
  } >> "$cmd_file"
}

[ -n "$FTP_HOST" ] || error_exit "FTP_HOST not set"
[ -n "$FTP_USER" ] || error_exit "FTP_USER not set"
[ -n "$FTP_PASS" ] || error_exit "FTP_PASS not set"
[ -d "dist" ] || error_exit "dist directory not found"

find dist -type f -print -quit 2>/dev/null | grep -q . || error_exit "dist directory is empty"

echo ""
echo "[1/5] Generating local manifest..."

: > "$TMP_LOCAL_MANIFEST"
file_count=0

while IFS= read -r -d '' local_file; do
  relative_path="${local_file#dist/}"
  case "$relative_path" in
    *$'\n'*|*$'\r'*|*$'\t'*)
      error_exit "Unsupported filename: $relative_path"
      ;;
  esac

  hash="$(sha256sum -- "$local_file" | awk '{print $1}')"

  [[ "$hash" =~ ^[0-9a-fA-F]{64}$ ]] || error_exit "Failed to calculate SHA-256: $local_file"

  printf '%s\t%s\n' \
    "${FTP_REMOTE_BASE}/${relative_path}" \
    "$hash" >> "$TMP_LOCAL_MANIFEST"

  file_count=$((file_count + 1))
done < <(find dist -type f -print0 2>/dev/null | LC_ALL=C sort -z)

LC_ALL=C sort -o "$TMP_LOCAL_MANIFEST" "$TMP_LOCAL_MANIFEST"
validate_manifest "$TMP_LOCAL_MANIFEST" || error_exit "Generated local manifest is invalid"
info "  Found $file_count files in build output"

echo ""
echo "[2/5] Downloading remote manifest..."

: > "$TMP_REMOTE_MANIFEST"
: > "$TMP_FTP_ERR"

generate_ftp_config "$TMP_FTP_CMD"

{
  printf 'get %s -o %s\n' \
    "$(lftp_quote "${FTP_REMOTE_BASE}/${MANIFEST_FILENAME}")" \
    "$(lftp_quote "$TMP_REMOTE_MANIFEST")"
  echo "bye"
} >> "$TMP_FTP_CMD"

remote_manifest_exists=false

if lftp -f "$TMP_FTP_CMD" > /dev/null 2> "$TMP_FTP_ERR"; then
  [ -s "$TMP_REMOTE_MANIFEST" ] || error_exit "Remote manifest is empty"
  validate_manifest "$TMP_REMOTE_MANIFEST" || error_exit "Remote manifest is invalid"
  remote_manifest_exists=true
  info "  Remote manifest found"
elif grep -Eiq \
  '550 .*([Nn]ot found|[Nn]o such file|[Ff]ile unavailable)|No such file|not found|file unavailable' \
  "$TMP_FTP_ERR"; then
  info "  Remote manifest not found (assuming first deployment)"
else
  echo "FTP error while downloading remote manifest:" >&2
  sed 's/^/  /' "$TMP_FTP_ERR" >&2
  error_exit "Failed to download remote manifest"
fi

echo ""
echo "[3/5] Computing file differences..."

if [ "$remote_manifest_exists" = true ]; then
  upload_list="$(
    comm -23 \
      <(LC_ALL=C sort "$TMP_LOCAL_MANIFEST") \
      <(LC_ALL=C sort "$TMP_REMOTE_MANIFEST") |
      cut -f1
  )"

  remove_list="$(
    comm -23 \
      <(cut -f1 "$TMP_REMOTE_MANIFEST" | LC_ALL=C sort -u) \
      <(cut -f1 "$TMP_LOCAL_MANIFEST" | LC_ALL=C sort -u)
  )"

  info "  Found $(count_lines "$upload_list") changed/new files"
  info "  Found $(count_lines "$remove_list") files removed locally"
else
  upload_list="$(cut -f1 "$TMP_LOCAL_MANIFEST")"
  remove_list=""
  info "  First deployment: will upload all $file_count files"
fi

upload_list="$(printf '%s\n' "$upload_list" | sed '/^$/d')"
remove_list="$(printf '%s\n' "$remove_list" | sed '/^$/d')"

upload_count="$(count_lines "$upload_list")"
removed_count="$(count_lines "$remove_list")"

if [ "$upload_count" -eq 0 ] && [ "$removed_count" -eq 0 ]; then
  echo ""
  success "No changes detected - remote is already synchronized"
  exit 0
fi

if [ "$upload_count" -gt 0 ]; then
  info "  Will upload $upload_count files:"
  mapfile -t preview <<< "$upload_list"
  printf '      %s\n' "${preview[@]:0:5}"
  [ "$upload_count" -gt 5 ] && info "      ... and $((upload_count - 5)) more"
fi

if [ "$removed_count" -gt 0 ]; then
  info "  Will remove $removed_count files:"
  mapfile -t preview <<< "$remove_list"
  printf '      %s\n' "${preview[@]:0:5}"
  [ "$removed_count" -gt 5 ] && info "      ... and $((removed_count - 5)) more"
fi

echo ""
echo "[4/5] Syncing files to ${FTP_HOST}..."

if [ "$upload_count" -gt 0 ]; then
  dir_list="$(
    while IFS= read -r remote_path; do
      [ -z "$remote_path" ] || dirname -- "$remote_path"
    done <<< "$upload_list" |
      LC_ALL=C sort -u
  )"
fi

generate_ftp_config "$TMP_FTP_CMD"

local_file_missing=0
upload_commands=0
remove_commands=0

{
  printf 'lcd %s\n' "$(lftp_quote "$(pwd)")"

  while IFS= read -r remote_dir; do
    [ -z "$remote_dir" ] && continue

    case "$remote_dir" in
      "$FTP_REMOTE_BASE"|"$FTP_REMOTE_BASE"/*) ;;
      *) error_exit "Invalid remote directory: $remote_dir" ;;
    esac

    printf 'mkdir -p -f %s\n' "$(lftp_quote "$remote_dir")"
  done <<< "$dir_list"

  while IFS= read -r remote_path; do
    [ -z "$remote_path" ] && continue

    case "$remote_path" in
      "$FTP_REMOTE_BASE"/*) ;;
      *) error_exit "Invalid remote path: $remote_path" ;;
    esac

    local_path="dist${remote_path#"$FTP_REMOTE_BASE"}"

    if [ ! -f "$local_path" ]; then
      warn "Local file missing: $local_path (skipping)"
      local_file_missing=$((local_file_missing + 1))
      continue
    fi

    printf 'put %s -o %s\n' \
      "$(lftp_quote "$local_path")" \
      "$(lftp_quote "$remote_path")"

    upload_commands=$((upload_commands + 1))
  done <<< "$upload_list"

  while IFS= read -r remote_path; do
    [ -z "$remote_path" ] && continue

    case "$remote_path" in
      "$FTP_REMOTE_BASE"/*) ;;
      *) error_exit "Invalid remote path: $remote_path" ;;
    esac

    printf 'rm -f %s\n' "$(lftp_quote "$remote_path")"
    remove_commands=$((remove_commands + 1))
  done <<< "$remove_list"

  echo "bye"
} >> "$TMP_FTP_CMD"

[ "$upload_count" -eq 0 ] || [ "$upload_commands" -gt 0 ] ||
  error_exit "No upload commands were generated"

[ "$local_file_missing" -eq 0 ] || warn "Skipped $local_file_missing missing local files"

if ! lftp -f "$TMP_FTP_CMD"; then
  error_exit "File sync failed. Remote manifest was not updated; safe to retry."
fi

info "  Uploaded $upload_commands files, removed $remove_commands files"

echo ""
echo "[5/5] Finalizing deployment with manifest..."

generate_ftp_config "$TMP_FTP_CMD"

{
  printf 'lcd %s\n' "$(lftp_quote "$(pwd)")"
  printf 'put %s -o %s\n' \
    "$(lftp_quote "$TMP_LOCAL_MANIFEST")" \
    "$(lftp_quote "${FTP_REMOTE_BASE}/${MANIFEST_FILENAME}")"
  echo "bye"
} >> "$TMP_FTP_CMD"

if ! lftp -f "$TMP_FTP_CMD"; then
  error_exit "Manifest upload failed. Files were synced but manifest was not updated; safe to retry."
fi

echo ""
success "Deployment completed successfully!"
info "  Uploaded: $upload_commands files"
info "  Removed: $remove_commands files"
info "  Manifest updated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
