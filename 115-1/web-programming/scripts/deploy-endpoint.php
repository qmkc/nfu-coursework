<?php

declare(strict_types=1);

/**
 * Source of the deploy control-plane endpoint. scripts/deploy.sh FTP-uploads
 * this file's contents under a freshly random filename to api/<random>.php
 * on the live site for the duration of a single deploy, then removes it -
 * so there's no guessable URL, and nothing to even scan for, once the
 * deploy finishes. It never lives under public/, so it's never copied into
 * out/ by `next build` and never shipped as a predictable /api/*.php path.
 *
 * This file self-destructs (unlink(__FILE__)) as the last thing it does on
 * the request that finishes a deploy (action=finalize or action=prune) -
 * that's the primary removal path, since it happens in the same request
 * with no extra network round-trip to forget. scripts/deploy.sh's own
 * cleanup trap is the fallback for every other way a deploy can end (a
 * failed chunk upload, a dropped connection, no changes to deploy at all),
 * removing the file over FTP instead when self-destruction never had a
 * chance to run.
 *
 * Every request must carry the shared secret from .deploy-state/secret.php
 * (bootstrapped once by hand/FTP - see README) in an `X-Deploy-Token`
 * header, checked with hash_equals(). Without that file this endpoint
 * refuses everything.
 *
 * .deploy-state/manifest.json tracks relative path => sha256 of every file
 * this endpoint currently owns, so deploy.sh can ask for it, diff it
 * against a fresh local build, and only transfer what actually changed.
 *
 * Protocol (all POST, multipart/form-data, token header required):
 *   action=manifest  -> { ok, manifest: { path: sha256, ... } }
 *   action=chunk      uploadId (sha256 of the zip), part, total, chunk (file)
 *                      - uploads one piece of a zip containing only the
 *                      changed/new files for this deploy
 *   action=finalize   uploadId, total, sha256, removed (JSON string array)
 *                      -> reassembles the zip, verifies its hash, extracts
 *                      it over the site (only touching the files it
 *                      contains), deletes every path listed in `removed`,
 *                      updates the manifest, responds { ok, written, removed }
 *   action=prune      removed (JSON string array, non-empty)
 *                      -> deletes those paths and updates the manifest with
 *                      no zip involved, for a deploy that only removed files
 *
 * uploadId doubles as the expected sha256 of the reassembled zip, so a
 * corrupt/incomplete upload is caught before anything touches the site.
 *
 * Any extracted file over SPLIT_THRESHOLD_BYTES is transparently cut into
 * <file>.chunks/part-0000, part-0001, ... plus a <file>.split.json
 * manifest, and the oversized original is deleted. public/.htaccess
 * rewrites GET requests for the original path to api/merge.php, which
 * streams the chunks back out so the split is invisible to visitors.
 */

const DEPLOY_STATE_DIR = __DIR__ . '/.deploy-state';
const MANIFEST_PATH = DEPLOY_STATE_DIR . '/manifest.json';
const PROTECTED_PREFIX = 'api/.deploy-state/';
const SPLIT_THRESHOLD_BYTES = 1 * 1024 * 1024; // files over this get auto-split
const SPLIT_PART_BYTES = 1 * 1024 * 1024;

/**
 * Thrown for any finalize failure *after* all chunks are confirmed present -
 * a corrupt/unsafe/unreadable upload that re-sending more chunks can't fix,
 * so the handler for this always deletes the upload dir before responding
 * instead of leaving orphaned chunks behind on a storage-constrained host.
 */
final class DeployError extends RuntimeException
{
    public function __construct(public readonly int $status, public readonly string $error)
    {
        parent::__construct($error);
    }
}

function respond(int $status, array $body): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body, JSON_UNESCAPED_SLASHES);
    exit;
}

