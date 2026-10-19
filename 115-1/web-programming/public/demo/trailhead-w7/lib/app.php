<?php
/**
 * 30 個範例共用的東西：範例目錄、h()／url()、頁面外框、原始碼上色。
 * 頁面都由 index.php 依網址分派；範例本身在 lessons/1～3.php，每題一個 exNN() 函式。
 */

declare(strict_types=1);

require_once __DIR__ . '/trails.php';

date_default_timezone_set('Asia/Taipei');

// 不對外透露伺服器資訊：拿掉回應標頭裡的 PHP 版本，錯誤訊息只寫進 log、不印在頁面上（會洩漏檔案路徑）
header_remove('X-Powered-By');
ini_set('display_errors', '0');
ini_set('log_errors', '1');

const SITE_NAME = '山行 Trailhead · PHP 30';

const LESSONS = [
  1 => ['title' => 'PHP 基本語法與條件判斷', 'desc' => '讓伺服器開口說話：輸出、變數、運算子，再用條件決定要不要出發。'],
  2 => ['title' => '迴圈、陣列與函式', 'desc' => '把六條路線裝進陣列，用迴圈產生表格，再把重複的計算收進函式。'],
  3 => ['title' => '表單資料接收與驗證', 'desc' => '接住使用者送來的 GET／POST，檢查、白名單、跳脫，最後組成一張報名表。'],
];

/**
 * 範例目錄。key 是題號，lesson 是第幾節；try 是「動手改改看」的練習題。
 */
