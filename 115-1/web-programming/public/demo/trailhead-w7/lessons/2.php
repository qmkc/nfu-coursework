<?php
/**
 * 第 2 節：迴圈、陣列與函式（EX 11–20）
 * 每一題是一個函式：網址 ex/NN 由 index.php 呼叫對應的 exNN()，
 * 右邊的原始碼面板只擷取該題這一段（從 /** EX NN 開始到下一題之前）。
 */

/** EX 11 · for 迴圈 —— 知道次數時用 for，產生隊員編號 */
function ex11(): void
{
  $members = 12;
  ?>

  <p>這梯共有 <?= $members ?> 位隊員，依序發放編號：</p>

  <ul class="chips">
    <?php for ($i = 1; $i <= $members; $i++): ?>
      <li><span class="pill <?= $i === 1 ? 'pill-warn' : 'pill-brand' ?>">
          <?= sprintf('T%02d', $i) ?>     <?= $i === 1 ? ' · 領隊' : '' ?>
        </span></li>
    <?php endfor; ?>
  </ul>

  <?php
  // 一般寫法：迴圈裡用 echo 輸出
  $row = '';
  for ($km = 0; $km <= 10; $km += 2) {
    $row .= "{$km}K ";
  }
  ?>
  <p class="out-sub">每 2 公里一個里程樁</p>
  <pre class="raw"><?= trim($row) ?></pre>
  <?php
}

/** EX 12 · while 迴圈 —— 不知道要跑幾次，只知道什麼時候停 */
function ex12(): void
{
  $altitude = 2610;     // 塔塔加登山口
  $summit = 3952;       // 玉山主峰
  $climbPerHour = 150;  // 每小時爬升（含休息）
  $hour = 0;
  $log = [];

  while ($altitude < $summit) {
    $hour++;
    $altitude = min($altitude + $climbPerHour, $summit);
    $log[] = [$hour, $altitude];
  }

  // 經典練習：1 加到 100
  $sum = 0;
  $n = 1;
  while ($n <= 100) {
    $sum += $n;
    $n++;
  }
  ?>

  <p class="lead">從 2,610 公尺爬到 <?= number_format($summit) ?> 公尺，每小時 <?= $climbPerHour ?> 公尺，
    共需 <strong><?= $hour ?></strong> 小時。</p>

  <div class="bars">
    <?php foreach ($log as [$h, $alt]): ?>
      <div class="bar">
        <span>第 <?= $h ?> 小時</span>
        <span class="bar-track"><i class="<?= $alt === $summit ? 'is-max' : '' ?>"
            style="width: <?= round(($alt - 2400) / ($summit - 2400) * 100) ?>%"></i></span>
        <span><?= number_format($alt) ?></span>
      </div>
    <?php endforeach; ?>
  </div>

  <p class="out-sub">1 + 2 + … + 100 = <strong><?= $sum ?></strong></p>
  <?php
}

/** EX 13 · foreach 迴圈 —— 走訪陣列最常用的寫法 */
function ex13(): void
{
  $gear = ['頭燈＋備用電池', '雨衣雨褲', '保暖中層', '登山鞋', '行動糧', '2 公升飲水', '離線地圖', '急救包'];
  $weights = ['頭燈' => 120, '雨衣雨褲' => 450, '羽絨外套' => 380, '睡袋' => 1100];
  $total = 0;
  ?>

  <p class="out-sub">只要值：<code>foreach ($gear as $item)</code></p>
  <ul class="chips">
    <?php foreach ($gear as $item): ?>
      <li><span class="pill">☐ <?= $item ?></span></li>
    <?php endforeach; ?>
  </ul>

  <p class="out-sub">連 key 一起：<code>foreach ($weights as $name => $gram)</code></p>
  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>#</th>
          <th>裝備</th>
          <th class="num">重量</th>
        </tr>
      </thead>
      <tbody>
        <?php $i = 0; ?>
        <?php foreach ($weights as $name => $gram): ?>
          <?php $total += $gram; ?>
          <tr>
            <td><?= ++$i ?></td>
            <td><?= $name ?></td>
            <td class="num"><?= number_format($gram) ?> g</td>
          </tr>
        <?php endforeach; ?>
        <tr>
          <td></td>
          <td><strong>合計</strong></td>
          <td class="num"><strong><?= number_format($total / 1000, 2) ?> kg</strong></td>
        </tr>
      </tbody>
    </table>
  </div>
  <?php
}

