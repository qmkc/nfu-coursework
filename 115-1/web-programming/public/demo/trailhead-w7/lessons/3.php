<?php
/**
 * 第 3 節：表單資料接收與驗證（EX 21–30）
 * 每一題是一個函式：網址 ex/NN 由 index.php 呼叫對應的 exNN()，
 * 右邊的原始碼面板只擷取該題這一段（從 /** EX NN 開始到下一題之前）。
 */

/** EX 21 · GET 表單接收 —— 搜尋條件放在網址上 */
function ex21(): void
{
  // 沒送過表單時 $_GET['q'] 不存在，用 ?? 給預設值；再確認它真的是字串
  $q = $_GET['q'] ?? '';
  $q = is_string($q) ? trim($q) : '';

  $results = array_filter(TRAILS, function (array $t) use ($q): bool {
    if ($q === '') {
      return true;
    }
    return str_contains($t['name'] . $t['peak'] . $t['region'] . $t['trailhead'], $q);
  });
  ?>

  <form class="form" method="get" action="">
    <div class="field">
      <label for="q">搜尋路線、山名或地區</label>
      <div class="form-actions">
        <input class="input" id="q" name="q" value="<?= h($q) ?>" placeholder="例如：南投、山、湖" style="flex: 1; min-width: 0">
        <button class="btn">搜尋</button>
      </div>
    </div>
  </form>

  <dl class="kv">
    <dt>網址的查詢字串</dt><dd><code>?<?= h($_SERVER['QUERY_STRING'] ?? '') ?></code></dd>
    <dt>$_GET</dt><dd><code><?= h(json_encode($_GET, JSON_UNESCAPED_UNICODE)) ?></code></dd>
  </dl>

  <?php if ($results): ?>
    <p class="out-sub">找到 <?= count($results) ?> 條路線<?= $q !== '' ? '，符合「' . h($q) . '」' : '' ?></p>
    <ul class="chips">
      <?php foreach ($results as $t): ?>
        <li><span class="pill pill-brand"><?= $t['name'] ?> · <?= $t['region'] ?></span></li>
      <?php endforeach; ?>
    </ul>
  <?php else: ?>
    <div class="alert alert-warn"><strong>沒有符合「<?= h($q) ?>」的路線</strong>換個關鍵字試試。</div>
  <?php endif; ?>
  <?php
}

/** EX 22 · POST 表單接收 —— 資料放在請求本文，網址不會變 */
function ex22(): void
{
  // 欄位可能被改成陣列送來（team[]=x），所以用 str_param() 確認是字串
  $team = isset($_POST['team']) ? str_param($_POST, 'team') : null;
  $size = str_param($_POST, 'size', '4');
  ?>

  <form class="form" method="post" action="">
    <div class="form-row">
      <div class="field">
        <label for="team">隊名</label>
        <input class="input" id="team" name="team" value="<?= h($team ?? '') ?>" placeholder="例如：週末上山隊">
      </div>
      <div class="field">
        <label for="size">人數</label>
        <input class="input" id="size" name="size" type="number" min="1" max="12" value="<?= h($size) ?>">
      </div>
    </div>
    <div class="form-actions"><button class="btn">用 POST 送出</button></div>
  </form>

  <?php if ($team !== null): ?>
    <div class="alert alert-ok">
      <strong>伺服器收到了</strong>
      隊名「<?= h($team) ?>」，<?= h($size) ?> 人。
    </div>
    <p class="out-sub">$_POST 的內容（注意：全部都是字串）</p>
    <?= dump($_POST) ?>
  <?php else: ?>
    <p class="note">還沒送出，所以 $_POST 是空陣列：<code><?= h(json_encode($_POST)) ?></code></p>
  <?php endif; ?>

  <p class="note">送出後看看網址列——跟 EX 21 的 GET 不一樣，資料沒有出現在網址上。</p>
  <?php
}