function requireToken(): void
{
    $secretFile = DEPLOY_STATE_DIR . '/secret.php';
    if (!is_file($secretFile)) {
        respond(503, ['ok' => false, 'error' => 'deploy endpoint not configured']);
    }

    require $secretFile;
    if (!defined('DEPLOY_TOKEN') || !is_string(DEPLOY_TOKEN) || DEPLOY_TOKEN === '') {
        respond(503, ['ok' => false, 'error' => 'deploy endpoint not configured']);
    }

    $given = $_SERVER['HTTP_X_DEPLOY_TOKEN'] ?? '';
    if (!is_string($given) || !hash_equals(DEPLOY_TOKEN, $given)) {
        respond(403, ['ok' => false, 'error' => 'forbidden']);
    }
}

function isValidUploadId(mixed $value): bool
{
    return is_string($value) && preg_match('/^[0-9a-f]{64}$/', $value) === 1;
}

function positiveInt(mixed $value): ?int
{
    if (!is_string($value) && !is_int($value)) {
        return null;
    }

    if (!preg_match('/^\d+$/', (string) $value)) {
        return null;
    }

    $int = (int) $value;

    return $int > 0 ? $int : null;
}

/**
 * Relative paths from the client must stay inside the site and must never
 * touch this endpoint's own state - applies both to zip entry names and to
 * the `removed` list, which is otherwise just client-supplied strings.
 */
function isSafeRelativePath(string $name): bool
{
    return $name !== ''
        && !str_contains($name, '..')
        && !str_starts_with($name, '/')
        && !str_contains($name, "\0")
        && !str_starts_with($name, PROTECTED_PREFIX)
        && $name !== rtrim(PROTECTED_PREFIX, '/');
}

function loadManifest(): array
{
    if (!is_file(MANIFEST_PATH)) {
        return [];
    }

    $decoded = json_decode((string) file_get_contents(MANIFEST_PATH), true);

    return is_array($decoded) ? $decoded : [];
}

function saveManifest(array $manifest): void
{
    if (!is_dir(DEPLOY_STATE_DIR) && !mkdir(DEPLOY_STATE_DIR, 0755, true)) {
        throw new DeployError(500, 'could not create deploy-state directory');
    }

    file_put_contents(MANIFEST_PATH, json_encode((object) $manifest, JSON_UNESCAPED_SLASHES));
}

/**
 * @return string[] validated, deduplicated relative paths
 */
function decodeRemovedList(mixed $raw): array
{
    $decoded = is_string($raw) ? json_decode($raw, true) : null;
    if (!is_array($decoded)) {
        throw new DeployError(400, 'invalid removed list');
    }

    $paths = [];
    foreach ($decoded as $path) {
        if (!is_string($path) || !isSafeRelativePath($path)) {
            throw new DeployError(400, 'invalid path in removed list');
        }
        $paths[$path] = true;
    }

    return array_keys($paths);
}

function uploadDir(string $uploadId): string
{
    return DEPLOY_STATE_DIR . "/uploads/{$uploadId}";
}

function removeDirRecursive(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }

    $items = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($items as $item) {
        $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
    }

    rmdir($dir);
}

function pruneEmptyDirsUpTo(string $docRoot, string $dir): void
{
    while ($dir !== $docRoot && str_starts_with($dir, $docRoot . DIRECTORY_SEPARATOR) && is_dir($dir)) {
        $entries = scandir($dir);
        if ($entries === false || count($entries) > 2) {
            break;
        }

        rmdir($dir);
        $dir = dirname($dir);
    }
}

function handleManifest(): never
{
    respond(200, ['ok' => true, 'manifest' => (object) loadManifest()]);
}