const EXAMPLES = [
  1 => ['lesson' => 1, 'title' => 'PHP 基本結構與輸出', 'concept' => 'echo · <?= ?>', 'summary' => 'PHP 程式碼寫在 <?php ?> 標籤裡，伺服器執行完只把輸出的文字送給瀏覽器。', 'try' => ['把歡迎詞改成你最想爬的山。', '按右鍵「檢視原始碼」，確認瀏覽器拿到的只有 HTML、看不到任何 PHP。']],
  2 => ['lesson' => 1, 'title' => 'PHP 與 HTML 混合', 'concept' => '動態標題 · date()', 'summary' => '同一個檔案裡 HTML 照寫，需要變動的地方再插入 PHP——每次重新整理，時間都是伺服器當下算出來的。', 'try' => ['把 date() 的格式改成「Y 年 n 月 j 日」。', '新增一個 $weather 變數，顯示在標題下方。']],
  3 => ['lesson' => 1, 'title' => '變數與資料型態', 'concept' => 'string · int · float · bool · null', 'summary' => '變數以 $ 開頭，型態由值決定；gettype() 與 var_dump() 可以看到 PHP 眼中的真實樣子。', 'try' => ['把 $elevation 改成字串 "3952"，觀察 var_dump() 的差別。', '新增一個 array 型態的變數，看看 gettype() 回傳什麼。']],
  4 => ['lesson' => 1, 'title' => '常數', 'concept' => 'const · define() · defined()', 'summary' => '不會變的值用常數存：const 在編譯期決定，define() 可以在執行期決定；defined() 檢查常數是否存在。', 'try' => ['試著在常數宣告後再重新指定一次值，看看會發生什麼錯誤。', '用 defined() 檢查一個不存在的常數。']],
  5 => ['lesson' => 1, 'title' => '字串串接與插值', 'concept' => '. · "{$var}" · heredoc · sprintf()', 'summary' => '單引號原樣輸出、雙引號會代入變數，點號負責串接；sprintf() 適合需要固定格式的時候。', 'try' => ['把雙引號改成單引號，觀察變數有沒有被代入。', '用 sprintf() 讓海拔顯示成「3,952 m」。']],
  6 => ['lesson' => 1, 'title' => '數學運算', 'concept' => '+ - * / % ** · round()', 'summary' => '用里程、天數、爬升算出每日平均與坡度；% 取餘數、intdiv() 取整數商，正好拿來分組。', 'try' => ['把隊員人數改成 17，看分組結果怎麼變。', '用 round() 的第二個參數把每日里程改成小數點後 2 位。']],
  7 => ['lesson' => 1, 'title' => '比較與邏輯運算', 'concept' => '== vs === · && || ! · <=>', 'summary' => '== 只比值、會自動轉型；=== 連型態一起比。實務上預設用 ===，少掉很多意外。', 'try' => ['在比較表裡加一列 "abc" == 0，想想 PHP 7 與 PHP 8 的結果為什麼不同。', '把 $hasRainwear 改成 false，看出發檢查的結果。']],
  8 => ['lesson' => 1, 'title' => 'if / else', 'concept' => '降雨機率決定出不出發', 'summary' => '條件成立走 if，不成立走 else——二選一的決定。這題的降雨機率可以從網址參數換掉。', 'try' => ['點上方不同的降雨機率，觀察畫面怎麼變。', '把門檻從 60% 改成 40%。']],
  9 => ['lesson' => 1, 'title' => 'elseif', 'concept' => '依累積爬升分級', 'summary' => '多個條件依序檢查，第一個成立的就停下來——所以門檻要由嚴到寬（或由寬到嚴）排好。', 'try' => ['把條件的順序顛倒，看看結果哪裡錯了。', '新增一個「健行」等級給 300 公尺以下。']],
  10 => ['lesson' => 1, 'title' => 'switch / match', 'concept' => 'match 是 PHP 8 的新寫法', 'summary' => 'switch 用寬鬆比較、要記得 break；match 是運算式、用嚴格比較、會回傳值，沒對到還會丟例外。', 'try' => ['在 match 裡移除 default，再傳一個不存在的難度。', '把 switch 的某個 break 拿掉，觀察「穿透」。']],

  11 => ['lesson' => 2, 'title' => 'for 迴圈', 'concept' => '產生隊員編號', 'summary' => '知道要跑幾次就用 for：初始值、條件、遞增三段寫在一起。', 'try' => ['把人數改成 20，並讓編號從 T001 開始。', '讓偶數號碼的隊員換一個顏色。']],
  12 => ['lesson' => 2, 'title' => 'while 迴圈', 'concept' => '爬到山頂為止', 'summary' => '不知道要跑幾次、只知道什麼時候該停，就用 while；記得迴圈裡一定要讓條件有機會變成 false。', 'try' => ['把每小時爬升改成 200 公尺。', '改用 do…while 寫同樣的累加。']],
  13 => ['lesson' => 2, 'title' => 'foreach 迴圈', 'concept' => '逐一列出裝備', 'summary' => '走訪陣列最常用的寫法：只要值寫 as $item，連 key 一起要就寫 as $key => $item。', 'try' => ['在裝備清單加入「保溫瓶」。', '用 $i + 1 顯示從 1 開始的序號。']],
  14 => ['lesson' => 2, 'title' => '索引陣列', 'concept' => '[] · count() · sort()', 'summary' => '索引陣列從 0 開始編號；[] 新增、count() 計數、sort() 排序（會直接改動原陣列）。', 'try' => ['用 rsort() 改成由大到小。', '用 array_search() 找出「雪山」在第幾格。']],
  15 => ['lesson' => 2, 'title' => '關聯陣列', 'concept' => "['key' => 'value']", 'summary' => '用有意義的名字當 key，讀資料時就不用記第幾格；isset() 可先確認 key 存在。', 'try' => ['新增一個 \'permit\' => \'入園證\' 欄位。', '讀一個不存在的 key，看看 PHP 給的警告。']],
  16 => ['lesson' => 2, 'title' => '二維陣列', 'concept' => '多筆路線 → HTML 表格', 'summary' => '「陣列裡放關聯陣列」就是一張表：外層 foreach 跑每一列，內層取欄位。', 'try' => ['多加一欄「每日里程」。', '只顯示難度為「中級」的路線。']],
  17 => ['lesson' => 2, 'title' => '陣列統計', 'concept' => 'array_sum · max · min · array_column', 'summary' => 'array_column() 把某一欄抽成一維陣列，再交給 array_sum()、max()、min() 一行算完。', 'try' => ['改成統計里程（distance）。', '用 array_filter() 只算 3500 公尺以上的山。']],
  18 => ['lesson' => 2, 'title' => '字串函式', 'concept' => 'trim · mb_strlen · explode', 'summary' => '中文一個字在 UTF-8 佔 3 bytes，所以算字數要用 mb_ 開頭的函式。', 'try' => ['把 $raw 前後再多加幾個空白。', '用 implode() 把陣列用「→」串起來。']],
  19 => ['lesson' => 2, 'title' => '自訂函式', 'concept' => '參數 · 型別 · 預設值 · return', 'summary' => '把「估算步行時間」寫成函式，六條路線共用同一套公式；型別宣告讓錯誤的參數早點被發現。', 'try' => ['把預設步速從 4 km/h 改成 3 km/h。', '寫一個 pace_label() 函式，依時數回傳「輕鬆／扎實／硬仗」。']],
  20 => ['lesson' => 2, 'title' => '日期與時間', 'concept' => 'DateTimeImmutable · diff()', 'summary' => '設定好時區，再用 DateTimeImmutable 算「距離出發還有幾天」；Immutable 版本每次運算都回傳新物件，不會改到原本的值。', 'try' => ['改成顯示距離出發還有幾小時。', '用 modify(\'+1 day\') 算出下山日的隔天。']],

  21 => ['lesson' => 3, 'title' => 'GET 表單接收', 'concept' => '$_GET · 網址查詢字串', 'summary' => 'GET 會把欄位放進網址，適合搜尋、篩選這種可以分享、可以加書籤的請求。', 'try' => ['直接在網址列改 ?q= 的值。', '加一個難度下拉選單，一起篩選。']],
  22 => ['lesson' => 3, 'title' => 'POST 表單接收', 'concept' => '$_POST · 送出後網址不變', 'summary' => 'POST 把資料放在請求本文，不會出現在網址上，適合報名、登入這類會改變狀態的動作。', 'try' => ['送出後按 F5，看看瀏覽器提示什麼。', '在開發者工具的 Network 分頁找到這次 POST 的 Payload。']],
  23 => ['lesson' => 3, 'title' => '判斷請求方式', 'concept' => '$_SERVER', 'summary' => '同一支程式要同時「顯示表單」和「處理送出」，就先看 $_SERVER[\'REQUEST_METHOD\']。', 'try' => ['分別按 GET 與 POST 按鈕，比較上方的請求資訊。', '在表格裡多印出 $_SERVER[\'HTTP_ACCEPT_LANGUAGE\']。']],
  24 => ['lesson' => 3, 'title' => '判斷欄位是否存在', 'concept' => 'isset · empty · ??', 'summary' => '使用者可能根本沒送某個欄位。isset()、empty() 與 ?? 對「空字串」「0」「null」的判斷都不一樣。', 'try' => ['點不同的連結，看 $_GET[\'trail\'] 在各種情況下的判斷結果。', '想想看為什麼 empty(\'0\') 是 true。']],
  25 => ['lesson' => 3, 'title' => '表單必填驗證', 'concept' => 'trim() · 錯誤訊息陣列', 'summary' => '前端的 required 可以被繞過，伺服器一定要自己再檢查一次；只填空白也算沒填。', 'try' => ['姓名只輸入幾個空白就送出。', '用開發者工具把 required 屬性刪掉再送出。']],
  26 => ['lesson' => 3, 'title' => 'Email 格式驗證', 'concept' => 'filter_var()', 'summary' => '不要自己寫 Email 正規表示式——filter_var() 搭配 FILTER_VALIDATE_EMAIL 就能檢查。', 'try' => ['輸入「hiker@@mail.com」。', '改用 FILTER_VALIDATE_INT 檢查人數。']],
  27 => ['lesson' => 3, 'title' => '安全輸出', 'concept' => 'htmlspecialchars()', 'summary' => '任何使用者輸入在放回 HTML 之前都要跳脫，否則 <script> 會被當成程式執行（XSS）。', 'try' => ['輸入 <img src=x onerror=alert(1)>，觀察跳脫後的樣子。', '把 ENT_QUOTES 拿掉，想想放進屬性值時會出什麼問題。']],
  28 => ['lesson' => 3, 'title' => '單選與下拉選單', 'concept' => 'radio · select · 白名單', 'summary' => '選項可以被竄改，所以收到的值要對照白名單；送出後用 checked、selected 保留使用者的選擇。', 'try' => ['用開發者工具把某個 option 的 value 改掉再送出。', '讓預設選項改成「合歡北峰」。']],
  29 => ['lesson' => 3, 'title' => 'Checkbox 多選', 'concept' => 'name="rent[]"', 'summary' => 'name 後面加 [] 才會收到陣列；沒勾任何一項時，這個欄位根本不會被送出。', 'try' => ['一項都不勾就送出，看看 $_POST 長什麼樣子。', '把 [] 拿掉，只勾兩項送出。']],
  30 => ['lesson' => 3, 'title' => 'Trailhead 梯次報名整合', 'concept' => 'POST + 驗證 + 白名單 + 安全輸出', 'summary' => '把前面 29 題組起來：欄位逐一驗證、錯誤標在欄位旁、送出後保留填寫內容，通過就發一張登山證。', 'try' => ['選「已額滿」的梯次，或人數超過剩餘名額。', '把所有欄位都填錯，看錯誤訊息是不是都對得上欄位。']],
];