/** EX 23 · 判斷請求方式 —— 同一支程式，顯示表單與處理送出分開走 */
function ex23(): void
{
  $method = $_SERVER['REQUEST_METHOD'];
  $isPost = $method === 'POST';

  $info = [
    'REQUEST_METHOD' => $method,
    'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? '',
    'QUERY_STRING' => $_SERVER['QUERY_STRING'] ?? '',
    'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? '',
    'HTTPS' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'on' : 'off',
    'HTTP_USER_AGENT' => mb_strimwidth($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 60, '…'),
  ];
  ?>

  <div class="verdict<?= $isPost ? '' : ' is-bad' ?>" style="<?= $isPost ? '' : 'background: var(--brand-soft)' ?>">
    <span class="verdict-icon"><?= $isPost ? '📮' : '👀' ?></span>
    <div>
      <b>這次是 <?= h($method) ?> 請求</b>
      <p><?= $isPost ? '使用者送出了表單 → 進入「處理資料」的分支。' : '使用者只是打開頁面 → 顯示空白表單。' ?></p>
    </div>
  </div>

  <div class="form-actions" style="margin-top: 1rem">
    <a class="btn btn-ghost btn-sm" href="<?= url('ex/23') ?>?from=link">用 GET 開啟（帶參數）</a>
    <form method="post" action="<?= url('ex/23') ?>"><button class="btn btn-sm" name="action" value="signup">用 POST 送出</button></form>
  </div>

  <div class="table-wrap" style="margin-top: 1rem">
    <table class="tbl">
      <thead><tr><th>$_SERVER[…]</th><th>值</th></tr></thead>
      <tbody>
        <?php foreach ($info as $key => $value): ?>
          <tr><td><code><?= $key ?></code></td><td><?= h($value) ?></td></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}

/** EX 24 · 判斷欄位是否存在 —— isset()、empty()、?? 的差別 */
function ex24(): void
{
  // 對照表：同一個值，三種判斷各自的結果
  $samples = [
    '沒有這個 key' => [],
    "''（空字串）" => ['trail' => ''],
    "'0'" => ['trail' => '0'],
    'null' => ['trail' => null],
    "'hehuan'" => ['trail' => 'hehuan'],
  ];

  // 這一頁實際收到的參數
  $hasTrail = isset($_GET['trail']);
  $trailId = $_GET['trail'] ?? 'hehuan';
  $trail = is_string($trailId) ? trail_by_id($trailId) : null;
  ?>

  <nav class="segmented" aria-label="測試不同的網址">
    <a href="<?= url('ex/24') ?>" aria-current="<?= $hasTrail ? 'false' : 'true' ?>">不帶參數</a>
    <a href="?trail=" aria-current="<?= $trailId === '' ? 'true' : 'false' ?>">?trail=</a>
    <a href="?trail=0" aria-current="<?= $trailId === '0' ? 'true' : 'false' ?>">?trail=0</a>
    <a href="?trail=yushan" aria-current="<?= $trailId === 'yushan' ? 'true' : 'false' ?>">?trail=yushan</a>
  </nav>

  <p class="lead">
    <code>$_GET['trail'] ?? 'hehuan'</code> →
    <?= $trail ? '<strong>' . h($trail['name']) . '</strong>' : '<span class="pill pill-bad">找不到「' . h($trailId) . '」這條路線</span>' ?>
  </p>

  <div class="table-wrap">
    <table class="tbl">
      <thead><tr><th>$data['trail'] 是…</th><th>isset()</th><th>empty()</th><th>?? '預設'</th></tr></thead>
      <tbody>
        <?php foreach ($samples as $label => $data): ?>
          <?php $isset = isset($data['trail']); $empty = empty($data['trail']); ?>
          <tr>
            <td><code><?= h($label) ?></code></td>
            <td><span class="pill <?= $isset ? 'pill-ok' : 'pill-bad' ?>"><?= var_export($isset, true) ?></span></td>
            <td><span class="pill <?= $empty ? 'pill-warn' : '' ?>"><?= var_export($empty, true) ?></span></td>
            <td><code><?= h(var_export($data['trail'] ?? '預設', true)) ?></code></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <p class="note">重點：isset() 只在 key 不存在或值是 null 時為 false；empty() 連 ''、'0'、0 都當成空的。</p>
  <?php
}