/** EX 14 · 索引陣列 —— 從 0 開始編號的清單 */
function ex14(): void
{
  $peaks = ['玉山', '雪山', '合歡山北峰'];
  $before = $peaks;

  $peaks[] = '三叉山';                 // 加在最後
  array_push($peaks, '奇萊南峰');      // 一樣是加在最後
  array_unshift($peaks, '大霸尖山');   // 加在最前面

  $sorted = $peaks;
  sort($sorted);                       // sort() 直接改動原陣列，不回傳新陣列
  ?>

  <dl class="kv">
    <dt>原本</dt>
    <dd><code><?= h(json_encode($before, JSON_UNESCAPED_UNICODE)) ?></code></dd>
    <dt>新增後</dt>
    <dd><code><?= h(json_encode($peaks, JSON_UNESCAPED_UNICODE)) ?></code></dd>
    <dt>count()</dt>
    <dd><?= count($peaks) ?> 座</dd>
    <dt>$peaks[0]</dt>
    <dd><?= $peaks[0] ?></dd>
    <dt>最後一個</dt>
    <dd><?= $peaks[count($peaks) - 1] ?></dd>
    <dt>in_array('雪山')</dt>
    <dd><?= in_array('雪山', $peaks, true) ? 'true，有這座' : 'false' ?></dd>
    <dt>sort() 後</dt>
    <dd><code><?= h(json_encode($sorted, JSON_UNESCAPED_UNICODE)) ?></code></dd>
  </dl>

  <p class="out-sub">每一格的索引</p>
  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr><?php foreach ($peaks as $i => $_): ?>
            <th>[<?= $i ?>]</th><?php endforeach; ?>
        </tr>
      </thead>
      <tbody>
        <tr><?php foreach ($peaks as $peak): ?>
            <td><?= $peak ?></td><?php endforeach; ?>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="note">中文排序是依 UTF-8 編碼，不是筆畫或注音——需要的話可以改用 Collator（intl 擴充）。</p>
  <?php
}

/** EX 15 · 關聯陣列 —— 用有意義的名字當 key */
function ex15(): void
{
  $trail = [
    'name' => '雪山主東峰線',
    'peak' => '雪山主峰',
    'elevation' => 3886,
    'trailhead' => '雪山登山口',
    'days' => 2,
  ];

  $trail['hut'] = '三六九山莊';   // 新增一個 key
  $trail['days'] = 3;             // 覆寫既有的 key
  unset($trail['trailhead']);     // 刪除

  $labels = ['name' => '路線', 'peak' => '主峰', 'elevation' => '海拔', 'days' => '天數', 'hut' => '山屋'];
  ?>

  <h3 class="out-title"><?= $trail['name'] ?></h3>
  <dl class="kv">
    <?php foreach ($trail as $key => $value): ?>
      <dt><?= $labels[$key] ?? $key ?> <code><?= $key ?></code></dt>
      <dd><?= $value ?></dd>
    <?php endforeach; ?>
  </dl>

  <dl class="kv">
    <dt>array_keys()</dt>
    <dd><code><?= h(implode(', ', array_keys($trail))) ?></code></dd>
    <dt>isset($trail['hut'])</dt>
    <dd><?= var_export(isset($trail['hut']), true) ?></dd>
    <dt>isset($trail['trailhead'])</dt>
    <dd><?= var_export(isset($trail['trailhead']), true) ?>（已被 unset）</dd>
    <dt>$trail['permit'] ?? '免申請'</dt>
    <dd><?= $trail['permit'] ?? '免申請' ?></dd>
  </dl>
  <?php
}