/** 可以在原始碼頁看的檔案：網址代號 => 相對於本資料夾的路徑 */
const SOURCES = [
  'index' => 'index.php',
  'app' => 'lib/app.php',
  'trails' => 'lib/trails.php',
  'lesson-1' => 'lessons/1.php',
  'lesson-2' => 'lessons/2.php',
  'lesson-3' => 'lessons/3.php',
];

/**
 * 從 $_GET／$_POST 取一個字串欄位。使用者可以把欄位改成陣列送來（name[]=x），
 * 直接 (string) 轉型會跳出 "Array to string conversion" 警告，所以不是字串就當成預設值。
 */
function str_param(array $from, string $key, string $default = ''): string
{
  $value = $from[$key] ?? $default;
  return is_string($value) ? $value : $default;
}

/** 跳脫後輸出用。所有放回 HTML 的資料都要經過這裡。 */
function h(mixed $value): string
{
  return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

/**
 * 產生站內網址。所有頁面都由 index.php 處理，網址上不出現 .php：
 * url('') → /demo/trailhead-w7/、url('ex/08') → /demo/trailhead-w7/ex/08
 */
function url(string $path = ''): string
{
  static $base = null;
  $base ??= rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '/')), '/');
  return h($base . '/' . $path);
}

function ex_path(int $n): string
{
  return sprintf('ex/%02d', $n);
}