/** EX 25 · 表單必填驗證 —— 伺服器自己再檢查一次 */
function ex25(): void
{
  $errors = [];
  $name = '';
  $phone = '';

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = trim(str_param($_POST, 'name'));
    $phone = trim(str_param($_POST, 'phone'));

    if ($name === '') {
      $errors['name'] = '請填寫姓名（只有空白不算）';
    }
    if ($phone === '') {
      $errors['phone'] = '請填寫緊急聯絡電話';
    }
  }
  $sent = $_SERVER['REQUEST_METHOD'] === 'POST';
  ?>

  <!-- novalidate：關掉瀏覽器的檢查，才看得到伺服器端驗證的效果 -->
  <form class="form" method="post" action="" novalidate>
    <div class="form-row">
      <div class="field<?= isset($errors['name']) ? ' has-error' : '' ?>">
        <label for="name">姓名<span class="req">*</span></label>
        <input class="input" id="name" name="name" value="<?= h($name) ?>" required>
        <?php if (isset($errors['name'])): ?><span class="field-error"><?= $errors['name'] ?></span><?php endif; ?>
      </div>
      <div class="field<?= isset($errors['phone']) ? ' has-error' : '' ?>">
        <label for="phone">緊急聯絡電話<span class="req">*</span></label>
        <input class="input" id="phone" name="phone" value="<?= h($phone) ?>" required>
        <?php if (isset($errors['phone'])): ?><span class="field-error"><?= $errors['phone'] ?></span><?php endif; ?>
      </div>
    </div>
    <div class="form-actions"><button class="btn">送出</button></div>
  </form>

  <?php if ($sent && $errors): ?>
    <div class="alert alert-bad"><strong>有 <?= count($errors) ?> 個欄位沒填</strong>已經填的內容會保留，不用重打。</div>
  <?php elseif ($sent): ?>
    <div class="alert alert-ok"><strong>必填欄位都有了</strong><?= h($name) ?>，緊急聯絡電話 <?= h($phone) ?>。</div>
  <?php endif; ?>
  <?php
}

/** EX 26 · Email 格式驗證 —— filter_var() 搭配 FILTER_VALIDATE_EMAIL */
function ex26(): void
{
  $samples = ['hiker@trailhead.tw', 'hiker@@mail.com', 'hiker@mail', 'first.last+yushan@gmail.com', ' hiker@mail.com ', '登山客@mail.com'];

  $email = null;
  $valid = null;
  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim(str_param($_POST, 'email'));
    // 通過時回傳 email 本身，失敗時回傳 false
    $valid = filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
  }
  ?>

  <form class="form" method="post" action="" novalidate>
    <div class="field<?= $valid === false ? ' has-error' : '' ?>">
      <label for="email">電子郵件</label>
      <div class="form-actions">
        <input class="input" id="email" name="email" type="email" value="<?= h($email ?? '') ?>" placeholder="you@example.com" style="flex: 1; min-width: 0">
        <button class="btn">檢查</button>
      </div>
      <?php if ($valid === false): ?><span class="field-error">「<?= h($email) ?>」不是有效的 Email 格式</span><?php endif; ?>
    </div>
  </form>

  <?php if ($valid): ?>
    <div class="alert alert-ok"><strong>格式正確</strong><?= h($email) ?></div>
  <?php endif; ?>

  <p class="out-sub">幾個常見的例子</p>
  <div class="table-wrap">
    <table class="tbl">
      <thead><tr><th>輸入</th><th>filter_var() 結果</th></tr></thead>
      <tbody>
        <?php foreach ($samples as $sample): ?>
          <?php $ok = filter_var($sample, FILTER_VALIDATE_EMAIL) !== false; ?>
          <tr>
            <td><code>"<?= h($sample) ?>"</code></td>
            <td><span class="pill <?= $ok ? 'pill-ok' : 'pill-bad' ?>"><?= $ok ? '✓ 有效' : '✗ 無效' ?></span></td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>

  <p class="note">前後有空白的版本會失敗，所以表單收到的值要先 trim()。格式正確不代表信箱存在——那要寄驗證信才知道。</p>
  <?php
}

