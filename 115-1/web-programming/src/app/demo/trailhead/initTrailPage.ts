import AOS from "aos";
import { Collapse, Offcanvas, ScrollSpy } from "bootstrap";
import confetti from "canvas-confetti";
import Chart from "chart.js/auto";
import { CountUp } from "countup.js";
import L from "leaflet";
import Swal from "sweetalert2";
import Swiper from "swiper";
import { A11y, Autoplay, Keyboard, Navigation, Pagination } from "swiper/modules";
import Typed from "typed.js";

import {
  commonsPage,
  commonsUrl,
  difficultyOrder,
  gallery,
  gear,
  sessions,
  trails,
  typedStrings,
  type Difficulty,
  type Trail,
} from "./data";

// AOS has no destroy(): init() permanently adds window listeners, so it must
// only ever run once per page load, however many times this route is visited.
let aosInitialized = false;

// Chart ink. Bars/lines use the page's primary green; the difficulty doughnut
// uses three separate hues checked for colour-blind separation on a light surface.
const PRIMARY = "#2f6b4f";
const INK_MUTED = "#5d6b63";
const GRID = "rgba(22, 36, 29, 0.08)";
const DIFFICULTY_COLORS: Record<Difficulty, string> = {
  入門: "#14996a",
  中級: "#c2700f",
  進階: "#7a5cc2",
};

const trailById = new Map(trails.map((trail) => [trail.id, trail]));

/**
 * Everything interactive on /demo/trailhead/. Returns a cleanup function —
 * client-side navigation away from this route doesn't reload the page, so the
 * map, charts, slider and listeners all have to be torn down by hand.
 */