function ex_label(int $n): string
{
  return sprintf('EX %02d', $n);
}

function render_head(string $title, string $bodyClass, array $data = []): void
{
  $attrs = '';
  foreach ($data as $key => $value) {
    $attrs .= ' data-' . h($key) . '="' . $value . '"';
  }
  header('Content-Type: text/html; charset=UTF-8');
  // 基本的安全標頭：不准瀏覽器猜 MIME 類型、不准被別的網站用 iframe 嵌入、跨站時只送出網域
  header('X-Content-Type-Options: nosniff');
  header('X-Frame-Options: SAMEORIGIN');
  header('Referrer-Policy: strict-origin-when-cross-origin');
  ?>
  <!doctype html>
  <html lang="zh-Hant-TW">

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title><?= h($title) ?></title>
    <meta name="description" content="Week 7 課程練習：30 個 PHP 常用觀念，以山行 Trailhead 步道資料為題，每題都能執行並查看原始碼。">
    <script>try { var t = localStorage.getItem('php30:theme'); if (t) document.documentElement.dataset.theme = t } catch (e) { }</script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
      href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Noto+Sans+TC:wght@400;500;700&family=Noto+Serif+TC:wght@700;900&display=swap"
      rel="stylesheet">
    <link rel="stylesheet" href="<?= url('assets/style.css') ?>">
    <script src="<?= url('assets/app.js') ?>" defer></script>
  </head>

  <body class="<?= h($bodyClass) ?>" <?= $attrs ?>>
    <header class="topbar">
      <a class="brand" href="<?= url() ?>"><span class="brand-mark" aria-hidden="true">▲</span>山行 <b>Trailhead</b><span
          class="brand-tag">PHP 30</span></a>
      <nav class="topnav">
        <a href="<?= url() ?>">目錄</a>
        <a href="<?= url('source/app') ?>">共用程式</a>
        <a href="/weekly/07/">回 Week 07</a>
        <button class="theme-btn" type="button" data-theme-toggle aria-label="切換深淺色">
          <span class="i-sun" aria-hidden="true">☀</span><span class="i-moon" aria-hidden="true">☾</span>
        </button>
      </nav>
    </header>
    <?php
}

