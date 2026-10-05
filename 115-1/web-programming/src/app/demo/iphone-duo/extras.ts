import AOS from "aos";
import confetti from "canvas-confetti";
import Chart from "chart.js/auto";
import { CountUp } from "countup.js";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { gsap } from "gsap";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Swal from "sweetalert2";

dayjs.extend(duration);

export interface DuoExtrasHandle {
  /** Re-tint the charts when the colorway swatch changes. */
  setAccent(accent: string, accent2: string): void;
  cleanup(): void;
}

// Pre-orders open 10/16 (see the pricing section copy) — Taipei time.
const PREORDER_OPENS = dayjs("2026-10-16T00:00:00+08:00");

// AOS has no destroy(): init() permanently adds window listeners, so it must
// only ever run once per page load, however many times this route is visited.
let aosInitialized = false;

function hexToRgba(hex: string, alpha: number): string {
  const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!match) return `rgba(216, 178, 107, ${alpha})`;
  const [r, g, b] = match.slice(1).map((c) => parseInt(c, 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Everything on the page that isn't Bootstrap/GSAP/Three.js: SweetAlert2
 * dialogs, AOS reveals, Chart.js charts, CountUp stat counters, the dayjs
 * pre-order countdown and canvas-confetti. Called from initDuoPage() after its
 * gsap.context() has run, so ScrollSmoother and the hero pin already exist.
 */
export function initDuoExtras(): DuoExtrasHandle {
  const rootStyle = getComputedStyle(document.documentElement);
  let accent = rootStyle.getPropertyValue("--accent").trim() || "#d8b26b";
  let accent2 = rootStyle.getPropertyValue("--accent-2").trim() || "#f4dca0";

  // ------------------------------------------------------------------
  // SweetAlert2 — heightAuto would set `height: auto` on <html>/<body>,
  // which collapses the body height ScrollSmoother relies on for its
  // scroll range. The smoother is also paused while a dialog is open,
  // since normalizeScroll would otherwise keep scrolling the page behind it.
  // ------------------------------------------------------------------
  const modal = Swal.mixin({
    theme: "dark",
    heightAuto: false,
    scrollbarPadding: false,
    buttonsStyling: false,
    customClass: {
      popup: "duo-swal",
      confirmButton: "btn btn-glow rounded-pill px-4",
      cancelButton: "btn btn-outline-glow rounded-pill px-4",
    },
    didOpen: () => ScrollSmoother.get()?.paused(true),
    didClose: () => ScrollSmoother.get()?.paused(false),
  });

  const toast = Swal.mixin({
    theme: "dark",
    toast: true,
    position: "top-end",
    timer: 3500,
    timerProgressBar: true,
    showConfirmButton: false,
    customClass: { popup: "duo-swal-toast" },
  });

  void modal.fire({
    icon: "info",
    title: "校園測試 Demo",
    html: "本網站為<strong>課程作業練習頁面</strong>，並非 Apple 官方網站。<br>頁面上的產品、規格與價格皆為虛構，無法實際購買。",
    confirmButtonText: "我知道了",
    allowOutsideClick: false,
  });

  document.querySelectorAll<HTMLButtonElement>(".buy-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const { tier, price } = btn.dataset;
      const colorName =
        document.getElementById("colorName")?.textContent?.trim() ?? "";
      const result = await modal.fire({
        icon: "question",
        title: `預購 iPhone Duo ${tier}？`,
        html: `配色：<strong>${colorName}</strong><br>價格：<strong>${price}</strong><br><small>校園測試 demo — 不會真的下單或扣款。</small>`,
        showCancelButton: true,
        confirmButtonText: "確認模擬預購",
        cancelButtonText: "再想想",
      });
      if (!result.isConfirmed) return;

      void confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.7 },
        colors: [accent, accent2, "#ffffff"],
        zIndex: 3000,
      });
      void toast.fire({
        icon: "success",
        title: `已完成模擬預購：${tier} · ${colorName}`,
      });
    });
  });

  document.getElementById("warrantyLink")?.addEventListener("click", (e) => {
    e.preventDefault();
    void modal.fire({
      icon: "info",
      title: "保固政策",
      text: "iPhone Duo 提供一年有限保固（示意內容）。本頁為校園測試 demo，並無實際保固服務。",
      confirmButtonText: "關閉",
    });
  });

  // ------------------------------------------------------------------
  // Pre-order countdown (dayjs)
  // ------------------------------------------------------------------
  const countdown = document.getElementById("preorderCountdown");
  const cells = {
    days: document.getElementById("cdDays"),
    hours: document.getElementById("cdHours"),
    minutes: document.getElementById("cdMinutes"),
    seconds: document.getElementById("cdSeconds"),
  };
  let countdownTimer: number | undefined;

  function tickCountdown(): void {
    const remaining = PREORDER_OPENS.diff(dayjs());
    if (remaining <= 0) {
      if (countdown) countdown.textContent = "預購已開放（模擬）";
      window.clearInterval(countdownTimer);
      return;
    }
    const left = dayjs.duration(remaining);
    const pad = (n: number): string => String(n).padStart(2, "0");
    if (cells.days) cells.days.textContent = String(Math.floor(left.asDays()));
    if (cells.hours) cells.hours.textContent = pad(left.hours());
    if (cells.minutes) cells.minutes.textContent = pad(left.minutes());
    if (cells.seconds) cells.seconds.textContent = pad(left.seconds());
  }

  if (countdown) {
    countdownTimer = window.setInterval(tickCountdown, 1000);
    tickCountdown();
  }

  // ------------------------------------------------------------------
  // Charts (Chart.js) + stat counters (CountUp) — both created when their
  // section scrolls into view, so their entrance animations are actually
  // seen instead of finishing off-screen.
  // ------------------------------------------------------------------
  const charts: Chart[] = [];
  const tickColor = "#b3b3c8";
  const gridColor = "rgba(255, 255, 255, 0.08)";

  function buildCharts(): void {
    const batteryCanvas = document.getElementById(
      "batteryChart",
    ) as HTMLCanvasElement | null;
    const chargeCanvas = document.getElementById(
      "chargeChart",
    ) as HTMLCanvasElement | null;

    if (batteryCanvas) {
      charts.push(
        new Chart(batteryCanvas, {
          type: "bar",
          data: {
            labels: ["一般使用", "外螢幕影片播放"],
            datasets: [
              {
                label: "續航（小時）",
                data: [24, 44],
                backgroundColor: [
                  hexToRgba(accent, 0.85),
                  hexToRgba(accent2, 0.85),
                ],
                borderRadius: 10,
                maxBarThickness: 72,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { ticks: { color: tickColor }, grid: { display: false } },
              y: {
                beginAtZero: true,
                suggestedMax: 50,
                ticks: { color: tickColor },
                grid: { color: gridColor },
              },
            },
          },
        }),
      );
    }

    if (chargeCanvas) {
      charts.push(
        new Chart(chargeCanvas, {
          type: "line",
          data: {
            labels: [0, 10, 20, 30, 40, 50, 60].map((m) => `${m} 分`),
            datasets: [
              {
                label: "60W 有線充電（%）",
                data: [0, 27, 50, 68, 82, 92, 100],
                borderColor: accent,
                backgroundColor: hexToRgba(accent, 0.15),
                pointBackgroundColor: accent2,
                fill: true,
                tension: 0.35,
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: tickColor } } },
            scales: {
              x: { ticks: { color: tickColor }, grid: { color: gridColor } },
              y: {
                min: 0,
                max: 100,
                ticks: { color: tickColor },
                grid: { color: gridColor },
              },
            },
          },
        }),
      );
    }
  }

  const ctx = gsap.context(() => {
    ScrollTrigger.create({
      trigger: "#statsCharts",
      start: "top 85%",
      once: true,
      onEnter: buildCharts,
    });

    document.querySelectorAll<HTMLElement>("[data-countup]").forEach((el) => {
      const counter = new CountUp(el, Number(el.dataset.countup), {
        decimalPlaces: Number(el.dataset.decimals ?? 0),
        duration: 2,
      });
      ScrollTrigger.create({
        trigger: el,
        start: "top 90%",
        once: true,
        onEnter: () => counter.start(),
      });
    });
  });

  // ------------------------------------------------------------------
  // AOS — measures each [data-aos] element's document offset up front, so
  // it has to re-measure whenever ScrollTrigger recalculates (the hero pin
  // inserts ~1400px of spacer above everything else on desktop).
  // ------------------------------------------------------------------
  if (aosInitialized) {
    AOS.refreshHard();
  } else {
    AOS.init({
      duration: 800,
      easing: "ease-out-cubic",
      once: true,
      offset: 80,
    });
    aosInitialized = true;
  }
  const refreshAos = (): void => AOS.refresh();
  ScrollTrigger.addEventListener("refresh", refreshAos);

  return {
    setAccent(nextAccent, nextAccent2) {
      accent = nextAccent;
      accent2 = nextAccent2;
      const [battery, charge] = charts;
      if (battery) {
        battery.data.datasets[0].backgroundColor = [
          hexToRgba(accent, 0.85),
          hexToRgba(accent2, 0.85),
        ];
        battery.update();
      }
      if (charge) {
        Object.assign(charge.data.datasets[0], {
          borderColor: accent,
          backgroundColor: hexToRgba(accent, 0.15),
          pointBackgroundColor: accent2,
        });
        charge.update();
      }
    },
    cleanup() {
      window.clearInterval(countdownTimer);
      ScrollTrigger.removeEventListener("refresh", refreshAos);
      ctx.revert();
      charts.forEach((chart) => chart.destroy());
      confetti.reset();
      Swal.close();
    },
  };
}
