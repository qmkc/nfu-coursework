<?php
/**
 * 整個資料夾唯一的入口。.htaccess 把找不到實體檔案的網址都轉給這支，再依路徑分派：
 *   /                → 目錄（就是這支檔案下半部）
 *   /ex/01 ～ /ex/30 → 範例頁（lessons/1～3.php 裡的 exNN()）
 *   /source/{代號}   → 原始碼頁（只接受 lib/app.php 的 SOURCES 白名單）
 * 所以網址上不會出現 .php。
 */

declare(strict_types=1);

require __DIR__ . '/lib/app.php';

$base = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$route = trim(substr($path, strlen($base)), '/');

if (preg_match('#^ex/(\d{2})$#', $route, $m) && isset(EXAMPLES[(int) $m[1]])) {
  render_example((int) $m[1]);
  return;
}

if (preg_match('#^source/([a-z0-9-]+)$#', $route, $m) && isset(SOURCES[$m[1]])) {
  render_source($m[1]);
  return;
}

if ($route !== '' && $route !== 'index.php') {
  render_not_found();
  return;
}

// ---- 以下是目錄頁 ----

$byLesson = [];
$sourceLine = [];   // 每題在 lesson 檔裡從第幾行開始，給「原始碼」連結用
foreach (EXAMPLES as $n => $ex) {
  $byLesson[$ex['lesson']][$n] = $ex;
  $lessonLines[$ex['lesson']] ??= file(__DIR__ . "/lessons/{$ex['lesson']}.php", FILE_IGNORE_NEW_LINES);
  $sourceLine[$n] = example_range($lessonLines[$ex['lesson']], $n)[0] + 1;
}

$now = new DateTimeImmutable('now');
$weekdays = ['日', '一', '二', '三', '四', '五', '六'];

render_head(SITE_NAME . '｜Week 7 PHP 入門 30 題', 'page-index');
?>
<main>
  <section class="hero">
    <div class="hero-inner">
      <div>
        <p class="eyebrow">Week 07 · Server-side</p>
        <h1>步道上的<br><em>PHP 30</em> 題</h1>
        <p class="hero-lead">
          Week 5、6 的山行 Trailhead 全是前端；這週換到伺服器那一側。三節課、30 個範例，從 <code class="inline-code">echo</code>
          一路走到能驗證、能防 XSS 的梯次報名表。每一題都能直接執行，旁邊就是同一支檔案的原始碼。
        </p>
        <div class="hero-actions">
          <a class="btn" href="<?= url('ex/01') ?>">從第 1 題開始 →</a>
          <a class="btn btn-ghost" href="<?= url('ex/30') ?>">直接看整合題</a>
        </div>
      </div>
      <aside class="server-card" aria-label="這次請求的伺服器資訊">
        <div class="code-bar">
          <span class="code-dots" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="code-name">$_SERVER · 這一次的請求</span>
        </div>
        <dl>
          <dt>伺服器時間</dt>
          <dd><?= h($now->format('Y-m-d H:i:s')) ?>（週<?= $weekdays[(int) $now->format('w')] ?>）</dd>
          <dt>時區</dt>
          <dd><?= h(date_default_timezone_get()) ?></dd>
          <dt>REQUEST_METHOD</dt>
          <dd><?= h($_SERVER['REQUEST_METHOD'] ?? '') ?></dd>
        </dl>
        <p class="prompt">重新整理一次，時間就會變 —— <b>這頁不是靜態 HTML</b></p>
      </aside>
    </div>
    <svg class="ridge" viewBox="0 0 1440 170" preserveAspectRatio="none" aria-hidden="true">
      <path class="r1"
        d="M0 90 L120 60 L210 82 L330 30 L430 70 L520 52 L640 96 L760 40 L860 76 L980 22 L1090 74 L1200 48 L1320 86 L1440 58 V170 H0Z" />
      <path class="r2"
        d="M0 120 L150 92 L260 116 L380 80 L500 112 L620 90 L720 122 L850 84 L960 114 L1080 92 L1200 120 L1320 100 L1440 118 V170 H0Z" />
      <path class="r3" d="M0 148 L180 132 L360 150 L540 134 L720 152 L900 136 L1080 150 L1260 138 L1440 150 V170 H0Z" />
    </svg>
  </section>

  <div class="wrap">
    <div class="toolbar">
      <label class="search">
        <span aria-hidden="true">⌕</span>
        <input type="search" placeholder="搜尋題目或語法，例如 foreach、POST、filter_var（按 / 聚焦）" data-search aria-label="搜尋範例">
      </label>
      <nav class="jump" aria-label="跳到節次">
        <?php foreach (LESSONS as $no => $lesson): ?>
          <a href="#lesson-<?= $no ?>">第 <?= $no ?> 節</a>
        <?php endforeach; ?>
      </nav>
    </div>

    <?php foreach (LESSONS as $no => $lesson): ?>
      <section class="lesson" id="lesson-<?= $no ?>" data-lesson>
        <header class="lesson-head">
          <span class="lesson-no" aria-hidden="true"><?= $no ?></span>
          <h2>第 <?= $no ?> 節｜<?= h($lesson['title']) ?></h2>
          <p><?= h($lesson['desc']) ?></p>
        </header>
        <ul class="cards">
          <?php foreach ($byLesson[$no] as $n => $ex): ?>
            <?php $text = mb_strtolower(ex_label($n) . ' ' . $ex['title'] . ' ' . $ex['concept'] . ' ' . $ex['summary']); ?>
            <li class="card<?= $n === 30 ? ' card-final' : '' ?>" data-card="<?= $n ?>" data-text="<?= h($text) ?>">
              <div class="card-top">
                <span class="card-no"><?= ex_label($n) ?><?= $n === 30 ? ' · 整合成果' : '' ?></span>
              </div>
              <h3><a href="<?= url(ex_path($n)) ?>"><?= h($ex['title']) ?></a></h3>
              <p class="card-concept"><?= h($ex['concept']) ?></p>
              <?php if ($n === 30): ?>
                <p class="card-concept"><?= h($ex['summary']) ?></p>
              <?php endif; ?>
              <div class="card-foot">
                <span class="card-run">執行 →</span>
                <a href="<?= url('source/lesson-' . $ex['lesson']) ?>#L<?= $sourceLine[$n] ?>">原始碼</a>
              </div>
            </li>
          <?php endforeach; ?>
        </ul>
      </section>
    <?php endforeach; ?>

    <p class="empty" data-empty>找不到符合的範例，換個關鍵字試試。</p>

    <section class="checklist" aria-labelledby="check-title">
      <h2 id="check-title">課堂成果檢核</h2>
      <div><b>第 1 節</b>
        <p>能用變數、運算子與 if／elseif／match 依資料產生不同的輸出。</p>
      </div>
      <div><b>第 2 節</b>
        <p>能把多筆資料存成二維陣列，用 foreach 產生表格，並把計算寫成函式。</p>
      </div>
      <div><b>第 3 節</b>
        <p>能用 POST 接收表單，逐欄驗證、對照白名單，並以 htmlspecialchars() 安全輸出。</p>
      </div>
    </section>
  </div>
</main>
<?php render_foot(); ?>