function render_foot(): void
{
  ?>
    <footer class="site-foot">
      <p>Week 7 課程練習 · 純 PHP，不用框架、不連資料庫，送出的資料不會被儲存。</p>
      <p>路線里程與爬升為概略值，梯次與費用皆為虛構。鍵盤 <kbd>←</kbd> <kbd>→</kbd> 可切換上下題。</p>
    </footer>
  </body>

  </html>
  <?php
}

/** 範例頁：標題區 →「執行結果」卡片裡呼叫 exNN() → 練習題、該題原始碼、上下題。 */
function render_example(int $n): void
{
  $ex = EXAMPLES[$n];
  $lesson = LESSONS[$ex['lesson']];
  // url() 已經跳脫過，render_head 不再重複跳脫 data 屬性
  render_head(ex_label($n) . ' ' . $ex['title'] . '｜' . SITE_NAME, 'page-ex', [
    'prev' => $n > 1 ? url(ex_path($n - 1)) : '',
    'next' => $n < count(EXAMPLES) ? url(ex_path($n + 1)) : '',
  ]);
  ?>
  <main class="ex-wrap">
    <section class="ex-hero">
      <nav class="crumb"><a href="<?= url() ?>">目錄</a><span>/</span><a href="<?= url() ?>#lesson-<?= $ex['lesson'] ?>">第
          <?= $ex['lesson'] ?> 節 · <?= h($lesson['title']) ?></a></nav>
      <div class="ex-hero-row">
        <div class="ex-num" aria-hidden="true"><?= sprintf('%02d', $n) ?></div>
        <div>
          <p class="ex-kicker"><?= ex_label($n) ?> <span class="chip"><?= h($ex['concept']) ?></span></p>
          <h1><?= h($ex['title']) ?></h1>
          <p class="ex-summary"><?= h($ex['summary']) ?></p>
        </div>
      </div>
    </section>
    <div class="ex-grid">
      <div class="ex-main">
        <section class="panel result">
          <header class="panel-head">
            <h2>▶ 執行結果</h2><span class="muted">伺服器在 <?= h(date('H:i:s')) ?> 產生這段 HTML</span>
          </header>
          <div class="panel-body">
            <?php
            require_once dirname(__DIR__) . "/lessons/{$ex['lesson']}.php";
            ('ex' . sprintf('%02d', $n))();
            ?>
          </div>
        </section>
        <section class="panel tryit">
          <header class="panel-head">
            <h2>✎ 動手改改看</h2>
          </header>
          <ol class="panel-body try-list">
            <?php foreach ($ex['try'] as $task): ?>
              <li><?= h($task) ?></li>
            <?php endforeach; ?>
          </ol>
        </section>
      </div>
      <aside class="ex-code">
        <?php render_code('lesson-' . $ex['lesson'], $n); ?>
      </aside>
    </div>
    <nav class="pager">
      <?php if ($n > 1): ?>
        <a class="pager-link prev" href="<?= url(ex_path($n - 1)) ?>"><small>← 上一題 ·
            <?= ex_label($n - 1) ?></small><?= h(EXAMPLES[$n - 1]['title']) ?></a>
      <?php else: ?>
        <span></span>
      <?php endif; ?>
      <?php if ($n < count(EXAMPLES)): ?>
        <a class="pager-link next" href="<?= url(ex_path($n + 1)) ?>"><small><?= ex_label($n + 1) ?> · 下一題
            →</small><?= h(EXAMPLES[$n + 1]['title']) ?></a>
      <?php else: ?>
        <a class="pager-link next" href="<?= url() ?>"><small>全部完成 →</small>回到目錄</a>
      <?php endif; ?>
    </nav>
  </main>
  <?php
  render_foot();
}