/** EX 27 · 安全輸出 —— htmlspecialchars() 擋下 XSS */
function ex27(): void
{
  $default = '<b>超讚</b>的路線！<script>alert("XSS")</script>';
  $comment = str_param($_POST, 'comment', $default);

  $safe = htmlspecialchars($comment, ENT_QUOTES, 'UTF-8');
  ?>

  <form class="form" method="post" action="">
    <div class="field">
      <label for="comment">留言（試著輸入 HTML 或 &lt;script&gt;）</label>
      <textarea class="textarea" id="comment" name="comment" rows="2"><?= $safe ?></textarea>
    </div>
    <div class="form-actions"><button class="btn">送出留言</button></div>
  </form>

  <p class="out-sub">✓ 跳脫後顯示：瀏覽器把它當「文字」</p>
  <div class="alert alert-ok"><?= $safe ?></div>

  <p class="out-sub">實際送進 HTML 的字串</p>
  <pre class="raw"><?= htmlspecialchars($safe, ENT_QUOTES, 'UTF-8') ?></pre>

  <p class="out-sub">✗ 如果直接 echo $comment，瀏覽器收到的會是：</p>
  <pre class="raw" style="border-left: 4px solid var(--bad)"><?= $safe ?></pre>
  <p class="note">上面這段是故意「顯示」原始內容給你看，並沒有真的不跳脫就輸出——不然 &lt;script&gt; 就會被執行了。</p>

  <div class="table-wrap">
    <table class="tbl">
      <thead><tr><th>字元</th><th>轉成</th></tr></thead>
      <tbody>
        <?php foreach (['<', '>', '&', '"', "'"] as $char): ?>
          <tr><td><code><?= h($char) ?></code></td><td><code><?= h(htmlspecialchars($char, ENT_QUOTES)) ?></code></td></tr>
        <?php endforeach; ?>
      </tbody>
    </table>
  </div>
  <?php
}

/** EX 28 · 單選與下拉選單 —— 收到的值一定要對照白名單 */
function ex28(): void
{
  $trailIds = array_column(TRAILS, 'id');
  $errors = [];
  $trail = 'hehuan';
  $exp = 'first';

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $trail = $_POST['trail'] ?? '';
    $exp = $_POST['exp'] ?? '';

    if (!is_string($trail) || !in_array($trail, $trailIds, true)) {
      $errors[] = '路線不在清單裡（是不是被改過？）';
    }
    if (!is_string($exp) || !array_key_exists($exp, EXPERIENCE)) {
      $errors[] = '請選擇登山經驗';
    }
  }
  $ok = $_SERVER['REQUEST_METHOD'] === 'POST' && !$errors;
  ?>

  <form class="form" method="post" action="">
    <div class="field">
      <label for="trail">想走的路線</label>
      <select class="select" id="trail" name="trail">
        <?php foreach (TRAILS as $t): ?>
          <option value="<?= $t['id'] ?>" <?= $t['id'] === $trail ? 'selected' : '' ?>><?= $t['name'] ?>（<?= $t['days'] ?> 天）</option>
        <?php endforeach; ?>
      </select>
    </div>
    <div class="field">
      <span class="label">登山經驗</span>
      <div class="options">
        <?php foreach (EXPERIENCE as $value => $label): ?>
          <label class="option">
            <input type="radio" name="exp" value="<?= $value ?>" <?= $value === $exp ? 'checked' : '' ?>>
            <span><?= $label ?></span>
          </label>
        <?php endforeach; ?>
      </div>
    </div>
    <div class="form-actions"><button class="btn">送出</button></div>
  </form>

  <?php if ($errors): ?>
    <div class="alert alert-bad"><strong>資料有誤</strong>
      <ul><?php foreach ($errors as $e): ?><li><?= $e ?></li><?php endforeach; ?></ul>
    </div>
  <?php elseif ($ok): ?>
    <?php $picked = trail_by_id($trail); ?>
    <div class="alert alert-ok">
      <strong>你選了 <?= $picked['name'] ?></strong>
      經驗：<?= EXPERIENCE[$exp] ?>。<?= $exp === 'first' && $picked['difficulty'] !== '入門' ? '第一次的話，建議先從合歡北峰開始。' : '很適合你！' ?>
    </div>
  <?php endif; ?>

  <p class="note">值都來自白名單，所以輸出時可以直接用 $picked 的資料，而不是把使用者送來的字串原樣印回去。</p>
  <?php
}

