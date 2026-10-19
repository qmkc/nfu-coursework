<?php
/**
 * 第 1 節：PHP 基本語法與條件判斷（EX 01–10）
 * 每一題是一個函式：網址 ex/NN 由 index.php 呼叫對應的 exNN()，
 * 右邊的原始碼面板只擷取該題這一段（從 /** EX NN 開始到下一題之前）。
 */

/** EX 01 · PHP 基本結構與輸出 —— echo、print 與 <?= ?> 短標籤 */
function ex01(): void
{
  // 一行敘述以分號結束；echo 可以一次輸出好幾段
  echo '<p class="lead">歡迎來到山行 Trailhead！</p>';
  echo '<p>今天的目的地：', '合歡北峰', '。</p>';

  print '<p>print 也能輸出，但一次只能一個參數。</p>';
  ?>

  <!-- 只想印出一個值時，用短標籤就好 -->
  <p>海拔：<strong><?= 3422 ?></strong> 公尺</p>

  <p class="note">PHP 標籤外面的 HTML 會原封不動送出；標籤裡的程式在伺服器上執行完，只留下它 echo 出來的文字。</p>
  <?php
}

/** EX 02 · PHP 與 HTML 混合 —— 先準備資料，再把資料插進 HTML */
function ex02(): void
{
  $pageTitle = '本週推薦路線';
  $trail = '嘉明湖';
  $today = date('Y/m/d');
  $hour = (int) date('G');
  $greeting = $hour < 12 ? '早安' : ($hour < 18 ? '午安' : '晚安');
  ?>

  <h3 class="out-title"><?= $pageTitle ?>：<?= $trail ?></h3>
  <p><?= $greeting ?>，今天是 <?= $today ?>，伺服器時間 <?= date('H:i:s') ?>。</p>
  <p>天使的眼淚——<?= $trail ?>，三天兩夜，適合第一次挑戰過夜行程的你。</p>

  <p class="note">重新整理一次，時間會跟著變：這段 HTML 每次都是伺服器重新產生的。</p>
  <?php
}

/** EX 03 · 變數與資料型態 —— string、int、float、bool、null */
function ex03(): void
{
  $peak = '玉山主峰';     // string 字串
  $elevation = 3952;      // int 整數
  $distance = 21.8;       // float 浮點數
  $needPermit = true;     // bool 布林
  $leader = null;         // null 還沒有值

  $vars = compact('peak', 'elevation', 'distance', 'needPermit', 'leader');
  ?>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>變數</th>
          <th>gettype()</th>
          <th>var_export()</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($vars as $name => $value): ?>
          <tr>
            <td><code>$<?= $name ?></code></td>
            <td><span class="pill pill-brand"><?= gettype($value) ?></span></td>
            <td><code><?= h(var_export($value, true)) ?></code></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <p class="out-sub">var_dump() 會連型態、長度一起印出來（中文一個字佔 3 bytes）：</p>
  <?= dump($peak) ?>
  <?= dump($distance) ?>

  <p class="note">echo true 會印出 1，echo false 什麼都不印——要看布林值，請用 var_dump()。</p>
  <?php
}

/** EX 04 · 常數 —— const、define() 與 defined() */
const BAIYUE_MIN = 3000;            // 百岳門檻：編譯期就決定
function ex04(): void
{
  define('MAX_TEAM', 12);             // 執行期決定，可以放在 if 裡
  define('PERMIT_DAYS', 30 + 7);      // 值可以是運算結果

  $elevation = 3422;
  ?>

  <dl class="kv">
    <dt>BAIYUE_MIN</dt>
    <dd><?= BAIYUE_MIN ?> 公尺</dd>
    <dt>MAX_TEAM</dt>
    <dd><?= MAX_TEAM ?> 人</dd>
    <dt>PERMIT_DAYS</dt>
    <dd>出發前 <?= PERMIT_DAYS ?> 天開放申請</dd>
  </dl>

  <p>合歡北峰 <?= $elevation ?> 公尺，
    <?= $elevation >= BAIYUE_MIN ? '<span class="pill pill-ok">算百岳</span>' : '<span class="pill">不算百岳</span>' ?>
  </p>

  <dl class="kv">
    <dt>defined('MAX_TEAM')</dt>
    <dd><?= var_export(defined('MAX_TEAM'), true) ?></dd>
    <dt>defined('NO_SUCH')</dt>
    <dd><?= var_export(defined('NO_SUCH'), true) ?></dd>
  </dl>

  <p class="note">PHP 也內建 PHP_VERSION、PHP_OS_FAMILY 這類常數，但它們會透露伺服器的版本與作業系統，
    方便攻擊者找對應的漏洞，所以正式網站不要把它們印在頁面上。</p>
  <?php
}

