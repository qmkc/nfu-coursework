import { TrailPageScript } from "./TrailPageScript";
import {
  commonsPage,
  commonsUrl,
  difficultyOrder,
  experienceLevels,
  faqs,
  fitnessLabels,
  gallery,
  gear,
  heroPhoto,
  rentals,
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
                <a className="nav-link" href="#signup">
                  報名
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
            <a className="btn btn-outline-light btn-lg rounded-pill px-4" href="#signup">
              <i className="bi bi-pencil-square me-2" />
              線上報名
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

            {/* 路線篩選（搜尋框 input-group、btn-check 單選、range） */}
            <form className="route-filter" id="routeFilter" data-aos="fade-up" noValidate>
              <div className="input-group route-filter-search">
                <label className="input-group-text" htmlFor="filterKeyword">
                  <i className="bi bi-search" />
                  <span className="visually-hidden">搜尋路線</span>
                </label>
                <input
                  className="form-control"
                  type="search"
                  id="filterKeyword"
                  name="keyword"
                  placeholder="搜尋山名、縣市，例如「雪山」「台東」"
                  autoComplete="off"
                />
              </div>
              <fieldset className="route-filter-level">
                <legend className="visually-hidden">難度</legend>
                {["全部", ...difficultyOrder].map((level, i) => (
                  <span key={level}>
                    <input
                      className="btn-check"
                      type="radio"
                      name="level"
                      id={`filterLevel${i}`}
                      value={i === 0 ? "" : level}
                      defaultChecked={i === 0}
                    />
                    <label className="btn btn-outline-primary rounded-pill" htmlFor={`filterLevel${i}`}>
                      {level}
                    </label>
                  </span>
                ))}
              </fieldset>
              <div className="route-filter-days">
                <label className="form-label" htmlFor="filterDays">
                  最多 <output id="filterDaysOut" htmlFor="filterDays">3</output> 天
                </label>
                <input className="form-range" type="range" id="filterDays" name="days" min={1} max={3} step={1} defaultValue={3} />
              </div>
              <button className="btn btn-link route-filter-reset" type="reset">
                <i className="bi bi-arrow-counterclockwise me-1" />
                清除
              </button>
              <p className="route-filter-count" id="filterCount" aria-live="polite">
                符合 {trails.length} 條路線
              </p>
            </form>

            <p className="route-empty" id="routeEmpty" hidden>
              <i className="bi bi-binoculars" />
              沒有符合條件的路線，放寬一點條件試試看。
            </p>

            <div className="swiper" id="trailSwiper">
              <div className="swiper-wrapper">
                {trails.map((trail) => (
                  <div className="swiper-slide" key={trail.id} data-trail={trail.id}>
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
                <p>選好梯次會直接帶進下方的報名表單。</p>
              </div>
            </div>
            <div className="table-responsive" data-aos="fade-up">
              <table className="table table-hover align-middle trail-table">
                <thead>
                  <tr>
                    <th scope="col">日期</th>
                    <th scope="col">路線</th>
                    <th scope="col">領隊</th>
                    <th scope="col">每人費用</th>
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
                        <td>NT$ {session.price.toLocaleString("en-US")}</td>
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
                            data-pick={i}
                            disabled={full}
                          >
                            選這梯
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

        {/* 線上報名（Week 6：三步驟表單 + 即時預覽） */}
        <section className="trail-section section-signup" id="signup">
          <div className="container">
            <div className="section-head" data-aos="fade-up">
              <div>
                <h2>線上報名</h2>
                <p>
                  三個步驟填完，右邊的登山證會跟著你輸入的內容即時更新。這是模擬表單，資料只留在你的瀏覽器裡。
                </p>
              </div>
            </div>

            <div className="row g-4 g-xl-5 align-items-start">
              <div className="col-lg-7" data-aos="fade-up">
                <form className="signup-card" id="signupForm" noValidate>
                  <ol className="signup-steps" id="signupSteps">
                    {["基本資料", "行程與需求", "確認送出"].map((label, i) => (
                      <li className={i === 0 ? "active" : ""} key={label}>
                        <button type="button" data-goto={i} aria-current={i === 0 ? "step" : undefined}>
                          <span className="step-dot">
                            <span>{i + 1}</span>
                            <i className="bi bi-check-lg" />
                          </span>
                          {label}
                        </button>
                      </li>
                    ))}
                  </ol>

                  {/* 必填欄位完成度 */}
                  <div className="signup-progress">
                    <div className="progress" role="progressbar" aria-label="必填欄位完成度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={0} id="requiredProgress">
                      <div className="progress-bar" id="requiredBar" style={{ width: "0%" }} />
                    </div>
                    <small id="requiredText">必填欄位 0 / 0</small>
                  </div>

                  {/* 驗證沒過時的錯誤摘要：列出每個有問題的欄位，點了會跳過去 */}
                  <div className="alert alert-danger step-errors" id="stepErrors" role="alert" tabIndex={-1} hidden>
                    <p>
                      <i className="bi bi-exclamation-octagon-fill me-2" />
                      <span id="stepErrorsTitle">請修正以下欄位</span>
                    </p>
                    <ul id="stepErrorsList" />
                  </div>

                  {/* A. 基本資料 */}
                  <fieldset className="signup-step active" data-step={0}>
                    <legend>A. 基本資料</legend>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input className="form-control" type="text" id="fullName" name="fullName" placeholder="王小明" required minLength={2} maxLength={20} autoComplete="name" />
                          <label htmlFor="fullName">姓名 *</label>
                          <div className="invalid-feedback">請輸入至少 2 個字的姓名。</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input className="form-control" type="email" id="email" name="email" placeholder="name@example.com" required autoComplete="email" />
                          <label htmlFor="email">電子郵件 *</label>
                          <div className="invalid-feedback">請輸入正確的 Email 格式。</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input className="form-control" type="tel" id="phone" name="phone" placeholder="0912345678" required pattern="09[0-9]{8}" inputMode="numeric" maxLength={10} autoComplete="tel" />
                          <label htmlFor="phone">手機 *</label>
                          <div className="invalid-feedback">請輸入 09 開頭的 10 碼手機號碼。</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input className="form-control" type="date" id="birthday" name="birthday" placeholder="生日" required />
                          <label htmlFor="birthday">生日 *</label>
                          <div className="invalid-feedback" id="birthdayFeedback">請選擇生日（需年滿 16 歲）。</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="form-floating">
                          <input className="form-control text-uppercase" type="text" id="nationalId" name="nationalId" placeholder="A123456789" required pattern="[A-Za-z][12][0-9]{8}" maxLength={10} autoComplete="off" spellCheck={false} aria-describedby="nationalIdHelp" />
                          <label htmlFor="nationalId">身分證字號（申請入山證用）*</label>
                          <div className="invalid-feedback" id="nationalIdFeedback">請輸入 1 個英文字母加 9 個數字。</div>
                          <div className="form-text" id="nationalIdHelp">
                            會檢查格式與檢查碼。這是練習表單，請不要填真實證號，可以用範例 <code>A123456789</code>。
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="signup-subhead">
                      <i className="bi bi-telephone-forward" />
                      緊急聯絡人
                    </p>
                    <div className="row g-3">
                      <div className="col-md-5">
                        <div className="form-floating">
                          <input className="form-control" type="text" id="emergencyName" name="emergencyName" placeholder="聯絡人" required minLength={2} maxLength={20} />
                          <label htmlFor="emergencyName">聯絡人姓名 *</label>
                          <div className="invalid-feedback">請輸入緊急聯絡人姓名。</div>
                        </div>
                      </div>
                      <div className="col-md-7">
                        <div className="input-group has-validation">
                          <span className="input-group-text">+886</span>
                          <div className="form-floating">
                            <input className="form-control" type="tel" id="emergencyPhone" name="emergencyPhone" placeholder="0912345678" required pattern="09[0-9]{8}" inputMode="numeric" maxLength={10} />
                            <label htmlFor="emergencyPhone">聯絡人手機 *</label>
                          </div>
                          <div className="invalid-feedback" id="emergencyPhoneFeedback">請輸入 09 開頭的 10 碼手機號碼。</div>
                        </div>
                      </div>
                    </div>

                    <p className="signup-subhead">
                      <i className="bi bi-shield-lock" />
                      報名查詢密碼
                    </p>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="input-group has-validation">
                          <div className="form-floating">
                            <input className="form-control" type="password" id="password" name="password" placeholder="密碼" required minLength={8} maxLength={32} pattern="(?=.*[A-Za-z])(?=.*[0-9]).{8,}" autoComplete="new-password" aria-describedby="pwRules" />
                            <label htmlFor="password">練習密碼 *</label>
                          </div>
                          <button className="btn btn-outline-secondary" type="button" id="togglePassword" aria-label="顯示密碼" aria-pressed="false">
                            <i className="bi bi-eye" />
                          </button>
                          <div className="invalid-feedback">密碼至少 8 個字元，且要同時有英文字母和數字。</div>
                        </div>
                        <div className="pw-meter" id="pwMeter" data-score={0} aria-hidden="true">
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>
                        <p className="pw-strength" id="pwStrength" aria-live="polite">
                          密碼強度：尚未輸入
                        </p>
                      </div>
                      <div className="col-md-6">
                        <div className="form-floating">
                          <input className="form-control" type="password" id="confirmPassword" name="confirmPassword" placeholder="確認密碼" required autoComplete="new-password" />
                          <label htmlFor="confirmPassword">確認密碼 *</label>
                          <div className="invalid-feedback" id="confirmPasswordFeedback">請再輸入一次密碼。</div>
                        </div>
                        <ul className="pw-rules" id="pwRules">
                          <li data-rule="length">至少 8 個字元</li>
                          <li data-rule="letter">包含英文字母</li>
                          <li data-rule="digit">包含數字</li>
                          <li data-rule="symbol">包含符號（加分，非必要）</li>
                        </ul>
                      </div>
                    </div>
                    <p className="form-text mb-0">密碼欄位只用來練習驗證，不會儲存也不會送出，請不要填你真正在用的密碼。</p>
                  </fieldset>

                  {/* B. 行程與需求 */}
                  <fieldset className="signup-step" data-step={1}>
                    <legend>B. 行程與需求</legend>
                    <div className="row g-3">
                      <div className="col-md-8">
                        <div className="form-floating">
                          <select className="form-select" id="session" name="session" required defaultValue="">
                            <option value="" disabled>
                              請選擇梯次
                            </option>
                            {sessions.map((session, i) => {
                              const trail = trails.find((t) => t.id === session.trailId)!;
                              return (
                                <option value={i} disabled={session.seats === 0} key={session.date}>
                                  {session.date}｜{trail.name}
                                  {session.seats === 0 ? "（額滿）" : `（剩 ${session.seats} 位）`}
                                </option>
                              );
                            })}
                          </select>
                          <label htmlFor="session">報名梯次 *</label>
                          <div className="invalid-feedback">請選擇一個梯次。</div>
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-floating">
                          <input className="form-control" type="number" id="people" name="people" placeholder="1" required min={1} max={4} defaultValue={1} inputMode="numeric" />
                          <label htmlFor="people">人數 *</label>
                          <div className="invalid-feedback" id="peopleFeedback">一次可報名 1 – 4 人。</div>
                        </div>
                      </div>
                    </div>

                    <p className="signup-subhead">
                      <i className="bi bi-bar-chart-steps" />
                      登山經驗 *
                    </p>
                    <div className="choice-grid">
                      {experienceLevels.map((level) => (
                        <div key={level.id}>
                          <input className="btn-check" type="radio" name="experience" id={`exp-${level.id}`} value={level.label} required />
                          <label className="choice-card" htmlFor={`exp-${level.id}`}>
                            <i className={`bi ${level.icon}`} />
                            <strong>{level.label}</strong>
                            <small>{level.hint}</small>
                          </label>
                        </div>
                      ))}
                    </div>
                    <div className="choice-feedback">請選擇你的登山經驗。</div>

                    <p className="signup-subhead">
                      <i className="bi bi-backpack3" />
                      需要租借的裝備（可複選）
                    </p>
                    <div className="chip-row">
                      {rentals.map((item) => (
                        <span key={item.id}>
                          <input className="btn-check" type="checkbox" name="rentals" id={`rent-${item.id}`} value={item.id} />
                          <label className="btn btn-outline-primary rounded-pill" htmlFor={`rent-${item.id}`}>
                            {item.label}
                            <small>+{item.price}</small>
                          </label>
                        </span>
                      ))}
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-7">
                        <label className="form-label d-flex justify-content-between" htmlFor="fitness">
                          <span>體能自評</span>
                          <output id="fitnessOut" htmlFor="fitness">
                            {fitnessLabels[2]}
                          </output>
                        </label>
                        <input className="form-range" type="range" id="fitness" name="fitness" min={1} max={5} step={1} defaultValue={3} />
                      </div>
                      <div className="col-md-5">
                        <label className="form-label" htmlFor="briefing">
                          行前說明會日期
                        </label>
                        <input className="form-control" type="date" id="briefing" name="briefing" />
                        <div className="invalid-feedback">說明會日期不能早於今天。</div>
                      </div>
                    </div>

                    <div className="form-check form-switch mt-3">
                      <input className="form-check-input" type="checkbox" role="switch" id="vegetarian" name="vegetarian" />
                      <label className="form-check-label" htmlFor="vegetarian">
                        我吃素，山屋餐點請準備素食
                      </label>
                    </div>

                    <p className="signup-subhead">
                      <i className="bi bi-bell" />
                      行前通知方式（至少選一項）*
                    </p>
                    <div className="chip-row">
                      {[
                        ["email", "Email"],
                        ["sms", "簡訊"],
                        ["line", "LINE"],
                      ].map(([value, label]) => (
                        <span key={value}>
                          <input className="btn-check" type="checkbox" name="notify" id={`notify-${value}`} value={label} />
                          <label className="btn btn-outline-primary rounded-pill" htmlFor={`notify-${value}`}>
                            {label}
                          </label>
                        </span>
                      ))}
                    </div>
                    <div className="group-feedback" id="notifyFeedback">
                      請至少選擇一種通知方式。
                    </div>
                    {/* 勾了 LINE 才會出現，而且變成必填 */}
                    <div className="reveal-field" id="lineIdField" hidden>
                      <div className="input-group has-validation">
                        <span className="input-group-text">
                          <i className="bi bi-line" />
                        </span>
                        <div className="form-floating">
                          <input className="form-control" type="text" id="lineId" name="lineId" placeholder="LINE ID" required disabled pattern="[A-Za-z0-9._\-]{4,20}" maxLength={20} autoComplete="off" />
                          <label htmlFor="lineId">LINE ID *</label>
                        </div>
                        <div className="invalid-feedback">LINE ID 為 4 – 20 個英數字、點、底線或連字號。</div>
                      </div>
                    </div>

                    <div className="row g-3 mt-1">
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="recordUrl">
                          登山紀錄網址（選填）
                        </label>
                        <div className="input-group has-validation">
                          <span className="input-group-text">
                            <i className="bi bi-link-45deg" />
                          </span>
                          <input className="form-control" type="url" id="recordUrl" name="recordUrl" placeholder="https://" maxLength={200} />
                          <div className="invalid-feedback">請輸入完整網址，要以 https:// 或 http:// 開頭。</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label" htmlFor="healthFile">
                          健康聲明書（選填）
                        </label>
                        <input className="form-control" type="file" id="healthFile" name="healthFile" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" aria-describedby="healthFileHelp" />
                        <div className="invalid-feedback" id="healthFileFeedback">只接受 PDF、JPG、PNG，檔案不能超過 2 MB。</div>
                        <div className="form-text" id="healthFileHelp">
                          PDF／JPG／PNG，2 MB 以內。檔案只在瀏覽器裡檢查，不會上傳。
                        </div>
                      </div>
                    </div>
                    <div className="file-preview" id="filePreview" hidden>
                      <img id="filePreviewImage" alt="" hidden />
                      <i className="bi bi-file-earmark-pdf" id="filePreviewIcon" hidden />
                      <span id="filePreviewText" />
                    </div>

                    <div className="mt-3">
                      <label className="form-label d-flex justify-content-between" htmlFor="note">
                        <span>想跟領隊說的話</span>
                        <small className="text-body-secondary">
                          <span id="noteCount">0</span> / 200
                        </small>
                      </label>
                      <textarea className="form-control" id="note" name="note" rows={3} maxLength={200} placeholder="例如：膝蓋受過傷、想坐接駁車的位置…" />
                    </div>
                  </fieldset>

                  {/* C. 確認送出 */}
                  <fieldset className="signup-step" data-step={2}>
                    <legend>C. 確認送出</legend>
                    <dl className="signup-summary" id="signupSummary" />
                    <div className="form-check signup-agree">
                      <input className="form-check-input" type="checkbox" id="agree" name="agree" required />
                      <label className="form-check-label" htmlFor="agree">
                        我了解這是課程練習用的模擬表單，並已詳閱高山症與裝備須知。 *
                      </label>
                      <div className="invalid-feedback">送出前請先勾選同意。</div>
                    </div>
                  </fieldset>

                  <div className="signup-actions">
                    <button className="btn btn-link text-body-secondary" type="reset">
                      <i className="bi bi-eraser me-1" />
                      清除表單
                    </button>
                    <div className="d-flex gap-2">
                      <button className="btn btn-outline-primary rounded-pill px-4" type="button" id="stepPrev" hidden>
                        <i className="bi bi-arrow-left me-1" />
                        上一步
                      </button>
                      <button className="btn btn-primary rounded-pill px-4" type="button" id="stepNext">
                        下一步
                        <i className="bi bi-arrow-right ms-1" />
                      </button>
                      <button className="btn btn-warning rounded-pill px-4" type="submit" id="stepSubmit" hidden>
                        <i className="bi bi-send-check me-1" />
                        確認報名
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* 即時預覽：登山證 */}
              <div className="col-lg-5" data-aos="fade-left" data-aos-delay="100">
                <aside className="pass-card" id="passCard" aria-label="報名內容即時預覽">
                  <div className="pass-photo">
                    <img id="passPhoto" src={commonsUrl(heroPhoto.file, 960)} alt="" />
                    <span className="pass-tag">TRAIL PASS</span>
                    <p className="pass-route" id="passRoute">
                      尚未選擇梯次
                    </p>
                  </div>
                  <div className="pass-body">
                    <p className="pass-label">登山者</p>
                    <p className="pass-name" id="passName">
                      你的名字
                    </p>
                    <dl className="pass-grid">
                      <div>
                        <dt>日期</dt>
                        <dd id="passDate">—</dd>
                      </div>
                      <div>
                        <dt>人數</dt>
                        <dd id="passPeople">1 人</dd>
                      </div>
                      <div>
                        <dt>經驗</dt>
                        <dd id="passExperience">—</dd>
                      </div>
                      <div>
                        <dt>體能</dt>
                        <dd className="pass-dots" id="passFitness" aria-label="體能 3 / 5">
                          {[1, 2, 3, 4, 5].map((dot) => (
                            <span className={dot <= 3 ? "on" : ""} key={dot} />
                          ))}
                        </dd>
                      </div>
                    </dl>
                    <p className="pass-label">租借裝備</p>
                    <p className="pass-rentals" id="passRentals">
                      無
                    </p>
                  </div>
                  <div className="pass-foot">
                    <div>
                      <p className="pass-label">預估費用</p>
                      <p className="pass-fee">
                        NT$ <strong id="passFee">—</strong>
                      </p>
                    </div>
                    <div className="pass-barcode" aria-hidden="true" />
                  </div>
                </aside>
              </div>
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
              <p>
                網頁程式設計 Week 6 課程練習頁面，站上的梯次、領隊、費用與報名流程皆為虛構。
              </p>
              {/* 電子報訂閱（input-group + HTML5 驗證） */}
              <form className="news-form" id="newsForm" noValidate>
                <label className="form-label" htmlFor="newsEmail">
                  訂閱開團通知
                </label>
                <div className="input-group has-validation">
                  <span className="input-group-text">
                    <i className="bi bi-envelope" />
                  </span>
                  <input className="form-control" type="email" id="newsEmail" name="email" placeholder="name@example.com" required autoComplete="email" />
                  <button className="btn btn-warning" type="submit">
                    訂閱
                  </button>
                  <div className="invalid-feedback">請輸入正確的 Email。</div>
                </div>
              </form>
            </div>
            <div className="col-md-6 text-md-end">
              <a className="btn btn-outline-light rounded-pill me-2" href="/weekly/06/">
                <i className="bi bi-arrow-left me-1" />
                回到 Week 06
              </a>
              <a
                className="btn btn-outline-light rounded-pill"
                href="https://github.com/qmkc/nfu-coursework/tree/main/115-1/web-programming/src/app/demo/trailhead-w6"
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