/** EX 29 · Checkbox 多選 —— name 加 [] 才會收到陣列 */
function ex29(): void
{
  $sent = $_SERVER['REQUEST_METHOD'] === 'POST';
  $people = 2;
  $picked = [];

  if ($sent) {
    $people = max(1, min(4, (int) ($_POST['people'] ?? 1)));
    $raw = $_POST['rent'] ?? [];                       // 一項都沒勾時，這個 key 根本不存在
    $raw = is_array($raw) ? array_filter($raw, 'is_string') : [];
    $picked = array_values(array_intersect($raw, array_keys(RENTALS)));   // 只留下白名單裡的
  }

  $perPerson = 0;
  foreach ($picked as $key) {
    $perPerson += RENTALS[$key][1];
  }
  ?>

  <form class="form" method="post" action="">
    <div class="field">
      <span class="label">租借裝備（可複選）</span>
      <div class="options">
        <?php foreach (RENTALS as $key => [$label, $price]): ?>
          <label class="option">
            <input type="checkbox" name="rent[]" value="<?= $key ?>" <?= in_array($key, $picked, true) ? 'checked' : '' ?>>
            <span><?= $label ?> · $<?= $price ?></span>
          </label>
        <?php endforeach; ?>
      </div>
    </div>
    <div class="field" style="max-width: 12rem">
      <label for="people">人數</label>
      <input class="input" id="people" name="people" type="number" min="1" max="4" value="<?= $people ?>">
    </div>
    <div class="form-actions"><button class="btn">計算租金</button></div>
  </form>

  <?php if ($sent): ?>
    <p class="out-sub">收到的 $_POST</p>
    <?= dump($_POST) ?>
    <?php if ($picked): ?>
      <div class="stats">
        <div class="stat"><small>勾選</small><b><?= count($picked) ?> <small>項</small></b></div>
        <div class="stat"><small>每人租金</small><b>$<?= number_format($perPerson) ?></b></div>
        <div class="stat"><small><?= $people ?> 人合計</small><b>$<?= number_format($perPerson * $people) ?></b></div>
      </div>
    <?php else: ?>
      <div class="alert alert-warn"><strong>一項都沒勾</strong>注意上面的 $_POST 裡根本沒有 rent 這個 key——所以要用 ?? [] 給預設值。</div>
    <?php endif; ?>
  <?php endif; ?>
  <?php
}

