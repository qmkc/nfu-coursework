<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
  'ok' => true,
  'time' => gmdate('Y-m-d\TH:i:s\Z'),
], JSON_UNESCAPED_SLASHES);
