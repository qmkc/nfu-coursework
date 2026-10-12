export interface WeekLink {
  label: string;
  url: string;
  /** 顯眼的 CTA 按鈕，跟其他參考連結分開顯示——用在「這個就是本週成果，點進去看」的連結。 */
  primary?: boolean;
}

export interface WeekCode {
  lang: string;
  filename?: string;
  snippet: string;
}

export interface WeekDetail {
  objectives?: string[];
  showcase?: string;
  links?: WeekLink[];
  code?: WeekCode;
  reflection?: string;
}

export const weekContent: Record<number, WeekDetail> = {
  1: {
    objectives: [
      '建立本學期課程用的 GitHub Repository，規劃資料夾與版本控制流程',
      '認識 InfinityFree 免費虛擬主機，並申請網站空間',
      '使用 GitHub Actions 建立 CI/CD，推送至 main 分支時自動建置並部署',
      '撰寫並強化 FTP 部署腳本（scripts/ftp-deploy.sh），加入路徑與 manifest 驗證邏輯',
    ],
    showcase:
      '完成後，只要將程式碼推送到 main 分支，GitHub Actions 就會自動安裝 Composer / pnpm 依賴、執行建置，並透過 lftp 以 mirror 模式，依 .deploy-manifest 差異同步到 InfinityFree 的 /htdocs 目錄，全程不需要手動上傳檔案。',
    links: [
      { label: '原始碼（GitHub）', url: 'https://github.com/qmkc/nfu-coursework/tree/main/115-1/web-programming' },
    ],
    code: {
      lang: 'md',
      snippet: 'https://github.com/qmkc/nfu-coursework/blob/main/115-1/web-programming/scripts/ftp-deploy.sh',
    },
    reflection:
      '這週的重點不是寫網頁本身，而是把「部署」這件事自動化。一開始手動用 FTP 軟體上傳檔案，後來發現每次改一行程式碼就要重新上傳整個資料夾很沒效率，於是改用 GitHub Actions 搭配 lftp 做差異同步。過程中遇到最多問題的是路徑與權限驗證：一旦 manifest 或路徑判斷寫錯，就有可能誤刪不該刪除的檔案，所以後續又花了不少時間強化驗證邏輯（見 460e0a5、bbf39c5、b610099 幾次提交）。這讓我體會到自動化部署腳本雖然一次寫好可以省下很多重複工作，但也要特別小心邊界情況，寫測試或至少手動驗證過一輪再上線。',
  },

  2: {
    objectives: [
      '建立 About Me 頁面，整理個人資訊、技能與 GitHub 作品連結',
      '規劃一份「可公開瀏覽的原始碼白名單」資料檔，決定哪些檔案可以被看到',
      '建立獨立的原始碼瀏覽頁（列表 + 單一檔案），把網站自己的程式碼攤開來給人看',
      '學習這個專案「靜態頁面 build 期產生、找不到才交給 PHP 即時渲染」的路由設計，並實際寫一條動態路由',
    ],
    showcase:
      '新增了 /about/ 個人介紹頁，以及 /source/ 原始碼瀏覽頁：/source/ 是清單，點進去 /source/{slug}/ 才會即時讀檔顯示內容。清單只列出白名單允許的檔案，並在讀檔前用 realpath 確認路徑仍在專案目錄內，避免任意檔案讀取。',
    links: [
      { label: 'About Me 頁面', url: '/about/' },
      { label: '原始碼瀏覽頁', url: '/source/' },
    ],
    code: {
      lang: 'php',
      filename: "src/app/source/[slug]/page.php",
      snippet: `$code = null;
if ($file !== null) {
  $projectRoot = realpath($root);
  $fullPath = realpath("{$root}/{$file['path']}");

  // 只有白名單裡的檔案、且解析後路徑仍在專案目錄內，才允許讀取
  if ($projectRoot !== false && $fullPath !== false && is_file($fullPath) && str_starts_with($fullPath, $projectRoot)) {
    $code = file_get_contents($fullPath);
  } else {
    $file = null;
  }
}`,
    },
    reflection:
      '這週學到的重點其實是「不要相信網址參數」。一開始想得很簡單：/source/{slug}/ 拿到 slug 就直接讀對應檔案，後來想到如果之後改成讓使用者自己輸入檔名，就可能被拿去讀專案目錄外的檔案（路徑穿越）。所以最後改成先查一份固定的白名單（source-files.php），只有清單裡登記過的檔案才讀得到，讀之前還多做一次 realpath 檢查，確認真正解析出來的路徑仍在專案資料夾裡面。另外也第一次在這個專案裡寫「動態路由」（static => false），跟前面幾個 build 期就決定好內容的靜態頁面不同，這條路由要等使用者實際請求時才由 public/router.php 即時執行 PHP 產生內容，讓我更清楚這個專案「能靜態就靜態、不能才動態」的設計想法。',
  },

  3: {
    objectives: [
      '練習 Bootstrap 5 常用元件：Navbar + Collapse、Carousel、Accordion、Table、Grid（row/col）、Card、Badge、Button',
      '搭配 Bootstrap Icons 補圖示，不另外加圖示字型或 SVG 套件',
      '原本用獨立的 Vite 專案練習，後來整支併進主站變成 /demo/iphone-duo/ 這條路由——自己一整套重新編譯過的 Bootstrap（深色風格），靠 Next.js 的 per-route code splitting 跟主站的樣式互不干擾',
      '練習 Bootstrap 元件跟其他函式庫搭配：Three.js 互動 3D 模型、GSAP ScrollTrigger/ScrollSmoother 捲動動畫',
    ],
    showcase:
      '做了一個「iPhone Duo」摺疊手機形象頁練習（純屬課程練習用的虛構產品，非蘋果官方網站），用到 Bootstrap 的 Navbar（含 Collapse 漢堡選單）、Carousel（實機照片輪播）、Accordion（常見問題）、Table（規格表）、Grid 版面、Card、Badge、Button 等元件。畫面中央可拖曳旋轉、展開/摺疊的 3D 模型是另外用 Three.js 做的，不是 Bootstrap 的一部分。提醒一下：Demo 裡的 3D 模型跟部分截圖是 scripts/prepare-assets.py 即時從 Apple 官網抓的官方素材，專案自己的 .gitignore 有特別註記「not ours to redistribute」，這裡選擇照樣公開部署，純粹課程練習、非商業用途。',
    links: [
      { label: '查看 Demo', url: '/demo/iphone-duo/', primary: true },
      {
        label: '原始碼（GitHub）',
        url: 'https://github.com/qmkc/nfu-coursework/tree/main/115-1/web-programming/src/app/demo/iphone-duo',
      },
    ],
    code: {
      lang: 'tsx',
      filename: 'src/app/demo/iphone-duo/page.tsx',
      snippet: `<div className="accordion-item">
  <h2 className="accordion-header">
    <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
      摺疊螢幕會留下明顯的摺痕嗎？
    </button>
  </h2>
  <div id="faq1" className="accordion-collapse collapse show" data-bs-parent="#faqAccordion">
    <div className="accordion-body">
      iPhone Duo 採用鈦金屬鉸鏈結構搭配全新面板工藝，摺痕在正常使用角度下幾乎不可見，鉸鏈並經過長期摺疊耐用測試。
    </div>
  </div>
</div>`,
    },
  },

  4: {
    objectives: ['本週適逢教師節放假，沒有上課，課程進度順延到第 05 週'],
    showcase: '本週停課，沒有新的課堂成果。',
    code: {
      lang: 'txt',
      snippet: '（本週停課，沒有程式碼）',
    },
    reflection: '本週放假沒有上課。',
  },

  5: {
    objectives: [
      '在 Bootstrap 5 的版面與元件之上，搭配老師指定的三個函式庫：AOS（捲動進場動畫）、SweetAlert2（對話框／提示）、Chart.js（圖表）',
      '另外自己找三個函式庫整合進同一個網站：Swiper（路線卡片輪播）、Leaflet（互動地圖）、Typed.js（首頁打字效果）',
      '練習把各函式庫的初始化集中在一個 init()，並回傳 cleanup，離開頁面時把地圖、圖表、輪播一併銷毀',
      '練習 Bootstrap 的 Offcanvas、ScrollSpy、Progress、Accordion、Table、List group 等元件',
    ],
    showcase:
      '做了一個「山行 Trailhead」台灣高山步道指南（課程練習用，梯次與報名流程皆為虛構）。首頁標題用 Typed.js 輪播；六條路線的卡片用 Swiper 左右滑動，卡片照片上那條白線是直接拿該路線的海拔剖面資料畫成的 SVG；Leaflet 地圖標出每座山的位置，點清單會飛過去；Chart.js 畫了里程長條圖、難度圓餅圖，以及可以切換路線的海拔剖面折線圖；「加入行程」「報名梯次」「裝備清單打勾完成」都用 SweetAlert2 回饋；各區塊進場動畫用 AOS。另外加了照片牆（照片來自 Wikimedia Commons，頁尾標示作者與授權）、首頁照片視差與山名跑馬燈等 CSS 動畫，以及 CountUp.js 的數字跳動和 canvas-confetti 的彩帶。',
    links: [
      { label: '查看 Demo', url: '/demo/trailhead/', primary: true },
      {
        label: '原始碼（GitHub）',
        url: 'https://github.com/qmkc/nfu-coursework/tree/main/115-1/web-programming/src/app/demo/trailhead',
      },
      { label: '老師的範例（GoLearn 線上學習平台）', url: 'https://goclass.infinityfreeapp.com/weekly/week05/index.html' },
    ],
    code: {
      lang: 'ts',
      filename: 'src/app/demo/trailhead/initTrailPage.ts',
      snippet: `// Leaflet：每座山一個標記，點左側清單就飛過去並打開說明
for (const trail of trails) {
  const marker = L.marker([trail.lat, trail.lng], {
    title: trail.peak,
    icon: L.divIcon({ className: "trail-marker", html: '<i class="bi bi-triangle-fill"></i>' }),
  })
    .addTo(map)
    .bindPopup(popup);
  markers.set(trail.id, marker);
}

document.querySelectorAll<HTMLButtonElement>("[data-fly]").forEach((btn) => {
  on(btn, "click", () => {
    const trail = trailById.get(btn.dataset.fly ?? "");
    const marker = trail && markers.get(trail.id);
    if (!map || !trail || !marker) return;
    map.flyTo([trail.lat, trail.lng], 12, { duration: 1.2 });
    marker.openPopup();
  });
});`,
    },
  },

  6: {
    objectives: [
      '認識 HTML 表單的基本組成：form、label、input、name／id，以及 radio、checkbox、select、date、range、textarea 等元件',
      '用 Bootstrap 的表單樣式排版：Floating labels、Input group、btn-check（把單選／複選做成卡片與標籤）、Switch、Grid 響應式欄位',
      '用 HTML5 原生驗證（required、minlength、pattern、min／max）搭配 Bootstrap 的 was-validated 顯示錯誤訊息',
      '用 JavaScript 處理表單事件：input 做即時預覽、submit 搭配 preventDefault()、reset 後更新畫面，並用 FormData／getAll() 讀取資料',
      '用 setCustomValidity() 補上 HTML 屬性做不到的規則：跨欄位比對（確認密碼、緊急聯絡人手機、剩餘名額）、身分證字號檢查碼、複選至少一項、檔案類型與大小',
      '讀 ValidityState（valueMissing、typeMismatch、patternMismatch…）產生錯誤訊息，做出錯誤摘要、aria-invalid 與離開欄位後才即時驗證的體驗，最後用 SweetAlert2 做確認視窗',
    ],
    showcase:
      '老師要求每週成果分開，所以把 Week 5 的「山行 Trailhead」整份複製成 /demo/trailhead-w6/ 再加上表單（Week 5 的版本維持原樣）。新增三個表單：路線篩選（搜尋框、難度單選、天數滑桿，打字當下就即時過濾卡片）、三步驟線上報名（每一步各自驗證，沒過會停在該步並把游標移到第一個錯誤欄位），以及頁尾的電子報訂閱。驗證的部分做得比較完整：必填、長度、Email／網址／手機格式、生日需滿 16 歲、說明會日期不能早於今天等用 HTML5 屬性；身分證字號檢查碼、密碼與確認密碼一致、通知方式至少勾一項、勾了 LINE 才出現且必填的 LINE ID、上傳檔案的類型與大小（2 MB）用 JavaScript 補上。欄位離開後才開始即時顯示對錯，驗證沒過時表單上方會列出所有錯誤欄位（點了會跳過去），另外還有密碼強度條、顯示／隱藏密碼和必填欄位完成度。報名表單右邊有一張「登山證」會跟著輸入內容即時更新，包含依梯次、人數、租借裝備算出的預估費用；梯次表的「選這梯」會把梯次帶進表單，送出後名額也會跟著扣掉。所有資料都只留在瀏覽器，不會傳到任何伺服器。',
    links: [
      { label: '查看 Demo', url: '/demo/trailhead-w6/', primary: true },
      {
        label: '原始碼（GitHub）',
        url: 'https://github.com/qmkc/nfu-coursework/tree/main/115-1/web-programming/src/app/demo/trailhead-w6',
      },
      { label: 'Week 5 的版本（沒有表單）', url: '/demo/trailhead/' },
      { label: '老師的範例（GoLearn 表單應用教學網站）', url: 'https://goclass.infinityfreeapp.com/weekly/week06/index.html' },
    ],
    code: {
      lang: 'ts',
      filename: 'src/app/demo/trailhead-w6/forms.ts',
      snippet: `// HTML 屬性寫不出來的跨欄位規則，用 setCustomValidity() 補上
function applyCustomRules(): void {
  const sameNumber = emergencyPhone.value !== "" && emergencyPhone.value === phone.value;
  emergencyPhone.setCustomValidity(sameNumber ? "same" : "");

  const seats = seatsLeft[Number(sessionSelect.value)];
  const overbooked = sessionSelect.value !== "" && Number(people.value) > seats;
  people.setCustomValidity(overbooked ? "overbooked" : "");
}

// 驗證單一步驟：沒過就顯示 Bootstrap 的錯誤樣式，並把游標移到第一個錯誤欄位
function validateStep(index: number): boolean {
  applyCustomRules();
  const step = steps[index];
  step.classList.add("was-validated");
  const invalid = step.querySelector<HTMLElement>(":invalid");
  if (!invalid) return true;
  invalid.focus();
  return false;
}`,
    },
  },};
