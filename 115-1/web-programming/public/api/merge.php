<?php

declare(strict_types=1);

/**
 * Counterpart to the auto-split logic in scripts/deploy-endpoint.php.
 *
 * Files over SPLIT_THRESHOLD_BYTES (see scripts/deploy-endpoint.php) get cut
 * into <file>.chunks/part-0000, part-0001, ... plus a <file>.split.json
 * manifest at deploy time. The rewrite rule in public/.htaccess sends
 * requests for the *original* path here instead of letting them 404, with
 * the original path in `path`. This script re-reads the chunks in order
 * and streams them back out so the response is byte-for-byte the original
 * file - the split is invisible to the client.
 *
 * Streams instead of concatenating in memory, and supports a single-range
 * `Range:` request, since the whole point is these files are too big to
 * hold comfortably in one request/response.
 *
 * Unlike the deploy endpoint, this one is deliberately public (no token, no
 * random URL) and lives under public/ like any other site file - it only
 * ever reads files already published here, the same thing a direct static
 * request would have done had the file not needed splitting.
 */

const READ_BUFFER_BYTES = 1_048_576;

function fail(int $status): never
{
  http_response_code($status);
  header('Content-Type: text/plain; charset=utf-8');
  echo match ($status) {
    404 => 'Not found',
    416 => 'Range not satisfiable',
    default => 'Error',
  };
  exit;
}

/**
 * Resolve $relative against $docRoot and make sure the result is actually
 * inside $docRoot (blocks `..` traversal, symlink escapes, etc).
 */
function resolveInsideDocRoot(string $docRoot, string $relative): ?string
{
  if ($relative === '' || str_contains($relative, "\0")) {
    return null;
  }

  $candidate = $docRoot . '/' . ltrim($relative, '/');
  $resolved = realpath($candidate);

  if ($resolved === false) {
    return null;
  }

  if (!str_starts_with($resolved, $docRoot . DIRECTORY_SEPARATOR)) {
    return null;
  }

  return $resolved;
}

/**
 * @param array{chunkDir: string, partSize: int, parts: int} $manifest
 */
function streamRange(array $manifest, string $chunkDirAbs, int $start, int $length): void
{
  $partSize = $manifest['partSize'];
  $partIndex = intdiv($start, $partSize);
  $offsetInPart = $start % $partSize;
  $remaining = $length;

  while ($remaining > 0 && $partIndex < $manifest['parts']) {
    $partPath = sprintf('%s/part-%04d', $chunkDirAbs, $partIndex);
    $handle = fopen($partPath, 'rb');
    if ($handle === false) {
      break;
    }

    if ($offsetInPart > 0) {
      fseek($handle, $offsetInPart);
    }

    while ($remaining > 0 && !feof($handle)) {
      $toRead = min(READ_BUFFER_BYTES, $remaining);
      $buf = fread($handle, $toRead);
      if ($buf === false || $buf === '') {
        break;
      }

      echo $buf;
      $remaining -= strlen($buf);
    }

    fclose($handle);
    $partIndex++;
    $offsetInPart = 0;
  }
}

function main(): void
{
  $docRoot = realpath(__DIR__ . '/..');
  if ($docRoot === false) {
    fail(404);
  }

  $requestedPath = $_GET['path'] ?? '';
  if (!is_string($requestedPath) || str_contains($requestedPath, '..')) {
    fail(404);
  }

  $manifestAbs = resolveInsideDocRoot($docRoot, ltrim($requestedPath, '/') . '.split.json');
  if ($manifestAbs === null || !is_file($manifestAbs)) {
    fail(404);
  }

  $manifestJson = file_get_contents($manifestAbs);
  $manifest = $manifestJson !== false ? json_decode($manifestJson, true) : null;

  if (
    !is_array($manifest)
    || !isset($manifest['size'], $manifest['partSize'], $manifest['parts'], $manifest['chunkDir'])
    || !is_int($manifest['size'])
    || !is_int($manifest['partSize'])
    || !is_int($manifest['parts'])
    || !is_string($manifest['chunkDir'])
    || $manifest['size'] < 0
    || $manifest['partSize'] <= 0
    || $manifest['parts'] <= 0
  ) {
    fail(404);
  }

  $chunkDirAbs = resolveInsideDocRoot($docRoot, $manifest['chunkDir']);
  if ($chunkDirAbs === null || !is_dir($chunkDirAbs)) {
    fail(404);
  }

  $size = $manifest['size'];
  $mime = is_string($manifest['mime'] ?? null) ? $manifest['mime'] : 'application/octet-stream';

  $start = 0;
  $length = $size;
  $status = 200;

  $rangeHeader = $_SERVER['HTTP_RANGE'] ?? null;
  if (is_string($rangeHeader) && preg_match('/^bytes=(\d*)-(\d*)$/', trim($rangeHeader), $m)) {
    $rangeStart = $m[1] === '' ? null : (int) $m[1];
    $rangeEnd = $m[2] === '' ? null : (int) $m[2];

    if ($rangeStart === null && $rangeEnd === null) {
      fail(416);
    }

    if ($rangeStart === null) {
      // suffix range: last N bytes
      $start = max(0, $size - $rangeEnd);
      $end = $size - 1;
    } else {
      $start = $rangeStart;
      $end = $rangeEnd ?? ($size - 1);
    }

    if ($start < 0 || $start >= $size || $end < $start) {
      fail(416);
    }

    $end = min($end, $size - 1);
    $length = $end - $start + 1;
    $status = 206;
  }

  http_response_code($status);
  header("Content-Type: {$mime}");
  header('Accept-Ranges: bytes');
  header("Content-Length: {$length}");
  header('Cache-Control: public, max-age=31536000, immutable');

  if ($status === 206) {
    header(sprintf('Content-Range: bytes %d-%d/%d', $start, $start + $length - 1, $size));
  }

  if (ob_get_level() > 0) {
    ob_end_clean();
  }

  streamRange($manifest, $chunkDirAbs, $start, $length);
}

main();