/** EX 05 · 字串串接與插值 —— 單引號、雙引號、點號、heredoc、sprintf() */
function ex05(): void
{
  $peak = '雪山主峰';
  $elevation = 3886;
  $trail = ['days' => 2, 'distance' => 21.8];

  $a = $peak . ' 海拔 ' . $elevation . ' 公尺';               // 點號串接
  $b = "$peak 海拔 $elevation 公尺";                          // 雙引號直接代入
  $c = '$peak 海拔 $elevation 公尺';                          // 單引號原樣輸出
  $d = "行程 {$trail['days']} 天、{$trail['distance']} 公里";  // 陣列要加大括號
  $e = sprintf('%s｜%s m｜%.1f km', $peak, number_format($elevation), $trail['distance']);

  $f = <<<TEXT
    從{$peak}登山口出發，
    {$trail['days']} 天來回 {$trail['distance']} 公里。
    TEXT;
  ?>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>寫法</th>
          <th>結果</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>點號 <code>.</code></td>
          <td><?= h($a) ?></td>
        </tr>
        <tr>
          <td>雙引號 <code>"…"</code></td>
          <td><?= h($b) ?></td>
        </tr>
        <tr>
          <td>單引號 <code>'…'</code></td>
          <td><?= h($c) ?></td>
        </tr>
        <tr>
          <td>大括號 <code>{$arr['k']}</code></td>
          <td><?= h($d) ?></td>
        </tr>
        <tr>
          <td><code>sprintf()</code></td>
          <td><?= h($e) ?></td>
        </tr>
      </tbody>
    </table>
  </div>

  <p class="out-sub">heredoc（多行字串，可代入變數）</p>
  <pre class="raw"><?= h($f) ?></pre>
  <?php
}

/** EX 06 · 數學運算 —— 四則運算、餘數、次方與四捨五入 */
function ex06(): void
{
  $distance = 26.0;   // 嘉明湖來回公里數
  $days = 3;
  $gain = 1176;       // 累積爬升（公尺）
  $members = 13;
  $groupSize = 4;

  $perDay = $distance / $days;
  $gradient = $gain / ($distance / 2 * 1000) * 100;          // 去程的平均坡度 %
  $groups = intdiv($members, $groupSize);
  $left = $members % $groupSize;
  $pressure = 1013 * (1 - 0.0065 * 3496 / 288.15) ** 5.255;  // 估算山頂氣壓
  ?>

  <div class="stats">
    <div class="stat"><small>每日平均</small><b><?= round($perDay, 1) ?> <small>km</small></b></div>
    <div class="stat"><small>平均坡度</small><b><?= number_format($gradient, 1) ?> <small>%</small></b></div>
    <div class="stat"><small>山頂氣壓</small><b><?= round($pressure) ?> <small>hPa</small></b></div>
  </div>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>運算</th>
          <th>程式</th>
          <th class="num">結果</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>除法</td>
          <td><code>$distance / $days</code></td>
          <td class="num"><?= $perDay ?></td>
        </tr>
        <tr>
          <td>整數除法</td>
          <td><code>intdiv($members, $groupSize)</code></td>
          <td class="num"><?= $groups ?></td>
        </tr>
        <tr>
          <td>取餘數</td>
          <td><code>$members % $groupSize</code></td>
          <td class="num"><?= $left ?></td>
        </tr>
        <tr>
          <td>次方</td>
          <td><code>2 ** 10</code></td>
          <td class="num"><?= 2 ** 10 ?></td>
        </tr>
        <tr>
          <td>四捨五入</td>
          <td><code>round(8.666, 1)</code></td>
          <td class="num"><?= round(8.666, 1) ?></td>
        </tr>
        <tr>
          <td>無條件進位</td>
          <td><code>ceil($members / $groupSize)</code></td>
          <td class="num"><?= ceil($members / $groupSize) ?></td>
        </tr>
      </tbody>
    </table>
  </div>

  <p><?= $members ?> 位隊員每 <?= $groupSize ?> 人一組：可分 <strong><?= $groups ?></strong> 組，
    剩下 <strong><?= $left ?></strong> 人<?= $left > 0 ? '要併入其他組' : '' ?>。</p>
  <?php
}

/** EX 07 · 比較與邏輯運算 —— == 與 === 的差別、&& || !、<=> */
function ex07(): void
{
  $cases = [
    ["'3952' == 3952", '3952' == 3952],
    ["'3952' === 3952", '3952' === 3952],
    ["'1e3' == '1000'", '1e3' == '1000'],
    ["0 == ''", 0 == ''],
    ["null == false", null == false],
    ["null === false", null === false],
    ["3886 <=> 3952", 3886 <=> 3952],
  ];

  $hasHeadlamp = true;
  $hasRainwear = true;
  $isStorm = false;
  $canGo = $hasHeadlamp && $hasRainwear && !$isStorm;
  ?>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>運算式</th>
          <th>結果</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($cases as [$expr, $result]): ?>
          <tr>
            <td><code><?= h($expr) ?></code></td>
            <td>
              <?php if (is_bool($result)): ?>
                <span class="pill <?= $result ? 'pill-ok' : 'pill-bad' ?>"><?= var_export($result, true) ?></span>
              <?php else: ?>
                <span class="pill pill-warn"><?= $result ?></span>
              <?php endif; ?>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <p class="out-sub">出發檢查：頭燈 && 雨衣 && !暴風雨</p>
  <div class="verdict<?= $canGo ? '' : ' is-bad' ?>">
    <span class="verdict-icon"><?= $canGo ? '🎒' : '⛔' ?></span>
    <div>
      <b><?= $canGo ? '裝備齊全，可以出發' : '條件不足，先別出發' ?></b>
      <p>頭燈 <?= $hasHeadlamp ? '✓' : '✗' ?> · 雨衣 <?= $hasRainwear ? '✓' : '✗' ?> · 暴風雨 <?= $isStorm ? '有' : '無' ?></p>
    </div>
  </div>
  <?php
}

