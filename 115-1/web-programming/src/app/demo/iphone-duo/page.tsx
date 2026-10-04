import { DuoPageScript } from './DuoPageScript';

/**
 * Ported from my-project/src/index.html (Week 3: Bootstrap 常用元件練習).
 * Markup, ids, and classes are kept identical to the original — initDuoPage.ts
 * and styles.scss both depend on them exactly as written here.
 */
export default function IphoneDuoPage() {
  return (
    <>
      <DuoPageScript />

      {/* Scroll progress — fills left to right with overall page scroll */}
      <div className="scroll-progress" id="scrollProgress" aria-hidden="true" />

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top navbar-glass" id="mainNav">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2" href="#top">
            <i className="bi bi-phone-flip" />
            <span>
              iPhone <span className="text-gradient">Duo</span>
            </span>
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMenu">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navMenu">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-2">
              <li className="nav-item">
                <a className="nav-link" href="#highlights">
                  亮點
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#camera">
                  相機系統
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#colors">
                  配色
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#specs">
                  規格
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#pricing">
                  選購
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#faq">
                  常見問題
                </a>
              </li>
              <li className="nav-item ms-lg-3">
                <a href="#pricing" className="btn btn-glow btn-sm rounded-pill px-3">
                  立即預購
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <div id="smooth-wrapper">
        <div id="smooth-content">
          {/* Hero */}
          <header className="hero" id="top">
            <div className="blob-parallax blob-parallax-1">
              <div className="blob blob-1" />
            </div>
            <div className="blob-parallax blob-parallax-2">
              <div className="blob blob-2" />
            </div>
            <div className="container position-relative">
              <div className="row align-items-center align-items-lg-start gy-5">
                <div className="col-lg-6">
                  <span className="badge-pill-glass d-inline-block mb-3">全新登場 · A20 Pro</span>
                  <h1 className="mb-3">
                    <span className="hero-line1">摺疊，即是</span>
                    <br />
                    <span className="text-gradient">全新格局。</span>
                  </h1>
                  <p className="hero-lead fs-5 mb-4">
                    iPhone Duo 搭載 7.6 吋摺疊螢幕與鈦金屬摺疊機身，展開就是史上最大的 iPhone 螢幕，比 iPhone 18 Pro
                    Max 大上 50%。
                  </p>
                  <div className="d-flex flex-wrap gap-3">
                    <a href="#pricing" className="btn btn-glow btn-lg rounded-pill px-4">
                      立即預購
                    </a>
                    <a href="#highlights" className="btn btn-outline-glow btn-lg rounded-pill px-4">
                      <i className="bi bi-play-circle me-1" /> 觀看介紹
                    </a>
                  </div>
                  <div className="d-flex flex-wrap gap-4 mt-5 text-secondary small">
                    <div className="hero-trust-item">
                      <i className="bi bi-shield-check text-info me-1" /> 一年保固
                    </div>
                    <div className="hero-trust-item">
                      <i className="bi bi-arrow-repeat text-info me-1" /> 舊機換新
                    </div>
                    <div className="hero-trust-item">
                      <i className="bi bi-calendar-event text-info me-1" /> 10/16 開放預購
                    </div>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div className="model-pin-area" id="modelPinArea">
                    <div className="model-glow" />
                    <div className="model-stage" id="modelStage">
                      <canvas
                        id="duoCanvas"
                        aria-label="iPhone Duo 互動 3D 模型，可拖曳旋轉，上下滑動或捲動頁面可展開或摺疊"
                      />
                      <div className="model-loading" id="modelLoading">
                        <span className="spinner-border spinner-border-sm" role="status" />
                        <span id="modelLoadingText">載入 3D 模型中…</span>
                      </div>
                    </div>
                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-4">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-glow rounded-pill fold-btn active"
                        data-state="folded"
                      >
                        <i className="bi bi-phone me-1" />
                        摺疊狀態
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-glow rounded-pill fold-btn"
                        data-state="unfolded"
                      >
                        <i className="bi bi-tablet me-1" />
                        展開狀態
                      </button>
                    </div>
                    <div className="fold-slider-row mt-3" role="group" aria-label="摺疊進度控制">
                      <button
                        type="button"
                        className="fold-play-btn"
                        id="foldPlayBtn"
                        aria-label="自動展示摺疊動畫"
                        aria-pressed="false"
                      >
                        <i className="bi bi-play-fill" id="foldPlayIcon" />
                        <i className="bi bi-pause-fill d-none" id="foldPauseIcon" />
                      </button>
                      <input
                        type="range"
                        className="fold-slider"
                        id="foldSlider"
                        min={0}
                        max={100}
                        defaultValue={0}
                        step={0.1}
                        aria-label="摺疊角度，0 為完全摺疊，100 為完全展開"
                      />
                    </div>
                    <div className="d-flex flex-wrap justify-content-center gap-2 mt-3">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-glow rounded-pill camera-btn"
                        data-preset="front"
                        title="正面鏡頭"
                      >
                        <i className="bi bi-square" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-glow rounded-pill camera-btn"
                        data-preset="back"
                        title="背面鏡頭"
                      >
                        <i className="bi bi-square-fill" />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-glow rounded-pill camera-btn"
                        data-preset="macro"
                        title="鏡頭特寫"
                      >
                        <i className="bi bi-camera2" />
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-glow rounded-pill" id="wallpaperBtn" title="切換螢幕內容">
                        <i className="bi bi-image" />
                      </button>
                    </div>
                    <p className="text-secondary small text-center mt-3">
                      <i className="bi bi-arrows-move me-1" />
                      拖曳旋轉 · <i className="bi bi-hand-index-thumb me-1" />
                      捲動頁面可展開 / 摺疊
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Marquee */}
          <div className="marquee">
            <div className="marquee-track">
              <span>
                <i className="bi bi-cpu" />
                A20 Pro 晶片
              </span>
              <span>
                <i className="bi bi-phone-flip" />
                7.6 吋摺疊螢幕
              </span>
              <span>
                <i className="bi bi-gem" />
                鈦金屬摺疊機身
              </span>
              <span>
                <i className="bi bi-battery-charging" />
                雙電池系統
              </span>
              <span>
                <i className="bi bi-droplet-half" />
                IP68 防水防塵
              </span>
              <span>
                <i className="bi bi-cpu" />
                A20 Pro 晶片
              </span>
              <span>
                <i className="bi bi-phone-flip" />
                7.6 吋摺疊螢幕
              </span>
              <span>
                <i className="bi bi-gem" />
                鈦金屬摺疊機身
              </span>
              <span>
                <i className="bi bi-battery-charging" />
                雙電池系統
              </span>
              <span>
                <i className="bi bi-droplet-half" />
                IP68 防水防塵
              </span>
            </div>
          </div>

          {/* Real photography: folded / unfolded crossfade */}
          <section className="section pt-0" id="photos">
            <div className="container">
              <div className="row align-items-center gy-5">
                <div className="col-lg-6 order-lg-2 reveal">
                  <span className="badge-pill-glass mb-3 d-inline-block">實機照片</span>
                  <h2 className="fw-bold display-6 mb-3">
                    摺起來是手機，
                    <br />
                    展開來是平板。
                  </h2>
                  <p className="text-secondary fs-5 mb-4">
                    上方是完整的 3D 模型，這裡則是 Apple 官方拍攝的實機照片 —— 單手摺疊、雙手展開，兩種真實的持握方式。
                  </p>
                  <div className="d-flex gap-2">
                    <button type="button" className="btn btn-sm btn-outline-glow rounded-pill fold-btn active" data-state="folded">
                      <i className="bi bi-phone me-1" />
                      摺疊狀態
                    </button>
                    <button type="button" className="btn btn-sm btn-outline-glow rounded-pill fold-btn" data-state="unfolded">
                      <i className="bi bi-tablet me-1" />
                      展開狀態
                    </button>
                  </div>
                </div>
                <div className="col-lg-6 order-lg-1 reveal">
                  <div className="photo-card">
                    <div className="photo-stage">
                      <img
                        src="/iphone-duo/img/duo-folded.jpg"
                        alt="iPhone Duo 摺疊狀態，單手持握，顯示外螢幕主畫面"
                        className="phone-photo active"
                        id="photoFolded"
                      />
                      <img
                        src="/iphone-duo/img/duo-unfolded.jpg"
                        alt="iPhone Duo 展開狀態，雙手持握，顯示 7.6 吋內螢幕主畫面"
                        className="phone-photo"
                        id="photoUnfolded"
                      />
                    </div>
                    <p className="photo-caption">實際產品照片 · Apple 提供</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Highlights */}
          <section className="section" id="highlights">
            <div className="container">
              <div className="text-center mb-5 reveal">
                <span className="badge-pill-glass mb-3 d-inline-block">為什麼選擇 Duo</span>
                <h2 className="fw-bold display-6">展開全新可能</h2>
              </div>
              <div className="row g-4">
                {[
                  { icon: 'bi-phone-flip', title: '7.6 吋摺疊螢幕', desc: '史上最大 iPhone 螢幕，展開即是平板級視野；折起則是 5.4 吋外螢幕，隨身輕巧。' },
                  { icon: 'bi-cpu', title: 'A20 Pro 晶片', desc: '雙 16 核心神經網路引擎，運行 Apple Intelligence 與大型 AI 模型毫無延遲。' },
                  { icon: 'bi-gem', title: '鈦金屬摺疊機身', desc: '五級鈦金屬鉸鏈結構，超瓷晶盾 2 表面，摺疊十萬次依然堅固如初。' },
                  { icon: 'bi-battery-charging', title: '雙電池系統', desc: '一般使用最長 24 小時，外螢幕播放影片最長可達 44 小時，60W 快充 20 分鐘充至 50%。' },
                  { icon: 'bi-fingerprint', title: '側邊 Touch ID', desc: '整合於電源鍵的指紋辨識器，摺疊或展開狀態都能單手快速解鎖。' },
                  { icon: 'bi-droplet-half', title: 'IP68 防水防塵', desc: '最深可於 6 公尺水下停留 30 分鐘，摺疊鉸鏈同樣通過嚴格防水測試。' },
                ].map((item) => (
                  <div className="col-md-4 reveal" key={item.title}>
                    <div className="feature-card">
                      <span className="spotlight" />
                      <div className="icon-wrap">
                        <i className={`bi ${item.icon}`} />
                      </div>
                      <h5 className="fw-bold">{item.title}</h5>
                      <p className="text-secondary mb-0">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Lifestyle banner */}
          <div className="img-banner reveal">
            <div className="img-banner-media" style={{ backgroundImage: 'url("/iphone-duo/img/duo-cinematic.jpg")' }} />
            <div className="img-banner-overlay" />
            <div className="container position-relative text-center">
              <span className="badge-pill-glass mb-3 d-inline-block">隨手展開</span>
              <h2 className="fw-bold display-5 text-white">口袋大小，展開就是全世界</h2>
            </div>
          </div>

          {/* Camera showcase */}
          <section className="section" id="camera" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="container">
              <div className="row align-items-center gy-5">
                <div className="col-lg-5 text-center reveal">
                  <div className="photo-card photo-card--tight">
                    <img src="/iphone-duo/img/duo-camera-macro.jpg" alt="iPhone Duo 雙主鏡頭特寫" className="photo-card-img" loading="lazy" />
                    <p className="photo-caption">實際產品照片 · Apple 提供</p>
                  </div>
                </div>
                <div className="col-lg-7 reveal">
                  <span className="badge-pill-glass mb-3 d-inline-block">4800 萬像素融合相機系統</span>
                  <h2 className="fw-bold display-6 mb-3">摺起來拍，展開來看</h2>
                  <p className="text-secondary fs-5 mb-4">
                    三顆鏡頭融合演算法即時運算，外加隱藏式螢幕下鏡頭，讓你摺疊自拍、展開檢視，構圖從沒這麼直覺過。
                  </p>
                  <ul className="list-unstyled d-flex flex-column gap-3">
                    <li className="d-flex gap-3">
                      <i className="bi bi-check-circle-fill text-info fs-5" />
                      <span>4800 萬像素主鏡頭融合 + 1200 萬像素 2 倍望遠 + 4800 萬像素超廣角</span>
                    </li>
                    <li className="d-flex gap-3">
                      <i className="bi bi-check-circle-fill text-info fs-5" />
                      <span>外螢幕 1200 萬像素 Center Stage 前鏡頭，自拍自動置中</span>
                    </li>
                    <li className="d-flex gap-3">
                      <i className="bi bi-check-circle-fill text-info fs-5" />
                      <span>內螢幕隱藏式鏡頭，展開後即可視訊、預覽，不遮擋畫面</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Colors */}
          <section className="section" id="colors">
            <div className="container text-center">
              <span className="badge-pill-glass mb-3 d-inline-block reveal">配色</span>
              <h2 className="fw-bold display-6 mb-5 reveal">挑一款屬於你的 Duo</h2>
              <div className="d-flex justify-content-center gap-4 mb-3 reveal" id="colorSwatches">
                <button
                  type="button"
                  className="color-swatch active"
                  style={{ background: 'linear-gradient(160deg, #f7f4ec, #d8d3c2)' }}
                  data-accent="#d8b26b"
                  data-accent2="#f4dca0"
                  data-colorway="starlight"
                  data-name="星光白色"
                />
                <button
                  type="button"
                  className="color-swatch"
                  style={{ background: 'linear-gradient(160deg, #2b2b30, #030303)' }}
                  data-accent="#6e6bff"
                  data-accent2="#2cb1ff"
                  data-colorway="midnight"
                  data-name="夜空色"
                />
              </div>
              <p className="text-secondary" id="colorName">
                星光白色
              </p>

              <div id="gallery" className="carousel slide reveal mt-4" data-bs-ride="carousel">
                <div className="carousel-inner">
                  <div className="carousel-item active">
                    <div className="gallery-slide">
                      <img src="/iphone-duo/img/duo-back-library.jpg" alt="iPhone Duo 背面鈦金屬機身與雙鏡頭" loading="lazy" />
                      <div className="gallery-caption">星光白色 · 鈦金屬機身</div>
                    </div>
                  </div>
                  <div className="carousel-item">
                    <div className="gallery-slide">
                      <img src="/iphone-duo/img/duo-camera-hold.jpg" alt="iPhone Duo 雙手持握，展示正反面" loading="lazy" />
                      <div className="gallery-caption">展開狀態 · 正反面</div>
                    </div>
                  </div>
                  <div className="carousel-item">
                    <div className="gallery-slide">
                      <img src="/iphone-duo/img/duo-design-triptych.jpg" alt="iPhone Duo 鎖定畫面、背面與相機三視圖" loading="lazy" />
                      <div className="gallery-caption">鎖定畫面 · 背面設計</div>
                    </div>
                  </div>
                </div>
                <button className="carousel-control-prev" type="button" data-bs-target="#gallery" data-bs-slide="prev">
                  <span className="carousel-control-prev-icon" />
                </button>
                <button className="carousel-control-next" type="button" data-bs-target="#gallery" data-bs-slide="next">
                  <span className="carousel-control-next-icon" />
                </button>
              </div>
            </div>
          </section>

          {/* Specs */}
          <section className="section" id="specs" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="container">
              <div className="text-center mb-5 reveal">
                <span className="badge-pill-glass mb-3 d-inline-block">規格</span>
                <h2 className="fw-bold display-6">摺疊前後，一次看懂</h2>
              </div>
              <div className="table-responsive reveal mb-5">
                <table className="table specs-table align-middle">
                  <thead>
                    <tr>
                      <th>螢幕規格</th>
                      <th className="text-center">摺疊狀態（外螢幕）</th>
                      <th className="text-center table-highlight">展開狀態（內螢幕）</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>尺寸</td>
                      <td className="text-center">5.4 吋 OLED</td>
                      <td className="text-center table-highlight">7.6 吋 OLED</td>
                    </tr>
                    <tr>
                      <td>解析度</td>
                      <td className="text-center">1398 x 2034，460 ppi</td>
                      <td className="text-center table-highlight">1878 x 2670，430 ppi</td>
                    </tr>
                    <tr>
                      <td>更新率 / 亮度</td>
                      <td className="text-center">120Hz ProMotion，最高 3000 nits</td>
                      <td className="text-center table-highlight">120Hz ProMotion，最高 3000 nits</td>
                    </tr>
                    <tr>
                      <td>前鏡頭</td>
                      <td className="text-center">1200 萬像素 Center Stage</td>
                      <td className="text-center table-highlight">隱藏式螢幕下鏡頭</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="row g-4 reveal">
                <div className="col-md-6">
                  <div className="feature-card h-100">
                    <span className="spotlight" />
                    <h5 className="fw-bold mb-3">
                      <i className="bi bi-cpu text-info me-2" />
                      效能與機身
                    </h5>
                    <ul className="list-unstyled d-flex flex-column gap-2 text-secondary mb-0">
                      <li>晶片：A20 Pro，6 核心 CPU，雙 16 核心神經網路引擎</li>
                      <li>機身：鈦金屬摺疊設計，超瓷晶盾 2</li>
                      <li>防護：IP68（6 公尺，最長 30 分鐘）</li>
                      <li>尺寸：展開 164.6 x 117.8 x 5.2mm；摺疊 84.1 x 117.8 x 11.3mm</li>
                      <li>重量：254g</li>
                    </ul>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="feature-card h-100">
                    <span className="spotlight" />
                    <h5 className="fw-bold mb-3">
                      <i className="bi bi-camera2 text-info me-2" />
                      相機與電力
                    </h5>
                    <ul className="list-unstyled d-flex flex-column gap-2 text-secondary mb-0">
                      <li>相機：4800 萬像素融合主鏡頭 + 1200 萬像素 2 倍望遠 + 4800 萬像素超廣角</li>
                      <li>電力：一般使用最長 24 小時；外螢幕播放影片最長 44 小時</li>
                      <li>充電：60W 有線 20 分鐘充至 50%，支援 25W MagSafe / Qi2 無線充電</li>
                      <li>生物辨識：側邊 Touch ID 指紋辨識</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="section" id="pricing">
            <div className="container">
              <div className="text-center mb-5 reveal">
                <span className="badge-pill-glass mb-3 d-inline-block">選購方案</span>
                <h2 className="fw-bold display-6">立即預購 iPhone Duo</h2>
                <p className="text-secondary mt-2">10/16 開放預購 · 10/23 正式上市 · 可選 0% 分期付款</p>
              </div>
              <div className="row g-4 justify-content-center">
                {[
                  { tier: '256GB', price: 'NT$74,900', features: ['7.6 吋摺疊螢幕', 'A20 Pro 晶片', '雙電池系統'], featured: false },
                  {
                    tier: '512GB',
                    price: 'NT$81,900',
                    features: ['7.6 吋摺疊螢幕', 'A20 Pro 晶片', '雙電池系統', '大容量儲存，適合影音創作'],
                    featured: true,
                  },
                  { tier: '1TB', price: 'NT$96,900', features: ['7.6 吋摺疊螢幕', 'A20 Pro 晶片', '雙電池系統', '專業級儲存空間'], featured: false },
                  { tier: '2TB', price: 'NT$118,900', features: ['7.6 吋摺疊螢幕', 'A20 Pro 晶片', '雙電池系統', '旗艦最大容量'], featured: false },
                ].map((plan) => (
                  <div className="col-lg-3 col-md-6 reveal" key={plan.tier}>
                    <div className={`price-card${plan.featured ? ' featured position-relative' : ''}`}>
                      <span className="spotlight" />
                      {plan.featured && (
                        <span className="badge-pill-glass position-absolute top-0 start-50 translate-middle">最受歡迎</span>
                      )}
                      <h5 className="fw-bold text-secondary text-uppercase small">{plan.tier}</h5>
                      <div className="display-6 fw-bold mb-3">{plan.price}</div>
                      <ul className="list-unstyled d-flex flex-column gap-2 text-secondary mb-4">
                        {plan.features.map((f) => (
                          <li key={f}>
                            <i className="bi bi-check2 text-info me-2" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <a href="#" className={`btn w-100 rounded-pill ${plan.featured ? 'btn-glow' : 'btn-outline-glow'}`}>
                        選購
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section className="section" id="faq" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
            <div className="container">
              <div className="text-center mb-5 reveal">
                <span className="badge-pill-glass mb-3 d-inline-block">常見問題</span>
                <h2 className="fw-bold display-6">還有疑問？</h2>
              </div>
              <div className="row justify-content-center">
                <div className="col-lg-8 reveal">
                  <div className="accordion accordion-glass" id="faqAccordion">
                    {[
                      {
                        id: 'faq1',
                        q: '摺疊螢幕會留下明顯的摺痕嗎？',
                        a: 'iPhone Duo 採用鈦金屬鉸鏈結構搭配全新面板工藝，摺痕在正常使用角度下幾乎不可見，鉸鏈並經過長期摺疊耐用測試。',
                        open: true,
                      },
                      {
                        id: 'faq2',
                        q: '摺疊時跟展開時，可以用一樣的方式操作嗎？',
                        a: '可以。摺疊狀態下的外螢幕與展開後的內螢幕共用同一套 iOS 27 體驗，App 會依螢幕比例自動調整版面，展開後更支援分割畫面多工。',
                        open: false,
                      },
                      {
                        id: 'faq3',
                        q: '舊機換新如何計算折抵金額？',
                        a: '攜帶原廠裝置至門市或線上估價，系統會依機況與型號即時試算折抵金額，最高可折抵 NT$15,000。',
                        open: false,
                      },
                      {
                        id: 'faq4',
                        q: '什麼時候可以買到？',
                        a: '預購自 10 月 16 日開始，10 月 23 日正式開賣，支援信用卡分期（最長 24 期）、行動支付與電信帳單支付。',
                        open: false,
                      },
                    ].map(({ id, q, a, open }) => (
                      <div className="accordion-item" key={id}>
                        <h2 className="accordion-header">
                          <button
                            className={`accordion-button${open ? '' : ' collapsed'}`}
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target={`#${id}`}
                          >
                            {q}
                          </button>
                        </h2>
                        <div id={id} className={`accordion-collapse collapse${open ? ' show' : ''}`} data-bs-parent="#faqAccordion">
                          <div className="accordion-body">{a}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Footer */}
          <footer className="py-5">
            <div className="container">
              <div className="row gy-4">
                <div className="col-md-4">
                  <h5 className="text-white fw-bold mb-2">
                    iPhone <span className="text-gradient">Duo</span>
                  </h5>
                  <p className="small mb-0">摺疊，即是全新格局。這是一個 Bootstrap + Vite 練習專案，非官方產品，規格資訊參考自公開產品頁面。</p>
                </div>
                <div className="col-md-2">
                  <h6 className="text-white mb-3">產品</h6>
                  <ul className="list-unstyled small d-flex flex-column gap-2">
                    <li>
                      <a href="#highlights" className="link-light link-underline-opacity-0">
                        亮點
                      </a>
                    </li>
                    <li>
                      <a href="#specs" className="link-light link-underline-opacity-0">
                        規格
                      </a>
                    </li>
                    <li>
                      <a href="#pricing" className="link-light link-underline-opacity-0">
                        選購
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="col-md-2">
                  <h6 className="text-white mb-3">支援</h6>
                  <ul className="list-unstyled small d-flex flex-column gap-2">
                    <li>
                      <a href="#faq" className="link-light link-underline-opacity-0">
                        常見問題
                      </a>
                    </li>
                    <li>
                      <a href="#" className="link-light link-underline-opacity-0">
                        保固政策
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="col-md-4">
                  <h6 className="text-white mb-3">追蹤我們</h6>
                  <div className="d-flex gap-3 fs-5 footer-social">
                    <a href="#" className="link-light">
                      <i className="bi bi-instagram" />
                    </a>
                    <a href="#" className="link-light">
                      <i className="bi bi-twitter-x" />
                    </a>
                    <a href="#" className="link-light">
                      <i className="bi bi-youtube" />
                    </a>
                  </div>
                </div>
              </div>
              <hr className="border-secondary my-4" />
              <p className="small mb-0">&copy; 2026 iPhone Duo Demo. 課程作業練習頁面，非蘋果公司官方網站。</p>
            </div>
          </footer>
        </div>
      </div>
    </>
  );
}