/**
 * 找出某一題在 lesson 檔裡的行號範圍：從「EX NN」的 docblock 那行開始，到下一題之前（去掉尾端空行）。
 * 回傳 [起始行, 結束行]，都是從 0 起算的索引。
 */
function example_range(array $rawLines, int $n): array
{
  $start = null;
  $end = count($rawLines) - 1;
  foreach ($rawLines as $i => $line) {
    if (preg_match('#^/\*\* EX (\d{2})#', $line, $m)) {
      if ((int) $m[1] === $n) {
        $start = $i;
      } elseif ($start !== null) {
        $end = $i - 1;
        break;
      }
    }
  }
  $start ??= 0;
  while ($end > $start && trim($rawLines[$end]) === '') {
    $end--;
  }
  return [$start, $end];
}

/** 原始碼面板。$key 是 SOURCES 裡的代號；有給 $exNo 時只顯示那一題的片段，行號照原檔。 */
function render_code(string $key, ?int $exNo = null): void
{
  $file = SOURCES[$key];
  $source = str_replace("\r\n", "\n", (string) file_get_contents(dirname(__DIR__) . '/' . $file));
  $lines = highlight_php($source);
  $start = 0;
  if ($exNo !== null) {
    [$start, $end] = example_range(explode("\n", $source), $exNo);
    $lines = array_slice($lines, $start, $end - $start + 1);
  }
  ?>
  <figure class="code<?= $exNo !== null ? ' code-compact' : '' ?>" data-code>
    <figcaption class="code-bar">
      <span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="code-name"><?= h($file) ?></span>
      <span
        class="code-meta"><?= $exNo !== null ? '第 ' . ($start + 1) . '–' . ($start + count($lines)) . ' 行' : count($lines) . ' 行' ?></span>
      <span class="code-actions">
        <button type="button" data-wrap aria-pressed="false">換行</button>
        <button type="button" data-copy>複製</button>
        <?php if ($exNo !== null): ?><a href="<?= url('source/' . $key) ?>#L<?= $start + 1 ?>">全檔 ↗</a><?php endif; ?>
      </span>
    </figcaption>
    <pre
      style="counter-reset: ln <?= $start ?>"><code><?php foreach ($lines as $i => $line): ?><span class="ln"<?= $exNo === null ? ' id="L' . ($i + 1) . '"' : '' ?>><?= $line ?></span><?php endforeach; ?></code></pre>
  </figure>
  <?php
}

/** 原始碼頁（/source/{代號}）：只接受 SOURCES 裡的代號，不拿網址去拼路徑。 */
function render_source(string $key): void
{
  render_head(SOURCES[$key] . '｜原始碼｜' . SITE_NAME, 'page-source');
  ?>
  <main class="code-page">
    <nav class="crumb"><a href="<?= url() ?>">目錄</a><span>/</span><span>原始碼</span></nav>
    <div class="code-page-head">
      <div>
        <h1><?= h(SOURCES[$key]) ?></h1>
        <p><?= number_format(filesize(dirname(__DIR__) . '/' . SOURCES[$key])) ?> bytes · 網址加上 #L行號 可以直接跳到那一行</p>
      </div>
    </div>
    <nav class="file-tabs" aria-label="其他檔案">
      <?php foreach (SOURCES as $other => $path): ?>
        <a href="<?= url('source/' . $other) ?>" <?= $other === $key ? 'aria-current="page"' : '' ?>><?= h($path) ?></a>
      <?php endforeach; ?>
    </nav>
    <?php render_code($key); ?>
  </main>
  <?php
  render_foot();
}

function render_not_found(): void
{
  http_response_code(404);
  render_head('找不到頁面｜' . SITE_NAME, 'page-source');
  ?>
  <main class="code-page">
    <div class="code-page-head">
      <div>
        <h1>404 · 這條路線不存在</h1>
        <p>網址可能打錯了，回目錄重新出發吧。</p>
      </div>
    </div>
    <p><a class="btn" href="<?= url() ?>">回到目錄</a></p>
  </main>
  <?php
  render_foot();
}

/**
 * 用 PHP 自己的 tokenizer 把原始碼切成 token 再上色，回傳每一行的 HTML。
 * 內建的 highlight_string() 也能上色，但它的輸出格式在 8.3 改過、顏色寫死在 inline style，
 * 沒辦法配合深淺色主題，也不好切成一行一行加行號。
 */