function handleChunk(): never
{
    $uploadId = $_POST['uploadId'] ?? '';
    // part is 0-indexed, so this (not positiveInt()) is what allows part=0.
    $part = isset($_POST['part']) && preg_match('/^\d+$/', (string) $_POST['part']) ? (int) $_POST['part'] : null;
    $total = positiveInt($_POST['total'] ?? null);

    if (!isValidUploadId($uploadId) || $part === null || $part < 0 || $total === null || $part >= $total) {
        respond(400, ['ok' => false, 'error' => 'invalid uploadId/part/total']);
    }

    if (!isset($_FILES['chunk']) || !is_uploaded_file($_FILES['chunk']['tmp_name'])) {
        respond(400, ['ok' => false, 'error' => 'missing chunk upload']);
    }

    $dir = uploadDir($uploadId);
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        respond(500, ['ok' => false, 'error' => 'could not create upload directory']);
    }

    $partPath = sprintf('%s/part-%04d', $dir, $part);
    if (!move_uploaded_file($_FILES['chunk']['tmp_name'], $partPath)) {
        respond(500, ['ok' => false, 'error' => 'could not store chunk']);
    }

    $received = count(glob("{$dir}/part-*") ?: []);

    respond(200, ['ok' => true, 'received' => $received]);
}

/**
 * Caller must have already confirmed all $total parts are on disk - this
 * only covers failures that mean the upload itself is bad (so throws, to be
 * cleaned up by the caller) rather than "still waiting on more chunks".
 */
function reassembleZip(string $uploadId, int $total, string $expectedSha256): string
{
    $dir = uploadDir($uploadId);
    $parts = glob($dir . '/part-*') ?: [];
    sort($parts);

    $tmpZipPath = "{$dir}/assembled.zip";
    $out = fopen($tmpZipPath, 'wb');
    if ($out === false) {
        throw new DeployError(500, 'could not create temp zip');
    }

    $hashCtx = hash_init('sha256');
    foreach ($parts as $partPath) {
        $in = fopen($partPath, 'rb');
        if ($in === false) {
            fclose($out);
            throw new DeployError(500, 'could not read chunk');
        }

        while (!feof($in)) {
            $buf = fread($in, 1_048_576);
            if ($buf === false || $buf === '') {
                break;
            }
            fwrite($out, $buf);
            hash_update($hashCtx, $buf);
        }
        fclose($in);
    }
    fclose($out);

    $actualSha256 = hash_final($hashCtx);
    if (!hash_equals($uploadId, $actualSha256) || !hash_equals($expectedSha256, $actualSha256)) {
        throw new DeployError(400, 'sha256 mismatch after reassembly');
    }

    return $tmpZipPath;
}

/**
 * @return array{written: string[], hashes: array<string, string>}
 */
function extractZip(string $zipPath, string $docRoot): array
{
    if (!class_exists('ZipArchive')) {
        throw new DeployError(500, 'ext-zip not available on this server');
    }

    $zip = new ZipArchive();
    if ($zip->open($zipPath) !== true) {
        throw new DeployError(400, 'could not open zip');
    }

    try {
        $written = [];
        $hashes = [];

        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            if ($stat === false) {
                continue;
            }

            $name = $stat['name'];

            if (str_ends_with($name, '/')) {
                continue; // directory entry
            }

            if (!isSafeRelativePath($name)) {
                throw new DeployError(400, "unsafe or protected zip entry: {$name}");
            }

            $targetPath = "{$docRoot}/{$name}";
            $targetDir = dirname($targetPath);
            if (!is_dir($targetDir) && !mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
                throw new DeployError(500, "could not create directory for {$name}");
            }

            $stream = $zip->getStream($name);
            $out = $stream !== false ? fopen($targetPath, 'wb') : false;

            if ($stream === false || $out === false) {
                if ($stream !== false) {
                    fclose($stream);
                }
                throw new DeployError(500, "could not write {$name}");
            }

            stream_copy_to_stream($stream, $out);
            fclose($stream);
            fclose($out);

            $hash = hash_file('sha256', $targetPath);
            if ($hash === false) {
                throw new DeployError(500, "could not hash {$name}");
            }

            $written[] = $name;
            $hashes[$name] = $hash;
        }
    } finally {
        $zip->close();
    }

    return ['written' => $written, 'hashes' => $hashes];
}