/** EX 30 · Trailhead 梯次報名整合 —— POST + 逐欄驗證 + 白名單 + 安全輸出 */
function ex30(): void
{
  /** 讀取一個字串欄位：不存在或被改成陣列都當成空字串 */
  function field(string $key): string
  {
    $value = $_POST[$key] ?? '';
    return is_string($value) ? trim($value) : '';
  }

  $form = ['name' => '', 'email' => '', 'phone' => '', 'session' => '', 'people' => '1', 'exp' => '', 'rent' => [], 'agree' => false];
  $errors = [];
  $pass = null;

  if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    foreach (['name', 'email', 'phone', 'session', 'people', 'exp'] as $key) {
      $form[$key] = field($key);
    }
    $rent = $_POST['rent'] ?? [];
    $form['rent'] = is_array($rent) ? array_values(array_intersect(array_filter($rent, 'is_string'), array_keys(RENTALS))) : [];
    $form['agree'] = isset($_POST['agree']);

    // 1. 必填與長度
    if ($form['name'] === '') {
      $errors['name'] = '請填寫姓名';
    } elseif (mb_strlen($form['name']) > 20) {
      $errors['name'] = '姓名最多 20 個字';
    }
    // 2. 格式
    if (filter_var($form['email'], FILTER_VALIDATE_EMAIL) === false) {
      $errors['email'] = 'Email 格式不正確';
    }
    if (!preg_match('/^09\d{8}$/', $form['phone'])) {
      $errors['phone'] = '手機號碼為 09 開頭的 10 位數字';
    }
    // 3. 白名單：梯次、經驗
    $session = SESSIONS[$form['session']] ?? null;
    if ($session === null) {
      $errors['session'] = '請選擇梯次';
    } elseif ($session['seats'] === 0) {
      $errors['session'] = '這個梯次已經額滿';
    }
    if (!array_key_exists($form['exp'], EXPERIENCE)) {
      $errors['exp'] = '請選擇登山經驗';
    }
    // 4. 數字範圍，以及跨欄位規則（人數不能超過剩餘名額）
    $people = filter_var($form['people'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 4]]);
    if ($people === false) {
      $errors['people'] = '人數為 1～4 人';
    } elseif ($session && $session['seats'] > 0 && $people > $session['seats']) {
      $errors['people'] = "這梯只剩 {$session['seats']} 個名額";
    }
    if (!$form['agree']) {
      $errors['agree'] = '請先閱讀並同意注意事項';
    }

    // 全部通過才計算費用、產生報名編號
    if (!$errors) {
      $trail = trail_by_id($session['trail']);
      $rentPerPerson = array_sum(array_map(fn(string $key): int => RENTALS[$key][1], $form['rent']));
      $pass = [
        'code' => 'TH-' . strtoupper(bin2hex(random_bytes(3))),
        'trail' => $trail,
        'session' => $session,
        'people' => $people,
        'rent' => $rentPerPerson,
        'total' => ($session['price'] + $rentPerPerson) * $people,
      ];
    }
  }

  /** 欄位外框的 class 與錯誤訊息 */
  function err(array $errors, string $key): string
  {
    return isset($errors[$key]) ? '<span class="field-error">' . h($errors[$key]) . '</span>' : '';
  }
  $cls = fn(string $key): string => isset($errors[$key]) ? 'field has-error' : 'field';
  ?>

  <?php if ($errors): ?>
    <div class="alert alert-bad">
      <strong>還有 <?= count($errors) ?> 個地方要修正</strong>
      <ul><?php foreach ($errors as $key => $message): ?><li><a href="#f-<?= $key ?>"><?= h($message) ?></a></li><?php endforeach; ?></ul>
    </div>
  <?php endif; ?>

  <?php if ($pass): ?>
    <div class="pass" role="status">
      <div class="pass-top"><span>TRAILHEAD · 登山證</span><span><?= $pass['code'] ?></span></div>
      <div class="pass-body">
        <div>
          <h3><?= h($pass['trail']['name']) ?></h3>
          <dl class="kv">
            <dt>報名人</dt><dd><?= h($form['name']) ?>（<?= $pass['people'] ?> 人）</dd>
            <dt>日期</dt><dd><?= $pass['session']['start'] ?><?= $pass['session']['end'] !== $pass['session']['start'] ? ' – ' . substr($pass['session']['end'], 5) : '' ?></dd>
            <dt>領隊</dt><dd><?= $pass['session']['leader'] ?></dd>
            <dt>經驗</dt><dd><?= EXPERIENCE[$form['exp']] ?></dd>
            <dt>通知信</dt><dd><?= h($form['email']) ?></dd>
          </dl>
        </div>
        <div class="pass-total">
          <small>團費 $<?= number_format($pass['session']['price']) ?><?= $pass['rent'] ? ' ＋ 租借 $' . $pass['rent'] : '' ?> × <?= $pass['people'] ?></small>
          <b>NT$ <?= number_format($pass['total']) ?></b>
        </div>
      </div>
      <svg class="pass-ridge" viewBox="0 0 400 46" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 46 L0 30 L60 14 L95 26 L150 4 L200 24 L240 12 L300 30 L350 18 L400 28 L400 46Z" fill="rgb(255 255 255 / 12%)" />
      </svg>
    </div>
    <p class="note">報名資料檢查通過。這是課堂練習：資料不會被儲存，也不會寄出任何信件。<a href="<?= url('ex/30') ?>">再報一次</a></p>
  <?php else: ?>

    <form class="form" method="post" action="" novalidate>
      <div class="form-row">
        <div class="<?= $cls('name') ?>">
          <label for="f-name">姓名<span class="req">*</span></label>
          <input class="input" id="f-name" name="name" value="<?= h($form['name']) ?>" maxlength="20" required>
          <?= err($errors, 'name') ?>
        </div>
        <div class="<?= $cls('phone') ?>">
          <label for="f-phone">手機<span class="req">*</span></label>
          <input class="input" id="f-phone" name="phone" value="<?= h($form['phone']) ?>" inputmode="numeric" placeholder="0912345678" required>
          <?= err($errors, 'phone') ?>
        </div>
      </div>

      <div class="<?= $cls('email') ?>">
        <label for="f-email">Email<span class="req">*</span></label>
        <input class="input" id="f-email" name="email" type="email" value="<?= h($form['email']) ?>" placeholder="you@example.com" required>
        <?= err($errors, 'email') ?>
      </div>

      <div class="form-row">
        <div class="<?= $cls('session') ?>">
          <label for="f-session">梯次<span class="req">*</span></label>
          <select class="select" id="f-session" name="session" required>
            <option value="">請選擇</option>
            <?php foreach (SESSIONS as $id => $s): ?>
              <option value="<?= $id ?>" <?= $id === $form['session'] ? 'selected' : '' ?>>
                <?= trail_by_id($s['trail'])['name'] ?> · <?= substr($s['start'], 5) ?> · $<?= number_format($s['price']) ?> · <?= $s['seats'] > 0 ? "剩 {$s['seats']} 位" : '已額滿' ?>
              </option>
            <?php endforeach; ?>
          </select>
          <?= err($errors, 'session') ?>
        </div>
        <div class="<?= $cls('people') ?>">
          <label for="f-people">人數<span class="req">*</span></label>
          <input class="input" id="f-people" name="people" type="number" min="1" max="4" value="<?= h($form['people']) ?>" required>
          <?= err($errors, 'people') ?>
        </div>
      </div>

      <div class="<?= $cls('exp') ?>" id="f-exp">
        <span class="label">登山經驗<span class="req">*</span></span>
        <div class="options">
          <?php foreach (EXPERIENCE as $value => $label): ?>
            <label class="option">
              <input type="radio" name="exp" value="<?= $value ?>" <?= $value === $form['exp'] ? 'checked' : '' ?>>
              <span><?= $label ?></span>
            </label>
          <?php endforeach; ?>
        </div>
        <?= err($errors, 'exp') ?>
      </div>

      <div class="field">
        <span class="label">租借裝備 <span class="field-hint">每人計價，可不選</span></span>
        <div class="options">
          <?php foreach (RENTALS as $key => [$label, $price]): ?>
            <label class="option">
              <input type="checkbox" name="rent[]" value="<?= $key ?>" <?= in_array($key, $form['rent'], true) ? 'checked' : '' ?>>
              <span><?= $label ?> +$<?= $price ?></span>
            </label>
          <?php endforeach; ?>
        </div>
      </div>

      <div class="<?= $cls('agree') ?>">
        <label class="check" for="f-agree">
          <input type="checkbox" id="f-agree" name="agree" value="1" <?= $form['agree'] ? 'checked' : '' ?>>
          <span>我了解高山行程有風險，出發前會確認身體狀況並申請入山／入園證。</span>
        </label>
        <?= err($errors, 'agree') ?>
      </div>

      <div class="form-actions">
        <button class="btn">送出報名</button>
        <span class="field-hint">表單加了 novalidate，所有檢查都由 PHP 在伺服器上完成。</span>
      </div>
    </form>
  <?php endif; ?>
  <?php
}