function highlight_php(string $code): array
{
  $code = str_replace("\r\n", "\n", $code);
  $tokens = token_get_all($code);
  $lines = [''];
  $push = static function (string $class, string $text) use (&$lines): void {
    foreach (explode("\n", $text) as $i => $part) {
      if ($i > 0) {
        $lines[] = '';
      }
      if ($part !== '') {
        $lines[array_key_last($lines)] .= $class === '' ? h($part) : '<span class="t-' . $class . '">' . h($part) . '</span>';
      }
    }
  };
  $types = ['string', 'int', 'float', 'bool', 'array', 'void', 'mixed', 'never', 'iterable', 'object', 'callable', 'self', 'static'];

  foreach ($tokens as $i => $token) {
    if (is_string($token)) {
      $push($token === '"' ? 'str' : 'punc', $token);
      continue;
    }
    [$id, $text] = $token;
    if ($id === T_INLINE_HTML) {
      foreach (highlight_html($text) as [$class, $piece]) {
        $push($class, $piece);
      }
      continue;
    }
    $class = match ($id) {
      T_COMMENT, T_DOC_COMMENT => 'cmt',
      T_VARIABLE => 'var',
      T_CONSTANT_ENCAPSED_STRING, T_ENCAPSED_AND_WHITESPACE, T_START_HEREDOC, T_END_HEREDOC => 'str',
      T_LNUMBER, T_DNUMBER => 'num',
      T_OPEN_TAG, T_OPEN_TAG_WITH_ECHO, T_CLOSE_TAG => 'tag',
      T_WHITESPACE => '',
      T_NAME_QUALIFIED, T_NAME_FULLY_QUALIFIED => 'fn',
      T_STRING => string_token_class($tokens, $i, $text, $types),
      default => preg_match('/^[a-z_()]+$/i', $text) ? 'kw' : 'punc',
    };
    $push($class, $text);
  }

  if (end($lines) === '') {
    array_pop($lines);
  }
  return $lines;
}

function string_token_class(array $tokens, int $i, string $text, array $types): string
{
  $lower = strtolower($text);
  if (in_array($lower, ['true', 'false', 'null'], true)) {
    return 'kw';
  }
  if (in_array($lower, $types, true)) {
    return 'type';
  }
  for ($j = $i + 1, $n = count($tokens); $j < $n; $j++) {
    if (is_array($tokens[$j]) && $tokens[$j][0] === T_WHITESPACE) {
      continue;
    }
    if ($tokens[$j] === '(') {
      return 'fn';
    }
    break;
  }
  return preg_match('/^[A-Z][A-Z0-9_]+$/', $text) ? 'const' : 'name';
}

/** 把 PHP 標籤之間的 HTML 切成 [class, 文字] 片段：標籤名、屬性、屬性值分開上色。 */
function highlight_html(string $html): array
{
  $out = [];
  $parts = preg_split('/(<!--.*?-->|<[^>]*>?)/s', $html, -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY);
  foreach ($parts as $part) {
    if (str_starts_with($part, '<!--')) {
      $out[] = ['cmt', $part];
    } elseif (preg_match('/^(<\/?)([!\w-]*)(.*?)(\/?>)?$/s', $part, $m)) {
      $out[] = ['punc', $m[1]];
      $out[] = ['htag', $m[2]];
      foreach (preg_split('/("[^"]*"?|\'[^\']*\'?)/', $m[3], -1, PREG_SPLIT_DELIM_CAPTURE | PREG_SPLIT_NO_EMPTY) as $attr) {
        $out[] = [$attr[0] === '"' || $attr[0] === "'" ? 'str' : 'attr', $attr];
      }
      $out[] = ['punc', $m[4] ?? ''];
    } else {
      $out[] = ['', $part];
    }
  }
  return $out;
}

/** 把任意值印成 var_dump() 的樣子（已跳脫），範例裡用來「看 PHP 眼中的資料」。 */
function dump(mixed $value): string
{
  ob_start();
  var_dump($value);
  return '<pre class="dump">' . h(trim((string) ob_get_clean())) . '</pre>';
}