/** EX 16 · 二維陣列 —— 陣列裡放關聯陣列，就是一張表 */
function ex16(): void
{
  // TRAILS 定義在 lib/trails.php，長這樣：
  // [ ['name' => '玉山主峰線', 'elevation' => 3952, ...], ['name' => '雪山主東峰線', ...], ... ]
  $trails = TRAILS;
  $badge = ['入門' => 'pill-ok', '中級' => 'pill-brand', '進階' => 'pill-bad'];
  ?>

  <p>共 <?= count($trails) ?> 條路線，第 2 條的主峰是 <code>$trails[1]['peak']</code> = <?= $trails[1]['peak'] ?>。</p>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>路線</th>
          <th>主峰</th>
          <th class="num">海拔</th>
          <th>地區</th>
          <th class="num">天數</th>
          <th class="num">里程</th>
          <th>難度</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($trails as $trail): ?>
          <tr>
            <td><strong><?= $trail['name'] ?></strong></td>
            <td><?= $trail['peak'] ?></td>
            <td class="num"><?= number_format($trail['elevation']) ?> m</td>
            <td><?= $trail['region'] ?></td>
            <td class="num"><?= $trail['days'] ?></td>
            <td class="num"><?= number_format($trail['distance'], 1) ?> km</td>
            <td><span class="pill <?= $badge[$trail['difficulty']] ?>"><?= $trail['difficulty'] ?></span></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}

/** EX 17 · 陣列統計 —— array_column() 抽欄位，再一行算完 */
function ex17(): void
{
  $elevations = array_column(TRAILS, 'elevation', 'peak');   // 主峰 => 海拔

  $sum = array_sum($elevations);
  $count = count($elevations);
  $avg = $sum / $count;
  $max = max($elevations);
  $min = min($elevations);
  $highest = array_search($max, $elevations, true);
  $lowest = array_search($min, $elevations, true);

  arsort($elevations);   // 依值由大到小排序，保留 key
  ?>

  <div class="stats">
    <div class="stat"><small>平均海拔</small><b><?= number_format($avg) ?> <small>m</small></b></div>
    <div class="stat"><small>最高 · <?= $highest ?></small><b><?= number_format($max) ?> <small>m</small></b></div>
    <div class="stat"><small>最低 · <?= $lowest ?></small><b><?= number_format($min) ?> <small>m</small></b></div>
    <div class="stat"><small>高低差</small><b><?= $max - $min ?> <small>m</small></b></div>
  </div>

  <p class="out-sub">由高到低（長條從 3,000 公尺起算）</p>
  <div class="bars">
    <?php foreach ($elevations as $peak => $m): ?>
      <div class="bar">
        <span><?= $peak ?></span>
        <span class="bar-track"><i class="<?= $m === $max ? 'is-max' : '' ?>"
            style="width: <?= round(($m - 3000) / ($max - 3000) * 100) ?>%"></i></span>
        <span><?= number_format($m) ?></span>
      </div>
    <?php endforeach; ?>
  </div>

  <p class="note">array_sum = <?= number_format($sum) ?>，count = <?= $count ?>，平均 = <?= round($avg, 2) ?>。</p>
  <?php
}

/** EX 18 · 字串函式 —— 處理使用者輸入前，先把字串整理乾淨 */
function ex18(): void
{
  $raw = '   玉山主峰 Yushan Main Peak   ';
  $name = trim($raw);
  $csv = '玉山,雪山,合歡山,嘉明湖';
  $peaks = explode(',', $csv);

  $rows = [
    ['trim($raw)', $name],
    ['strlen($name)', strlen($name) . ' bytes'],
    ['mb_strlen($name)', mb_strlen($name) . ' 個字'],
    ['mb_substr($name, 0, 4)', mb_substr($name, 0, 4)],
    ['strtoupper($name)', strtoupper($name)],
    ["str_contains(\$name, 'Peak')", var_export(str_contains($name, 'Peak'), true)],
    ["str_replace('主峰', '北峰', \$name)", str_replace('主峰', '北峰', $name)],
    ["str_pad('7', 3, '0', STR_PAD_LEFT)", str_pad('7', 3, '0', STR_PAD_LEFT)],
    ["explode(',', \$csv)", json_encode($peaks, JSON_UNESCAPED_UNICODE)],
    ["implode(' → ', \$peaks)", implode(' → ', $peaks)],
  ];
  ?>

  <p>原始字串（前後有空白）：<code>"<?= h($raw) ?>"</code></p>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>函式</th>
          <th>結果</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($rows as [$call, $result]): ?>
          <tr>
            <td><code><?= h($call) ?></code></td>
            <td><?= h($result) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <p class="note">strlen() 算的是 bytes：中文 4 個字 × 3 + 英文與空白 15 個 = 27。算「字數」一定要用 mb_strlen()。</p>
  <?php
}

