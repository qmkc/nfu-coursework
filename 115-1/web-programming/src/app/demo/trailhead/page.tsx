import { TrailPageScript } from "./TrailPageScript";
import {
  commonsPage,
  commonsUrl,
  faqs,
  gallery,
  gear,
  heroPhoto,
  sessions,
  trails,
  typedStrings,
  type Difficulty,
  type Trail,
} from "./data";

const difficultyBadge: Record<Difficulty, string> = {
  入門: "text-bg-success",
  中級: "text-bg-warning",
  進階: "text-bg-danger",
};

/**
 * 路線卡片封面的照片上疊一條這條路線的海拔剖面——
 * 登山口在左、最高點在右，所以每張卡片的稜線都不一樣。
 */
function ridgePoints(trail: Trail): string {
  const maxKm = trail.profile[trail.profile.length - 1][0];
  const elevations = trail.profile.map(([, m]) => m);
  const low = Math.min(...elevations);
  const high = Math.max(...elevations);
  const points = trail.profile.map(([km, m]) => {
    const x = (km / maxKm) * 300;
    const y = 125 - ((m - low) / (high - low)) * 65;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return points.join(" ");
}

const totalKm = Math.round(trails.reduce((sum, trail) => sum + trail.distanceKm, 0));

export default function TrailheadPage() {
  return (
    <div className="trail-page" id="top">
      <TrailPageScript />

      {/* 捲動進度條 */}
      <div className="scroll-progress" id="scrollProgress" aria-hidden="true" />

      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark fixed-top trail-nav" id="trailNav">
        <div className="container">
          <a className="navbar-brand d-flex align-items-center gap-2" href="#top">
            <i className="bi bi-signpost-split-fill" />
            <span>山行 Trailhead</span>
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#trailNavMenu"
            aria-controls="trailNavMenu"
            aria-expanded="false"
            aria-label="切換導覽選單"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="trailNavMenu">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-lg-1">
              <li className="nav-item">
                <a className="nav-link" href="#routes">
                  熱門路線
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#map">
                  路線地圖
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#stats">
                  數據
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#gallery">
                  風景
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#gear">
                  裝備
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#schedule">
                  梯次
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#faq">
                  FAQ
                </a>
              </li>
              <li className="nav-item ms-lg-2 mt-2 mt-lg-0">
                <button
                  className="btn btn-warning rounded-pill px-3"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#planCanvas"
                  aria-controls="planCanvas"
                >
                  <i className="bi bi-backpack2 me-1" />
                  我的行程
                  <span className="badge text-bg-dark ms-2" id="planCount" hidden>
                    0
                  </span>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="trail-hero" id="trailHero">
        <img className="hero-photo" src={commonsUrl(heroPhoto.file, 1600)} alt="" fetchPriority="high" />
        <div className="hero-clouds" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="container position-relative">
          <p className="hero-eyebrow" data-aos="fade-down">
            <i className="bi bi-geo-alt-fill me-1" />
            台灣高山步道指南
          </p>
          <h1 className="hero-title" data-aos="fade-up">
            這個週末，
            <br />
            <span className="hero-typed">
              {/* 沒有 JS 時也看得到第一句；Typed.js 載入後會接手這個節點 */}
              <span id="heroTyped">{typedStrings[0]}</span>
            </span>
          </h1>
          <p className="hero-lead" data-aos="fade-up" data-aos-delay="100">
            六條經典百岳路線，從半天來回的入門款到三天兩夜的長程縱走，
            <br className="d-none d-md-inline" />
            里程、海拔、難度一次看清楚。
          </p>
          <div className="d-flex flex-wrap gap-2" data-aos="fade-up" data-aos-delay="200">
            <a className="btn btn-warning btn-lg rounded-pill px-4" href="#routes">
              <i className="bi bi-compass me-2" />
              開始挑路線
            </a>
            <a className="btn btn-outline-light btn-lg rounded-pill px-4" href="#map">
              看地圖
            </a>
          </div>
          <dl className="hero-stats" data-aos="fade-up" data-aos-delay="300">
            <div>
              <dt>
                <span data-countup={trails.length}>{trails.length}</span>
              </dt>
              <dd>條精選路線</dd>
            </div>
            <div>
              <dt>
                <span data-countup={3952}>3,952</span> m
              </dt>
              <dd>最高海拔</dd>
            </div>
            <div>
              <dt>
                <span data-countup={totalKm}>{totalKm}</span> km
              </dt>
              <dd>步道總里程</dd>
            </div>
          </dl>
        </div>
        <a className="hero-scroll" href="#routes" aria-label="往下看熱門路線">
          <i className="bi bi-chevron-double-down" />
        </a>
        <svg
          className="hero-ridges"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="ridge-far"
            d="M0,220 L140,130 L260,190 L420,70 L560,180 L700,110 L860,200 L1010,90 L1180,190 L1300,140 L1440,210 L1440,320 L0,320 Z"
          />
          <path
            className="ridge-mid"
            d="M0,260 L180,180 L330,240 L520,150 L690,250 L880,170 L1060,250 L1230,190 L1440,260 L1440,320 L0,320 Z"
          />
          <path
            className="ridge-near"
            d="M0,300 L220,240 L420,290 L640,230 L860,295 L1100,245 L1300,290 L1440,270 L1440,320 L0,320 Z"
          />
        </svg>
      </header>

      <main>
        {/* 山名跑馬燈：內容重複兩次，CSS 位移 -50% 就能無縫循環 */}
        <div className="peak-marquee" aria-hidden="true">
          <div className="peak-marquee-track">
            {[0, 1].map((copy) => (
              <ul key={copy}>
                {trails.map((trail) => (
                  <li key={trail.id}>
                    <i className="bi bi-triangle-fill" />
                    {trail.peak}
                    <span>{trail.elevation.toLocaleString("en-US")} m</span>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>

        {/* 公告 */}
        <div className="container trail-notice">
          <div className="alert alert-warning d-flex align-items-center gap-2 mb-0" role="alert">
            <i className="bi bi-megaphone-fill" />
            <div>
              <strong>最新公告：</strong>
              11 月份嘉明湖梯次已開放報名，名額有限。
            </div>
          </div>
        </div>

        {/* 熱門路線（Swiper） */}
        <section className="trail-section" id="routes">
          <div className="container">
            <div className="section-head" data-aos="fade-up">
              <div>
                <h2>熱門路線</h2>
                <p>左右滑動看更多，照片上那條線就是該路線的海拔剖面。</p>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-outline-primary rounded-circle swiper-btn" id="trailPrev" type="button" aria-label="上一張">
                  <i className="bi bi-arrow-left" />
                </button>
                <button className="btn btn-outline-primary rounded-circle swiper-btn" id="trailNext" type="button" aria-label="下一張">
                  <i className="bi bi-arrow-right" />
                </button>
              </div>
            </div>

            <div className="swiper" id="trailSwiper">
              <div className="swiper-wrapper">
                {trails.map((trail) => (
                  <div className="swiper-slide" key={trail.id}>
                    <article className="card trail-card h-100">
                      <div className="trail-cover">
                        <img src={commonsUrl(trail.photo.file, 960)} alt={trail.photo.alt} loading="lazy" />
                        <svg viewBox="0 0 300 140" preserveAspectRatio="none" aria-hidden="true">
                          <polyline points={ridgePoints(trail)} pathLength={1} />
                        </svg>
                        <span className={`badge ${difficultyBadge[trail.difficulty]}`}>
                          {trail.difficulty}
                        </span>
                        <span className="trail-elevation">{trail.elevation.toLocaleString("en-US")} m</span>
                      </div>
                      <div className="card-body d-flex flex-column">
                        <h3 className="card-title h5">{trail.name}</h3>
                        <p className="trail-meta">
                          <span>
                            <i className="bi bi-geo-alt" /> {trail.region}
                          </span>
                          <span>
                            <i className="bi bi-calendar3" /> {trail.days} 天
                          </span>
                          <span>
                            <i className="bi bi-signpost" /> {trail.distanceKm} km
                          </span>
                        </p>
                        <p className="card-text flex-grow-1">{trail.summary}</p>
                        <div className="d-flex gap-2">
                          <button className="btn btn-primary flex-fill" type="button" data-add={trail.id}>
                            <i className="bi bi-plus-circle me-1" />
                            <span>加入行程</span>
                          </button>
                          <button className="btn btn-outline-primary" type="button" data-info={trail.id}>
                            路線介紹
                          </button>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
              <div className="swiper-pagination" />
            </div>
          </div>
        </section>

        {/* 路線地圖（Leaflet） */}
        <section className="trail-section section-tint" id="map">
          <div className="container">
            <div className="section-head" data-aos="fade-up">
              <div>
                <h2>路線地圖</h2>
                <p>點左邊的路線，地圖會飛到那座山的位置。</p>
              </div>
            </div>
            <div className="row g-4">
              <div className="col-lg-4" data-aos="fade-right">
                <div className="list-group trail-list" id="mapList">
                  {trails.map((trail) => (
                    <button
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      type="button"
                      data-fly={trail.id}
                      key={trail.id}
                    >
                      <span>
                        <strong>{trail.peak}</strong>
                        <small className="d-block text-body-secondary">{trail.trailhead}</small>
                      </span>
                      <span className="badge text-bg-light rounded-pill">
                        {trail.elevation.toLocaleString("en-US")} m
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="col-lg-8">
                <div className="trail-map" id="trailMap" role="application" aria-label="路線位置地圖" />
              </div>
            </div>
          </div>
        </section>

        {/* 數據（Chart.js） */}
        <section className="trail-section" id="stats">
          <div className="container">
            <div className="section-head" data-aos="fade-up">
              <div>
                <h2>用數據挑路線</h2>
                <p>里程、難度、爬升一次比較。數值為課程練習用的概略值。</p>
              </div>
            </div>
            <div className="row g-4" id="statsCharts">
              <div className="col-lg-7" data-aos="fade-up">
                <div className="card chart-card h-100">
                  <div className="card-body">
                    <h3 className="h6">各路線來回里程（公里）</h3>
                    <div className="chart-box">
                      <canvas id="distanceChart" role="img" aria-label="各路線來回里程長條圖" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-5" data-aos="fade-up" data-aos-delay="100">
                <div className="card chart-card h-100">
                  <div className="card-body">
                    <h3 className="h6">難度分布（路線數）</h3>
                    <div className="chart-box">
                      <canvas id="difficultyChart" role="img" aria-label="路線難度分布圓餅圖" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-12" data-aos="fade-up">
                <div className="card chart-card">
                  <div className="card-body">
                    <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
                      <h3 className="h6 mb-0">
                        海拔剖面：<span id="profileTitle">{trails[0].name}</span>
                      </h3>
                      <div className="nav nav-pills profile-pills" id="profilePills" role="group" aria-label="選擇路線">
                        {trails.map((trail, i) => (
                          <button
                            className={`nav-link${i === 0 ? " active" : ""}`}
                            type="button"
                            data-profile={trail.id}
                            key={trail.id}
                          >
                            {trail.peak}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="chart-box chart-box-wide">
                      <canvas id="profileChart" role="img" aria-label="所選路線的海拔剖面折線圖" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 山上的風景（照片牆） */}
        <section className="trail-section section-dark" id="gallery">
          <div className="container">
            <div className="section-head" data-aos="fade-up">
              <div>
                <h2>山上的風景</h2>
                <p>點照片可以放大。照片來自 Wikimedia Commons，作者與授權列在頁尾。</p>
              </div>
            </div>
            <div className="trail-gallery">
              {gallery.map((photo, i) => (
                <button
                  className="gallery-item"
                  type="button"
                  data-gallery={i}
                  data-aos="zoom-in"
                  data-aos-delay={(i % 3) * 100}
                  key={photo.file}
                >
                  <img src={commonsUrl(photo.file, 960)} alt={photo.alt} loading="lazy" />
                  <span className="gallery-caption">
                    {photo.caption}
                    <i className="bi bi-arrows-fullscreen" />
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 裝備清單（Bootstrap progress） */}
        <section className="trail-section section-tint" id="gear">
          <div className="container">
            <div className="row g-5 align-items-center">
              <div className="col-lg-5" data-aos="fade-right">
                <h2>出發前裝備檢查</h2>
                <p className="text-body-secondary">
                  高山上天氣說變就變。把清單逐項打勾，進度條滿了再出門。
                </p>
                <div
                  className="progress gear-progress"
                  role="progressbar"
                  aria-label="裝備準備進度"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={0}
                  id="gearProgress"
                >
                  <div className="progress-bar progress-bar-striped" id="gearBar" style={{ width: "0%" }}>
                    0%
                  </div>
                </div>
                <p className="small text-body-secondary mt-2 mb-0" id="gearHint">
                  已準備 0 / {gear.length} 項
                </p>
              </div>
              <div className="col-lg-7" data-aos="fade-left">
                <div className="row g-3" id="gearList">
                  {gear.map((item, i) => (
                    <div className="col-sm-6" key={item}>
                      <input className="btn-check" type="checkbox" id={`gear${i}`} autoComplete="off" />
                      <label className="btn btn-outline-primary gear-item" htmlFor={`gear${i}`}>
                        <i className="bi bi-check2-circle" />
                        {item}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 梯次表（Bootstrap table + SweetAlert2） */}
        <section className="trail-section" id="schedule">
          <div className="container">
            <div className="section-head" data-aos="fade-up">
              <div>
                <h2>近期開團梯次</h2>
                <p>報名流程是模擬的，不會真的送出任何資料。</p>
              </div>
            </div>
            <div className="table-responsive" data-aos="fade-up">
              <table className="table table-hover align-middle trail-table">
                <thead>
                  <tr>
                    <th scope="col">日期</th>
                    <th scope="col">路線</th>
                    <th scope="col">領隊</th>
                    <th scope="col">剩餘名額</th>
                    <th scope="col" className="text-end">
                      報名
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session, i) => {
                    const trail = trails.find((t) => t.id === session.trailId)!;
                    const full = session.seats === 0;
                    return (
                      <tr key={session.date}>
                        <td>{session.date}</td>
                        <td>
                          {trail.name}
                          <span className={`badge ms-2 ${difficultyBadge[trail.difficulty]}`}>
                            {trail.difficulty}
                          </span>
                        </td>
                        <td>{session.leader}</td>
                        <td>
                          {full ? (
                            <span className="badge text-bg-secondary">額滿</span>
                          ) : (
                            <span data-seats={i}>{session.seats}</span>
                          )}
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-primary rounded-pill px-3"
                            type="button"
                            data-signup={i}
                            disabled={full}
                          >
                            我要報名
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* FAQ（Bootstrap accordion） */}
        <section className="trail-section section-tint" id="faq">
          <div className="container">
            <div className="section-head" data-aos="fade-up">
              <div>
                <h2>常見問題</h2>
                <p>第一次上高山前，大家最常問的幾件事。</p>
              </div>
            </div>
            <div className="accordion trail-faq" id="faqAccordion" data-aos="fade-up">
              {faqs.map((faq, i) => (
                <div className="accordion-item" key={faq.q}>
                  <h3 className="accordion-header">
                    <button
                      className={`accordion-button${i === 0 ? "" : " collapsed"}`}
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target={`#faq${i}`}
                      aria-expanded={i === 0}
                      aria-controls={`faq${i}`}
                    >
                      {faq.q}
                    </button>
                  </h3>
                  <div
                    id={`faq${i}`}
                    className={`accordion-collapse collapse${i === 0 ? " show" : ""}`}
                    data-bs-parent="#faqAccordion"
                  >
                    <div className="accordion-body">{faq.a}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="trail-footer">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-6">
              <p className="h5 mb-2">
                <i className="bi bi-signpost-split-fill me-2" />
                山行 Trailhead
              </p>
              <p className="mb-0">
                網頁程式設計 Week 5 課程練習頁面，站上的梯次、領隊與報名流程皆為虛構。
              </p>
            </div>
            <div className="col-md-6 text-md-end">
              <a className="btn btn-outline-light rounded-pill me-2" href="/weekly/05/">
                <i className="bi bi-arrow-left me-1" />
                回到 Week 05
              </a>
              <a
                className="btn btn-outline-light rounded-pill"
                href="https://github.com/qmkc/nfu-coursework/tree/main/115-1/web-programming/src/app/demo/trailhead"
                target="_blank"
                rel="noopener"
              >
                <i className="bi bi-github me-1" />
                查看程式碼
              </a>
              <p className="small mt-3 mb-0">
                Bootstrap · AOS · SweetAlert2 · Chart.js · Swiper · Leaflet · Typed.js
              </p>
            </div>
          </div>
          <p className="photo-credits">
            照片來源（Wikimedia Commons）：
            {[heroPhoto, ...trails.map((trail) => trail.photo), ...gallery].map((photo) => (
              <a href={commonsPage(photo.file)} target="_blank" rel="noopener" key={photo.file}>
                {photo.author}（{photo.license}）
              </a>
            ))}
          </p>
        </div>
      </footer>

      <button className="btn btn-warning to-top" type="button" id="toTop" aria-label="回到頂端">
        <i className="bi bi-arrow-up" />
      </button>

      {/* 我的行程（Bootstrap offcanvas） */}
      <div className="offcanvas offcanvas-end" tabIndex={-1} id="planCanvas" aria-labelledby="planCanvasLabel">
        <div className="offcanvas-header">
          <h2 className="offcanvas-title h5" id="planCanvasLabel">
            <i className="bi bi-backpack2 me-2" />
            我的行程
          </h2>
          <button className="btn-close" type="button" data-bs-dismiss="offcanvas" aria-label="關閉" />
        </div>
        <div className="offcanvas-body d-flex flex-column">
          <p className="text-body-secondary" id="planEmpty">
            還沒有加入任何路線。到「熱門路線」按「加入行程」試試看。
          </p>
          <ul className="list-group list-group-flush flex-grow-1" id="planList" />
          <div className="plan-summary" id="planSummary" hidden>
            <div>
              <span>總天數</span>
              <strong id="planDays">0</strong>
            </div>
            <div>
              <span>總里程</span>
              <strong id="planKm">0</strong>
            </div>
          </div>
          <button className="btn btn-primary rounded-pill mt-3" type="button" id="planSubmit" disabled>
            送出行程（模擬）
          </button>
        </div>
      </div>
    </div>
  );
}