/**
 * @return array{manifest: string, chunkDir: string} relative paths (not absolute)
 */
function splitPathsFor(string $relativePath): array
{
    return [
        'manifest' => "{$relativePath}.split.json",
        'chunkDir' => "{$relativePath}.chunks",
    ];
}

function mimeTypeFor(string $absPath): string
{
    if (function_exists('mime_content_type')) {
        $mime = @mime_content_type($absPath);
        if (is_string($mime) && $mime !== '') {
            return $mime;
        }
    }

    return 'application/octet-stream';
}

/**
 * Cuts $relativePath into SPLIT_PART_BYTES chunks + a .split.json manifest
 * when it's over SPLIT_THRESHOLD_BYTES, deleting the oversized original so
 * it never has to be stored as a single huge file. If the file is at/under
 * the threshold, instead clears out any split artifacts left behind by a
 * previous deploy where this same path used to be oversized - otherwise the
 * rewrite rule in public/.htaccess would keep serving the stale chunked
 * version instead of this plain file.
 */
function splitFileIfLarge(string $docRoot, string $relativePath): void
{
    $absPath = "{$docRoot}/{$relativePath}";
    $size = filesize($absPath);
    ['manifest' => $manifestRel, 'chunkDir' => $chunkDirRel] = splitPathsFor($relativePath);
    $manifestAbs = "{$docRoot}/{$manifestRel}";
    $chunkDirAbs = "{$docRoot}/{$chunkDirRel}";

    if ($size === false || $size <= SPLIT_THRESHOLD_BYTES) {
        if (is_file($manifestAbs)) {
            unlink($manifestAbs);
        }
        removeDirRecursive($chunkDirAbs);

        return;
    }

    $mime = mimeTypeFor($absPath);

    if (!is_dir($chunkDirAbs) && !mkdir($chunkDirAbs, 0755, true) && !is_dir($chunkDirAbs)) {
        throw new DeployError(500, "could not create chunk directory for {$relativePath}");
    }

    $in = fopen($absPath, 'rb');
    if ($in === false) {
        throw new DeployError(500, "could not read {$relativePath} for splitting");
    }

    $parts = 0;
    while (!feof($in)) {
        $buf = fread($in, SPLIT_PART_BYTES);
        if ($buf === false) {
            fclose($in);
            throw new DeployError(500, "read error while splitting {$relativePath}");
        }
        if ($buf === '') {
            break;
        }

        $partPath = sprintf('%s/part-%04d', $chunkDirAbs, $parts);
        if (file_put_contents($partPath, $buf) === false) {
            fclose($in);
            throw new DeployError(500, "could not write chunk for {$relativePath}");
        }

        $parts++;
    }
    fclose($in);

    file_put_contents($manifestAbs, json_encode([
        'size' => $size,
        'partSize' => SPLIT_PART_BYTES,
        'parts' => $parts,
        'chunkDir' => $chunkDirRel,
        'mime' => $mime,
    ], JSON_UNESCAPED_SLASHES));

    unlink($absPath);
}

/**
 * Deletes a path this deploy state owns, whether it's currently stored as a
 * plain file or (because it was over SPLIT_THRESHOLD_BYTES at some point) as
 * split chunks + a manifest.
 */
function removeManagedPath(string $docRoot, string $relativePath): void
{
    $absolute = "{$docRoot}/{$relativePath}";
    $resolved = realpath($absolute);

    if ($resolved !== false && str_starts_with($resolved, $docRoot . DIRECTORY_SEPARATOR) && is_file($resolved)) {
        unlink($resolved);
        pruneEmptyDirsUpTo($docRoot, dirname($resolved));

        return;
    }

    ['manifest' => $manifestRel, 'chunkDir' => $chunkDirRel] = splitPathsFor($relativePath);

    $manifestResolved = realpath("{$docRoot}/{$manifestRel}");
    if ($manifestResolved !== false && str_starts_with($manifestResolved, $docRoot . DIRECTORY_SEPARATOR) && is_file($manifestResolved)) {
        unlink($manifestResolved);
    }

    $chunkDirResolved = realpath("{$docRoot}/{$chunkDirRel}");
    if ($chunkDirResolved !== false && str_starts_with($chunkDirResolved, $docRoot . DIRECTORY_SEPARATOR) && is_dir($chunkDirResolved)) {
        removeDirRecursive($chunkDirResolved);
    }

    pruneEmptyDirsUpTo($docRoot, dirname($absolute));
}

