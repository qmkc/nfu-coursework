#!/usr/bin/env bash

set -euo pipefail
umask 077

FTP_HOST="${FTP_HOST:-}"
FTP_USER="${FTP_USER:-}"
FTP_PASS="${FTP_PASS:-}"
FTP_REMOTE_BASE="/htdocs"
MANIFEST_FILENAME=".deploy-manifest"

TMP_LOCAL_MANIFEST=$(mktemp ./.tmp.manifest.local.XXXXXX)
TMP_REMOTE_MANIFEST=$(mktemp ./.tmp.manifest.remote.XXXXXX)
TMP_UPLOAD_LIST=$(mktemp ./.tmp.upload-list.XXXXXX)
TMP_REMOVE_LIST=$(mktemp ./.tmp.remove-list.XXXXXX)
TMP_FTP_CMD=$(mktemp ./.tmp.ftp-cmd.XXXXXX)

cleanup() {
  local exit_code=$?
  rm -f "${TMP_LOCAL_MANIFEST}" "${TMP_REMOTE_MANIFEST}" \
  "${TMP_UPLOAD_LIST}" "${TMP_REMOVE_LIST}" "${TMP_FTP_CMD}"
  return $exit_code
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

if [ -z "$FTP_HOST" ]; then
  error_exit "FTP_HOST not set. Usage: FTP_HOST=... FTP_USER=... FTP_PASS=... ./scripts/ftp-deploy.sh"
fi

if [ -z "$FTP_USER" ]; then
  error_exit "FTP_USER not set. Usage: FTP_HOST=... FTP_USER=... FTP_PASS=... ./scripts/ftp-deploy.sh"
fi

if [ -z "$FTP_PASS" ]; then
  error_exit "FTP_PASS not set. Usage: FTP_HOST=... FTP_USER=... FTP_PASS=... ./scripts/ftp-deploy.sh"
fi

if [ ! -d "dist" ]; then
  error_exit "dist directory not found. Please build your project first."
fi

if [ ! "$(find dist -type f 2>/dev/null | wc -l)" -gt 0 ]; then
  error_exit "dist directory is empty. Please build your project first."
fi

generate_ftp_config() {
  local cmd_file="$1"
  : > "$cmd_file"
  cat >> "$cmd_file" << EOF
set ssl:verify-certificate false
set net:max-retries 2
set net:timeout 10
set xfer:clobber on
open ${FTP_HOST}
user ${FTP_USER} ${FTP_PASS}
EOF
}

echo ""
echo "[1/5] Generating local manifest..."

: > "${TMP_LOCAL_MANIFEST}"
file_count=0

while IFS= read -r -d '' local_file; do
  relative_path="${local_file#dist/}"
  remote_path="${FTP_REMOTE_BASE}/${relative_path}"
  
  hash=$(sha256sum -- "$local_file" | awk '{print $1}') || error_exit "Failed to hash $local_file"
  [ -n "$hash" ] || error_exit "Failed to hash $local_file"
  
  printf '%s\t%s\n' "$remote_path" "$hash" >> "${TMP_LOCAL_MANIFEST}"
  file_count=$((file_count + 1))
done < <(find dist -type f -print0 2>/dev/null | LC_ALL=C sort -z)

LC_ALL=C sort -o "${TMP_LOCAL_MANIFEST}" "${TMP_LOCAL_MANIFEST}"

info "  Found $file_count files in build output"

if [ "$file_count" -eq 0 ]; then
  error_exit "No files found in dist directory"
fi

echo ""
echo "[2/5] Downloading remote manifest..."

: > "${TMP_REMOTE_MANIFEST}"

generate_ftp_config "${TMP_FTP_CMD}"
cat >> "${TMP_FTP_CMD}" << EOF
get ${FTP_REMOTE_BASE}/${MANIFEST_FILENAME} -o ${TMP_REMOTE_MANIFEST}
bye
EOF

remote_manifest_exists=false
if lftp -f "${TMP_FTP_CMD}" > /dev/null 2>&1; then
  remote_manifest_exists=true
  info "  Remote manifest found"
else
  warn "No remote manifest found (assuming first deployment)"
fi

if [ ! -s "${TMP_REMOTE_MANIFEST}" ]; then
  : > "${TMP_REMOTE_MANIFEST}"
fi

echo ""
echo "[3/5] Computing file differences..."

: > "${TMP_UPLOAD_LIST}"
: > "${TMP_REMOVE_LIST}"

if [ "$remote_manifest_exists" = true ] && [ -s "${TMP_REMOTE_MANIFEST}" ]; then
  if comm -23 <(LC_ALL=C sort "${TMP_LOCAL_MANIFEST}") \
  <(LC_ALL=C sort "${TMP_REMOTE_MANIFEST}") \
  | cut -f1 > "${TMP_UPLOAD_LIST}"; then
    changed_count=$(wc -l < "${TMP_UPLOAD_LIST}")
    info "  Found $changed_count changed/new files"
  else
    warn "Failed to compute differences, will upload all files"
    cut -f1 < "${TMP_LOCAL_MANIFEST}" > "${TMP_UPLOAD_LIST}"
  fi
  
  if comm -23 <(cut -f1 "${TMP_REMOTE_MANIFEST}" | LC_ALL=C sort -u) \
  <(cut -f1 "${TMP_LOCAL_MANIFEST}" | LC_ALL=C sort -u) \
  > "${TMP_REMOVE_LIST}"; then
    removed_count=$(wc -l < "${TMP_REMOVE_LIST}")
    info "  Found $removed_count files removed locally"
  else
    warn "Failed to compute removed files, skipping remote cleanup"
    : > "${TMP_REMOVE_LIST}"
  fi
else
  cut -f1 < "${TMP_LOCAL_MANIFEST}" > "${TMP_UPLOAD_LIST}"
  info "  First deployment: will upload all $file_count files"
fi

if [ ! -s "${TMP_UPLOAD_LIST}" ] && [ ! -s "${TMP_REMOVE_LIST}" ]; then
  echo ""
  success "No changes detected - remote is already synchronized"
  exit 0
fi

upload_count=$(wc -l < "${TMP_UPLOAD_LIST}")
removed_count=$(wc -l < "${TMP_REMOVE_LIST}")

if [ "$upload_count" -gt 0 ]; then
  info "  Will upload $upload_count files:"
  head -5 "${TMP_UPLOAD_LIST}" | sed 's/^/      /'
  [ "$upload_count" -gt 5 ] && info "      ... and $((upload_count - 5)) more"
fi

if [ "$removed_count" -gt 0 ]; then
  info "  Will remove $removed_count files from remote:"
  head -5 "${TMP_REMOVE_LIST}" | sed 's/^/      /'
  [ "$removed_count" -gt 5 ] && info "      ... and $((removed_count - 5)) more"
fi

echo ""
echo "[4/5] Syncing files to ${FTP_HOST}..."

generate_ftp_config "${TMP_FTP_CMD}"

local_file_missing=0
upload_commands=0
remove_commands=0

{
  echo "lcd $(pwd)"
  
  while IFS= read -r remote_path; do
    [ -z "$remote_path" ] && continue
    
    local_path="dist${remote_path#"${FTP_REMOTE_BASE}"}"
    
    if [ ! -f "$local_path" ]; then
      warn "Local file missing: $local_path (skipping)"
      local_file_missing=$((local_file_missing + 1))
      continue
    fi
    
    printf 'put "%s" -o "%s"\n' "$local_path" "$remote_path"
    upload_commands=$((upload_commands + 1))
  done < "${TMP_UPLOAD_LIST}"
  
  while IFS= read -r remote_path; do
    [ -z "$remote_path" ] && continue
    printf 'rm -f "%s"\n' "$remote_path"
    remove_commands=$((remove_commands + 1))
  done < "${TMP_REMOVE_LIST}"
  
  echo "bye"
} >> "${TMP_FTP_CMD}"

if [ "$local_file_missing" -gt 0 ]; then
  warn "Skipped $local_file_missing missing local files"
fi

if ! lftp -f "${TMP_FTP_CMD}"; then
  error_exit "File sync failed - deployment interrupted. Remote manifest not updated, safe to retry."
fi

info "  Uploaded $upload_commands files, removed $remove_commands files"

echo ""
echo "[5/5] Finalizing deployment with manifest..."

generate_ftp_config "${TMP_FTP_CMD}"
{
  echo "lcd $(pwd)"
  printf 'put "%s" -o "%s"\n' "${TMP_LOCAL_MANIFEST}" "${FTP_REMOTE_BASE}/${MANIFEST_FILENAME}"
  echo "bye"
} >> "${TMP_FTP_CMD}"

if ! lftp -f "${TMP_FTP_CMD}"; then
  error_exit "Manifest upload failed - files synced but manifest not updated. Safe to retry (will resume from checkpoint)."
fi

echo ""
success "Deployment completed successfully!"
info "  Uploaded: $upload_count files"
info "  Removed: $removed_count files"
info "  Manifest updated: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""
