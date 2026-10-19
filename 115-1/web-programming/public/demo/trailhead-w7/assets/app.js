// 只做畫面上的小互動：深淺色、複製／換行、目錄搜尋、← → 換題。
// 範例本身的邏輯都在 PHP，這支 JS 拿掉頁面也照樣能用。
(() => {
  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw === null ? fallback : JSON.parse(raw);
      } catch {
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
      } catch {
        /* 私密視窗等情況存不了，就只是不記住 */
      }
    },
  };

  // ---- 深淺色 ----
  const root = document.documentElement;
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const current =
        root.dataset.theme ??
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = current === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try {
        localStorage.setItem("php30:theme", next);
      } catch {
        /* ignore */
      }
    });
  });

  // ---- 程式碼面板 ----
  document.querySelectorAll("[data-code]").forEach((fig) => {
    const copyBtn = fig.querySelector("[data-copy]");
    const wrapBtn = fig.querySelector("[data-wrap]");
    copyBtn?.addEventListener("click", async () => {
      const text =
        [...fig.querySelectorAll(".ln")]
          .map((line) => line.textContent)
          .join("\n") + "\n";
      try {
        await navigator.clipboard.writeText(text);
        copyBtn.textContent = "已複製 ✓";
      } catch {
        copyBtn.textContent = "複製失敗";
      }
      setTimeout(() => (copyBtn.textContent = "複製"), 1600);
    });
    if (wrapBtn) {
      const apply = (on) => {
        fig.classList.toggle("is-wrapped", on);
        wrapBtn.setAttribute("aria-pressed", String(on));
      };
      apply(store.get("php30:wrap", false));
      wrapBtn.addEventListener("click", () => {
        const on = !fig.classList.contains("is-wrapped");
        apply(on);
        store.set("php30:wrap", on);
      });
    }
  });

  // ---- 目錄搜尋 ----
  const search = document.querySelector("[data-search]");
  if (search) {
    const cards = [...document.querySelectorAll("[data-card]")];
    const lessons = [...document.querySelectorAll("[data-lesson]")];
    const empty = document.querySelector("[data-empty]");
    const run = () => {
      const q = search.value.trim().toLowerCase();
      cards.forEach((card) =>
        card.classList.toggle(
          "is-hidden",
          q !== "" && !card.dataset.text.includes(q),
        ),
      );
      lessons.forEach((lesson) =>
        lesson.classList.toggle(
          "is-hidden",
          !lesson.querySelector("[data-card]:not(.is-hidden)"),
        ),
      );
      empty?.classList.toggle(
        "show",
        cards.every((card) => card.classList.contains("is-hidden")),
      );
    };
    search.addEventListener("input", run);
    addEventListener("keydown", (e) => {
      if (e.key === "/" && document.activeElement !== search) {
        e.preventDefault();
        search.focus();
      }
    });
    run();
  }

  // ---- ← → 換題（正在輸入時不攔截） ----
  const { prev, next } = document.body.dataset;
  addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]"))
      return;
    if (e.key === "ArrowLeft" && prev) location.href = prev;
    if (e.key === "ArrowRight" && next) location.href = next;
  });
})();