function resolveDocRoot(): string
{
    $docRoot = realpath(__DIR__ . '/..');
    if ($docRoot === false) {
        respond(500, ['ok' => false, 'error' => 'could not resolve doc root']);
    }

    return $docRoot;
}

function handlePrune(): never
{
    try {
        $removed = decodeRemovedList($_POST['removed'] ?? null);
    } catch (DeployError $e) {
        respond($e->status, ['ok' => false, 'error' => $e->error]);
    }

    if ($removed === []) {
        respond(400, ['ok' => false, 'error' => 'removed list must not be empty']);
    }

    $docRoot = resolveDocRoot();

    $manifest = loadManifest();
    foreach ($removed as $relativePath) {
        removeManagedPath($docRoot, $relativePath);
        unset($manifest[$relativePath]);
    }
    saveManifest($manifest);

    @unlink(__FILE__);
    respond(200, ['ok' => true, 'removed' => count($removed)]);
}

function handleFinalize(): never
{
    $uploadId = $_POST['uploadId'] ?? '';
    $total = positiveInt($_POST['total'] ?? null);
    $sha256 = $_POST['sha256'] ?? '';

    if (!isValidUploadId($uploadId) || $total === null || !isValidUploadId($sha256)) {
        respond(400, ['ok' => false, 'error' => 'invalid uploadId/total/sha256']);
    }

    try {
        $removed = decodeRemovedList($_POST['removed'] ?? '[]');
    } catch (DeployError $e) {
        respond($e->status, ['ok' => false, 'error' => $e->error]);
    }

    @set_time_limit(120);

    $docRoot = resolveDocRoot();

    $dir = uploadDir($uploadId);
    $partCount = count(glob("{$dir}/part-*") ?: []);
    if ($partCount !== $total) {
        // Still waiting on chunks - leave what's there alone so the client can resume.
        respond(400, ['ok' => false, 'error' => sprintf('expected %d part(s), found %d', $total, $partCount)]);
    }

    // From here on the upload is complete but may be corrupt/unsafe; any
    // failure means a retry has to re-upload from scratch anyway, so clean
    // up rather than leaving orphaned chunks on disk.
    try {
        $tmpZipPath = reassembleZip($uploadId, $total, $sha256);
        $result = extractZip($tmpZipPath, $docRoot);

        foreach ($result['written'] as $relativePath) {
            splitFileIfLarge($docRoot, $relativePath);
        }
    } catch (DeployError $e) {
        removeDirRecursive($dir);
        respond($e->status, ['ok' => false, 'error' => $e->error]);
    }

    $manifest = loadManifest();
    foreach ($result['hashes'] as $relativePath => $hash) {
        $manifest[$relativePath] = $hash;
    }
    foreach ($removed as $relativePath) {
        removeManagedPath($docRoot, $relativePath);
        unset($manifest[$relativePath]);
    }
    saveManifest($manifest);

    removeDirRecursive(uploadDir($uploadId));

    @unlink(__FILE__);
    respond(200, ['ok' => true, 'written' => count($result['written']), 'removed' => count($removed)]);
}

function main(): void
{
    requireToken();

    $action = $_POST['action'] ?? '';

    match ($action) {
        'manifest' => handleManifest(),
        'chunk' => handleChunk(),
        'finalize' => handleFinalize(),
        'prune' => handlePrune(),
        default => respond(400, ['ok' => false, 'error' => 'unknown action']),
    };
}

main();