/** EX 08 · if / else —— 依降雨機率決定出不出發 */
function ex08(): void
{
  // 從網址讀取降雨機率（EX 21 會細講 $_GET），限制在 0～100
  $rain = max(0, min(100, (int) ($_GET['rain'] ?? 30)));
  $limit = 60;

  if ($rain >= $limit) {
    $go = false;
    $message = '降雨機率偏高，稜線濕滑又容易失溫，這次改期吧。';
  } else {
    $go = true;
    $message = '天氣條件可以接受，記得還是要帶雨具。';
  }
  ?>

  <nav class="segmented" aria-label="選擇降雨機率">
    <?php foreach ([10, 30, 50, 60, 80] as $value): ?>
      <a href="?rain=<?= $value ?>" aria-current="<?= $value === $rain ? 'true' : 'false' ?>">降雨 <?= $value ?>%</a>
    <?php endforeach; ?>
  </nav>

  <div class="verdict<?= $go ? '' : ' is-bad' ?>">
    <span class="verdict-icon"><?= $go ? '⛰️' : '🌧️' ?></span>
    <div>
      <b><?= $go ? '出發！' : '改期' ?>（降雨機率 <?= $rain ?>%）</b>
      <p><?= $message ?></p>
    </div>
  </div>

  <p class="note">門檻是 <?= $limit ?>%：<code>$rain >= $limit</code> 成立就進 if，否則進 else。</p>
  <?php
}

/** EX 09 · elseif —— 依累積爬升替路線分級 */
function ex09(): void
{
  $gain = max(0, (int) ($_GET['gain'] ?? 1342));

  if ($gain >= 1500) {
    [$level, $class] = ['挑戰', 'pill-bad'];
  } elseif ($gain >= 1000) {
    [$level, $class] = ['進階', 'pill-warn'];
  } elseif ($gain >= 500) {
    [$level, $class] = ['中級', 'pill-brand'];
  } else {
    [$level, $class] = ['入門', 'pill-ok'];
  }
  ?>

  <nav class="segmented" aria-label="選擇路線">
    <?php foreach (TRAILS as $t): ?>
      <a href="?gain=<?= $t['gain'] ?>" aria-current="<?= $t['gain'] === $gain ? 'true' : 'false' ?>"><?= $t['name'] ?></a>
    <?php endforeach; ?>
  </nav>

  <p class="lead">累積爬升 <strong><?= number_format($gain) ?></strong> 公尺 →
    <span class="pill <?= $class ?>"><?= $level ?></span>
  </p>

  <div class="table-wrap">
    <table class="tbl">
      <thead>
        <tr>
          <th>條件（由上往下檢查）</th>
          <th>等級</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td><code>if ($gain >= 1500)</code></td>
          <td>挑戰</td>
        </tr>
        <tr>
          <td><code>elseif ($gain >= 1000)</code></td>
          <td>進階</td>
        </tr>
        <tr>
          <td><code>elseif ($gain >= 500)</code></td>
          <td>中級</td>
        </tr>
        <tr>
          <td><code>else</code></td>
          <td>入門</td>
        </tr>
      </tbody>
    </table>
  </div>
  <?php
}

/** EX 10 · switch / match —— 同一件事的兩種寫法 */
function ex10(): void
{
  $month = (int) date('n');

  // switch：寬鬆比較，case 可以疊在一起，每段記得 break
  switch ($month) {
    case 12:
    case 1:
    case 2:
      $season = '雪季，需要冰爪與雪地經驗';
      break;
    case 5:
    case 6:
      $season = '梅雨季，午後容易起霧';
      break;
    case 7:
    case 8:
    case 9:
      $season = '颱風季，出發前多看氣象';
      break;
    default:
      $season = '天氣相對穩定的好季節';
  }

  // match：是一個運算式，用 === 比較、直接回傳值
  function badge(string $difficulty): string
  {
    return match ($difficulty) {
      '入門' => 'pill-ok',
      '中級' => 'pill-brand',
      '進階' => 'pill-bad',
      default => 'pill',
    };
  }
  ?>

  <p class="lead">現在是 <?= $month ?> 月：<?= $season ?>。</p>

  <p class="out-sub">用 match 決定每條路線的標籤顏色</p>
  <ul class="chips">
    <?php foreach (TRAILS as $t): ?>
      <li><span class="pill <?= badge($t['difficulty']) ?>"><?= $t['name'] ?> · <?= $t['difficulty'] ?></span></li>
    <?php endforeach; ?>
  </ul>

  <p class="note">match 沒有 default 又對不到時會丟出 UnhandledMatchError——比 switch 默默什麼都不做更容易發現錯誤。</p>
  <?php
}