/** EX 19 · 自訂函式 —— 把重複的計算收進函式 */
function ex19(): void
{
  /**
   * Naismith 法則估算步行時間：平地每小時 4 公里，每爬升 600 公尺再加 1 小時。
   */
  function estimate_hours(float $km, int $gain, float $speed = 4.0): float
  {
    return $km / $speed + $gain / 600;
  }

  function format_hours(float $hours): string
  {
    $h = (int) floor($hours);
    $m = (int) round(($hours - $h) * 60);
    return $m === 0 ? "{$h} 小時" : "{$h} 小時 {$m} 分";
  }

  $slow = estimate_hours(4.0, 452, 3.0);   // 第三個參數可以覆寫預設值
  ?>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>路線</th>
          <th class="num">里程</th>
          <th class="num">爬升</th>
          <th class="num">估計時間</th>
          <th class="num">每天</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach (TRAILS as $t): ?>
          <?php $hours = estimate_hours($t['distance'], $t['gain']); ?>
          <tr>
            <td><?= $t['name'] ?></td>
            <td class="num"><?= $t['distance'] ?> km</td>
            <td class="num"><?= number_format($t['gain']) ?> m</td>
            <td class="num"><strong><?= format_hours($hours) ?></strong></td>
            <td class="num"><?= format_hours($hours / $t['days']) ?></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <p>合歡北峰用比較慢的 3 km/h 估：<code>estimate_hours(4.0, 452, 3.0)</code> = <?= format_hours($slow) ?>。</p>
  <p class="note">Naismith 法則沒有算休息與高度適應的時間，實際行程通常要再多抓 30%～50%。</p>
  <?php
}

/** EX 20 · 日期與時間 —— 時區、格式化、計算兩個日期的差距 */
function ex20(): void
{
  $tz = new DateTimeZone('Asia/Taipei');
  $now = new DateTimeImmutable('now', $tz);
  $today = $now->setTime(0, 0);
  $weekdays = ['日', '一', '二', '三', '四', '五', '六'];

  function zh_date(DateTimeImmutable $d, array $weekdays): string
  {
    return $d->format('n/j') . '（' . $weekdays[(int) $d->format('w')] . '）';
  }
  ?>

  <dl class="kv">
    <dt>現在</dt>
    <dd><?= $now->format('Y-m-d H:i:s') ?>（<?= $tz->getName() ?>）</dd>
    <dt>今年第幾天</dt>
    <dd>第 <?= (int) $now->format('z') + 1 ?> 天</dd>
    <dt>一週後</dt>
    <dd><?= zh_date($today->modify('+7 days'), $weekdays) ?></dd>
  </dl>

  <p class="out-sub">梯次倒數</p>
  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>路線</th>
          <th>日期</th>
          <th class="num">天數</th>
          <th>狀態</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach (SESSIONS as $s): ?>
          <?php
          $start = new DateTimeImmutable($s['start'], $tz);
          $end = new DateTimeImmutable($s['end'], $tz);
          $diff = $today->diff($start);           // DateInterval
          $days = (int) $diff->format('%r%a');    // %r 帶正負號，%a 是總天數
          $length = $start->diff($end)->days + 1;
          ?>
          <tr>
            <td><?= trail_by_id($s['trail'])['name'] ?></td>
            <td><?= zh_date($start, $weekdays) ?><?= $length > 1 ? ' – ' . zh_date($end, $weekdays) : '' ?></td>
            <td class="num"><?= $length ?> 天</td>
            <td>
              <?php if ($days > 0): ?>
                <span class="pill pill-brand">還有 <?= $days ?> 天</span>
              <?php elseif ($days === 0): ?>
                <span class="pill pill-warn">今天出發</span>
              <?php else: ?>
                <span class="pill">已出發 <?= -$days ?> 天</span>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}