export function initTrailPage(): () => void {
  const listeners = new AbortController();
  const { signal } = listeners;
  const on = <K extends keyof HTMLElementEventMap>(
    el: Element | null,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ): void => {
    el?.addEventListener(type, handler as EventListener, { signal });
  };

  // ------------------------------------------------------------------
  // SweetAlert2 — styled with the page's own Bootstrap buttons
  // ------------------------------------------------------------------
  const modal = Swal.mixin({
    buttonsStyling: false,
    customClass: {
      popup: "trail-swal",
      confirmButton: "btn btn-primary rounded-pill px-4",
      cancelButton: "btn btn-outline-secondary rounded-pill px-4",
    },
  });
  const toast = Swal.mixin({
    toast: true,
    position: "top-end",
    timer: 2600,
    timerProgressBar: true,
    showConfirmButton: false,
  });

  // ------------------------------------------------------------------
  // Navbar: solid background once the hero starts scrolling away, section
  // highlighting (ScrollSpy), and close the mobile menu after picking a link
  // ------------------------------------------------------------------
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const celebrate = (): void => {
    if (reducedMotion) return;
    void confetti({
      particleCount: 120,
      spread: 75,
      origin: { y: 0.7 },
      colors: [PRIMARY, "#f0b23e", "#ffffff"],
      zIndex: 2000,
    });
  };

  // One scroll handler drives everything scroll-linked: the navbar background,
  // the progress bar, the back-to-top button and the hero parallax (the CSS
  // reads --hero-shift and moves the photo and each ridge at a different rate).
  const nav = document.getElementById("trailNav");
  const navMenu = document.getElementById("trailNavMenu");
  const hero = document.getElementById("trailHero");
  const progress = document.getElementById("scrollProgress");
  const toTop = document.getElementById("toTop");
  let scrollFrame = 0;
  const applyScroll = (): void => {
    scrollFrame = 0;
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    nav?.classList.toggle("scrolled", y > 40);
    toTop?.classList.toggle("show", y > window.innerHeight * 0.8);
    progress?.style.setProperty("transform", `scaleX(${max > 0 ? y / max : 0})`);
    if (hero && !reducedMotion && y < hero.offsetHeight) {
      hero.style.setProperty("--hero-shift", `${y}px`);
    }
  };
  const onScroll = (): void => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(applyScroll);
  };
  document.addEventListener("scroll", onScroll, { passive: true, signal });
  applyScroll();
  on(toTop, "click", () => window.scrollTo({ top: 0 }));

  // ------------------------------------------------------------------
  // CountUp — hero numbers
  // ------------------------------------------------------------------
  document.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
    const counter = new CountUp(el, Number(el.dataset.countup), { duration: 2.2 });
    if (!counter.error) counter.start();
  });

  const scrollSpy = new ScrollSpy(document.body, {
    target: "#trailNav",
    rootMargin: "-30% 0px -60%",
  });
  navMenu?.querySelectorAll(".nav-link").forEach((link) => {
    on(link, "click", () => {
      if (navMenu.classList.contains("show")) {
        Collapse.getOrCreateInstance(navMenu).hide();
      }
    });
  });

  // ------------------------------------------------------------------
  // Typed.js — hero headline
  // ------------------------------------------------------------------
  const typedTarget = document.getElementById("heroTyped");
  let typed: Typed | undefined;
  if (typedTarget) {
    typedTarget.textContent = "";
    typed = new Typed(typedTarget, {
      strings: typedStrings,
      typeSpeed: 90,
      backSpeed: 45,
      backDelay: 1800,
      loop: true,
    });
  }

  // ------------------------------------------------------------------
  // Swiper — route cards
  // ------------------------------------------------------------------
  const swiper = new Swiper("#trailSwiper", {
    modules: [A11y, Autoplay, Keyboard, Navigation, Pagination],
    slidesPerView: 1.15,
    spaceBetween: 16,
    // Adds .swiper-slide-visible, which the CSS uses to draw each card's profile line.
    watchSlidesProgress: true,
    keyboard: { enabled: true },
    autoplay: { delay: 5000, pauseOnMouseEnter: true },
    pagination: { el: "#trailSwiper .swiper-pagination", clickable: true },
    navigation: { prevEl: "#trailPrev", nextEl: "#trailNext" },
    breakpoints: {
      576: { slidesPerView: 2, spaceBetween: 20 },
      992: { slidesPerView: 3, spaceBetween: 24 },
    },
  });

  // ------------------------------------------------------------------
  // "我的行程" — picked routes live in memory only; the offcanvas lists them
  // ------------------------------------------------------------------
  const plan = new Set<string>();
  const planCount = document.getElementById("planCount");
  const planList = document.getElementById("planList");
  const planEmpty = document.getElementById("planEmpty");
  const planSummary = document.getElementById("planSummary");
  const planDays = document.getElementById("planDays");
  const planKm = document.getElementById("planKm");
  const planSubmit = document.getElementById("planSubmit") as HTMLButtonElement | null;
  const planCanvas = document.getElementById("planCanvas");

  function renderPlan(): void {
    const picked = trails.filter((trail) => plan.has(trail.id));

    if (planCount) {
      planCount.textContent = String(picked.length);
      planCount.hidden = picked.length === 0;
    }
    if (planEmpty) planEmpty.hidden = picked.length > 0;
    if (planSummary) planSummary.hidden = picked.length === 0;
    if (planSubmit) planSubmit.disabled = picked.length === 0;
    if (planDays) {
      planDays.textContent = `${picked.reduce((sum, t) => sum + t.days, 0)} 天`;
    }
    if (planKm) {
      const km = picked.reduce((sum, t) => sum + t.distanceKm, 0);
      planKm.textContent = `${Math.round(km * 10) / 10} km`;
    }

    planList?.replaceChildren(
      ...picked.map((trail) => {
        const item = document.createElement("li");
        item.className = "list-group-item d-flex justify-content-between align-items-center px-0";

        const text = document.createElement("span");
        const name = document.createElement("strong");
        name.textContent = trail.name;
        const meta = document.createElement("small");
        meta.className = "d-block text-body-secondary";
        meta.textContent = `${trail.days} 天 · ${trail.distanceKm} km · ${trail.difficulty}`;
        text.append(name, meta);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "btn btn-sm btn-outline-danger rounded-pill";
        remove.textContent = "移除";
        remove.setAttribute("aria-label", `移除 ${trail.name}`);
        remove.addEventListener("click", () => {
          plan.delete(trail.id);
          renderPlan();
        });

        item.append(text, remove);
        return item;
      }),
    );

    document.querySelectorAll<HTMLButtonElement>("[data-add]").forEach((btn) => {
      const added = plan.has(btn.dataset.add ?? "");
      btn.classList.toggle("btn-primary", !added);
      btn.classList.toggle("btn-success", added);
      const icon = btn.querySelector("i");
      if (icon) icon.className = `bi ${added ? "bi-check-circle-fill" : "bi-plus-circle"} me-1`;
      const label = btn.querySelector("span");
      if (label) label.textContent = added ? "已加入" : "加入行程";
    });
  }

  function addToPlan(trail: Trail): void {
    if (plan.has(trail.id)) {
      void toast.fire({ icon: "info", title: `${trail.name} 已經在行程裡了` });
      return;
    }
    plan.add(trail.id);
    renderPlan();
    void toast.fire({ icon: "success", title: `已加入：${trail.name}` });
  }

  document.querySelectorAll<HTMLButtonElement>("[data-add]").forEach((btn) => {
    on(btn, "click", () => {
      const trail = trailById.get(btn.dataset.add ?? "");
      if (trail) addToPlan(trail);
    });
  });

  document.querySelectorAll<HTMLButtonElement>("[data-info]").forEach((btn) => {
    on(btn, "click", async () => {
      const trail = trailById.get(btn.dataset.info ?? "");
      if (!trail) return;
      const result = await modal.fire({
        title: trail.name,
        imageUrl: commonsUrl(trail.photo.file, 960),
        imageAlt: trail.photo.alt,
        html: `
          <p class="text-start mb-3">${trail.summary}</p>
          <table class="table table-sm text-start mb-0">
            <tbody>
              <tr><th scope="row">最高點</th><td>${trail.peak}（${trail.elevation.toLocaleString("en-US")} m）</td></tr>
              <tr><th scope="row">登山口</th><td>${trail.trailhead}</td></tr>
              <tr><th scope="row">所在地</th><td>${trail.region}</td></tr>
              <tr><th scope="row">行程</th><td>${trail.days} 天 · 來回約 ${trail.distanceKm} km</td></tr>
              <tr><th scope="row">難度</th><td>${trail.difficulty}</td></tr>
            </tbody>
          </table>`,
        showCancelButton: true,
        confirmButtonText: "加入行程",
        cancelButtonText: "關閉",
      });
      if (result.isConfirmed) addToPlan(trail);
    });
  });

  on(planSubmit, "click", async () => {
    const picked = trails.filter((trail) => plan.has(trail.id));
    const result = await modal.fire({
      icon: "question",
      title: "送出這份行程？",
      text: `共 ${picked.length} 條路線：${picked.map((t) => t.name).join("、")}`,
      showCancelButton: true,
      confirmButtonText: "送出",
      cancelButtonText: "再想想",
    });
    if (!result.isConfirmed) return;
    plan.clear();
    renderPlan();
    if (planCanvas) Offcanvas.getInstance(planCanvas)?.hide();
    celebrate();
    void modal.fire({
      icon: "success",
      title: "行程已送出（模擬）",
      text: "這是課程練習頁面，沒有任何資料被傳送出去。",
      confirmButtonText: "好",
    });
  });

  renderPlan();

  // ------------------------------------------------------------------
  // Leaflet — one marker per summit; the list on the left flies to it.
  // divIcon markers, so no marker image has to survive the bundler.
  // ------------------------------------------------------------------
  const mapEl = document.getElementById("trailMap");
  let map: L.Map | undefined;
  const markers = new Map<string, L.Marker>();

  if (mapEl) {
    map = L.map(mapEl, { scrollWheelZoom: false }).setView([23.9, 121.15], 8);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 17,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
    }).addTo(map);

    for (const trail of trails) {
      const popup = document.createElement("div");
      const title = document.createElement("strong");
      title.textContent = trail.peak;
      const detail = document.createElement("div");
      detail.textContent = `${trail.elevation.toLocaleString("en-US")} m · ${trail.days} 天 · ${trail.difficulty}`;
      popup.append(title, detail);

      const marker = L.marker([trail.lat, trail.lng], {
        title: trail.peak,
        icon: L.divIcon({
          className: "trail-marker",
          html: '<i class="bi bi-triangle-fill"></i>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          popupAnchor: [0, -16],
        }),
      })
        .addTo(map)
        .bindPopup(popup);
      marker.on("popupopen", () => setActiveListItem(trail.id));
      markers.set(trail.id, marker);
    }
  }

  function setActiveListItem(id: string): void {
    document.querySelectorAll<HTMLElement>("[data-fly]").forEach((item) => {
      item.classList.toggle("active", item.dataset.fly === id);
    });
  }

  document.querySelectorAll<HTMLButtonElement>("[data-fly]").forEach((btn) => {
    on(btn, "click", () => {
      const trail = trailById.get(btn.dataset.fly ?? "");
      const marker = trail && markers.get(trail.id);
      if (!map || !trail || !marker) return;
      map.flyTo([trail.lat, trail.lng], 12, { duration: 1.2 });
      marker.openPopup();
    });
  });

  // ------------------------------------------------------------------
  // Chart.js — built when the section scrolls into view, so the entrance
  // animation is actually seen instead of finishing off-screen
  // ------------------------------------------------------------------
  const charts: Chart[] = [];
  let profileChart: Chart<"line", { x: number; y: number }[]> | undefined;

  Chart.defaults.font.family = '"Noto Sans TC", system-ui, sans-serif';
  Chart.defaults.color = INK_MUTED;

  const profilePoints = (trail: Trail): { x: number; y: number }[] =>
    trail.profile.map(([x, y]) => ({ x, y }));

  function buildCharts(): void {
    const distanceCanvas = document.getElementById("distanceChart") as HTMLCanvasElement | null;
    const difficultyCanvas = document.getElementById("difficultyChart") as HTMLCanvasElement | null;
    const profileCanvas = document.getElementById("profileChart") as HTMLCanvasElement | null;

    if (distanceCanvas) {
      const sorted = [...trails].sort((a, b) => b.distanceKm - a.distanceKm);
      charts.push(
        new Chart(distanceCanvas, {
          type: "bar",
          data: {
            labels: sorted.map((trail) => trail.name),
            datasets: [
              {
                label: "來回里程",
                data: sorted.map((trail) => trail.distanceKm),
                backgroundColor: PRIMARY,
                borderRadius: 4,
                maxBarThickness: 22,
              },
            ],
          },
          options: {
            indexAxis: "y",
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: { label: (item) => ` ${item.formattedValue} km` },
              },
            },
            scales: {
              x: {
                beginAtZero: true,
                grid: { color: GRID },
                border: { display: false },
                ticks: { callback: (value) => `${value} km` },
              },
              y: { grid: { display: false } },
            },
          },
        }),
      );
    }

    if (difficultyCanvas) {
      const counts = difficultyOrder.map(
        (level) => trails.filter((trail) => trail.difficulty === level).length,
      );
      charts.push(
        new Chart(difficultyCanvas, {
          type: "doughnut",
          data: {
            labels: difficultyOrder.map((level, i) => `${level}（${counts[i]}）`),
            datasets: [
              {
                data: counts,
                backgroundColor: difficultyOrder.map((level) => DIFFICULTY_COLORS[level]),
                borderColor: "#ffffff",
                borderWidth: 2,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            cutout: "62%",
            plugins: {
              legend: {
                position: "bottom",
                labels: { usePointStyle: true, padding: 18 },
              },
              tooltip: {
                callbacks: { label: (item) => ` ${item.parsed} 條路線` },
              },
            },
          },
        }),
      );
    }

    if (profileCanvas) {
      profileChart = new Chart(profileCanvas, {
        type: "line",
        data: {
          datasets: [
            {
              label: "海拔",
              data: profilePoints(trails[0]),
              borderColor: PRIMARY,
              borderWidth: 2,
              backgroundColor: "rgba(47, 107, 79, 0.12)",
              pointBackgroundColor: PRIMARY,
              pointBorderColor: "#ffffff",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
              fill: true,
              tension: 0.3,
            },
          ],
        },
        options: {
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                title: (items) => `距登山口 ${items[0].parsed.x} km`,
                label: (item) => ` 海拔 ${(item.parsed.y ?? 0).toLocaleString("en-US")} m`,
              },
            },
          },
          scales: {
            x: {
              type: "linear",
              min: 0,
              title: { display: true, text: "距登山口（km）" },
              grid: { display: false },
            },
            y: {
              title: { display: true, text: "海拔（m）" },
              grid: { color: GRID },
              border: { display: false },
            },
          },
        },
      });
      charts.push(profileChart as unknown as Chart);
    }
  }

  const chartsSection = document.getElementById("statsCharts");
  const chartsObserver = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      chartsObserver.disconnect();
      buildCharts();
    },
    { rootMargin: "0px 0px -15% 0px" },
  );
  if (chartsSection) chartsObserver.observe(chartsSection);

  const profileTitle = document.getElementById("profileTitle");
  document.querySelectorAll<HTMLButtonElement>("[data-profile]").forEach((btn) => {
    on(btn, "click", () => {
      const trail = trailById.get(btn.dataset.profile ?? "");
      if (!trail) return;
      document
        .querySelectorAll("[data-profile]")
        .forEach((other) => other.classList.toggle("active", other === btn));
      if (profileTitle) profileTitle.textContent = trail.name;
      if (profileChart) {
        profileChart.data.datasets[0].data = profilePoints(trail);
        profileChart.update();
      }
    });
  });

  // ------------------------------------------------------------------
  // Gear checklist → Bootstrap progress bar
  // ------------------------------------------------------------------
  const gearChecks = document.querySelectorAll<HTMLInputElement>("#gearList input");
  const gearProgress = document.getElementById("gearProgress");
  const gearBar = document.getElementById("gearBar");
  const gearHint = document.getElementById("gearHint");

  function updateGear(announce: boolean): void {
    const done = [...gearChecks].filter((check) => check.checked).length;
    const percent = Math.round((done / gear.length) * 100);
    gearProgress?.setAttribute("aria-valuenow", String(percent));
    if (gearBar) {
      gearBar.style.width = `${percent}%`;
      gearBar.textContent = `${percent}%`;
      gearBar.classList.toggle("bg-success", percent === 100);
    }
    if (gearHint) gearHint.textContent = `已準備 ${done} / ${gear.length} 項`;
    if (announce && percent === 100) {
      celebrate();
      void modal.fire({
        icon: "success",
        title: "裝備都齊了！",
        text: "出發前記得再看一次天氣預報，並把行程告訴留守人。",
        confirmButtonText: "出發",
      });
    }
  }
  gearChecks.forEach((check) => on(check, "change", () => updateGear(true)));
  updateGear(false);

  // ------------------------------------------------------------------
  // Session sign-up (simulated) — SweetAlert2 select input
  // ------------------------------------------------------------------
  const seatsLeft = sessions.map((session) => session.seats);

  document.querySelectorAll<HTMLButtonElement>("[data-signup]").forEach((btn) => {
    on(btn, "click", async () => {
      const index = Number(btn.dataset.signup);
      const session = sessions[index];
      const trail = trailById.get(session.trailId);
      if (!trail) return;

      const options: Record<string, string> = {};
      for (let n = 1; n <= Math.min(4, seatsLeft[index]); n++) options[n] = `${n} 人`;

      const result = await modal.fire({
        title: `報名 ${trail.name}`,
        html: `${session.date}<br>領隊：${session.leader}　剩餘 ${seatsLeft[index]} 個名額`,
        input: "select",
        inputOptions: options,
        inputPlaceholder: "選擇報名人數",
        inputValidator: (value) => (value ? undefined : "請先選擇人數"),
        showCancelButton: true,
        confirmButtonText: "確認報名",
        cancelButtonText: "取消",
      });
      if (!result.isConfirmed) return;

      seatsLeft[index] -= Number(result.value);
      const cell = document.querySelector<HTMLElement>(`[data-seats="${index}"]`);
      if (seatsLeft[index] === 0) {
        btn.disabled = true;
        if (cell) {
          cell.className = "badge text-bg-secondary";
          cell.textContent = "額滿";
        }
      } else if (cell) {
        cell.textContent = String(seatsLeft[index]);
      }
      celebrate();
      void toast.fire({
        icon: "success",
        title: `已模擬報名 ${result.value} 人：${trail.name}`,
      });
    });
  });

  // ------------------------------------------------------------------
  // Gallery — click a photo to see it large, with its credit
  // ------------------------------------------------------------------
  document.querySelectorAll<HTMLButtonElement>("[data-gallery]").forEach((btn) => {
    on(btn, "click", () => {
      const photo = gallery[Number(btn.dataset.gallery)];
      if (!photo) return;
      void modal.fire({
        title: photo.caption,
        imageUrl: commonsUrl(photo.file, 1280),
        imageAlt: photo.alt,
        footer: `<a href="${commonsPage(photo.file)}" target="_blank" rel="noopener">攝影：${photo.author}（${photo.license}）· Wikimedia Commons</a>`,
        width: "min(56rem, 94vw)",
        showConfirmButton: false,
        showCloseButton: true,
        customClass: { popup: "trail-swal trail-swal-photo" },
      });
    });
  });

  // ------------------------------------------------------------------
  // AOS — scroll reveals
  // ------------------------------------------------------------------
  if (aosInitialized) {
    AOS.refreshHard();
  } else {
    AOS.init({ duration: 700, easing: "ease-out-cubic", once: true, offset: 60 });
    aosInitialized = true;
  }

  return () => {
    listeners.abort();
    cancelAnimationFrame(scrollFrame);
    confetti.reset();
    chartsObserver.disconnect();
    charts.forEach((chart) => chart.destroy());
    scrollSpy.dispose();
    typed?.destroy();
    swiper.destroy(true, true);
    map?.remove();
    Swal.close();
  };
}
