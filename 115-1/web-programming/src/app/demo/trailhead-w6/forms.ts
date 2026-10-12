import type Swal from "sweetalert2";
import type Swiper from "swiper";

import { commonsUrl, fitnessLabels, heroPhoto, rentals, sessions, trails } from "./data";

type SwalMixin = ReturnType<typeof Swal.mixin>;
type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

interface FormsContext {
  /** addEventListener bound to the page's AbortController (see initTrailPage) */
  on: <K extends keyof HTMLElementEventMap>(
    el: Element | null,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
  ) => void;
  modal: SwalMixin;
  toast: SwalMixin;
  celebrate: () => void;
  swiper: Swiper;
}

const trailById = new Map(trails.map((trail) => [trail.id, trail]));
const rentalById = new Map(rentals.map((item) => [item.id, item]));
const money = (value: number): string => value.toLocaleString("en-US");

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const FILE_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const STRENGTH_LABELS = ["尚未輸入", "太弱", "普通", "不錯", "很強"];

/** yyyy-mm-dd in local time — what <input type="date"> uses for value/min/max. */
function isoDate(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Taiwan national ID check digit. The leading letter maps to a two-digit
 * region code; (tens × 1) + (units × 9) + the next eight digits weighted
 * 8…1 + the final check digit must be a multiple of 10.
 */
function isValidNationalId(id: string): boolean {
  if (!/^[A-Z][12]\d{8}$/.test(id)) return false;
  const region = "ABCDEFGHJKLMNPQRSTUVXYWZIO".indexOf(id[0]) + 10;
  const digits = [...id.slice(1)].map(Number);
  const sum =
    Math.floor(region / 10) +
    (region % 10) * 9 +
    digits.slice(0, 8).reduce((total, digit, i) => total + digit * (8 - i), 0) +
    digits[8];
  return sum % 10 === 0;
}

function formatBytes(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / 1024 / 1024).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** The message for whichever constraint a control is currently failing. */
function messageFor(el: Control): string {
  const { validity } = el;
  if (validity.valid) return "";
  // Set by applyCustomRules() — already a full sentence.
  if (validity.customError) return el.validationMessage;
  if (validity.valueMissing) {
    if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
      return "請選擇。";
    }
    return "這個欄位必填。";
  }
  if (validity.typeMismatch) {
    return el.type === "email" ? "Email 格式不正確。" : "網址要以 https:// 或 http:// 開頭。";
  }
  if (validity.tooShort) return `至少要 ${el.getAttribute("minlength")} 個字。`;
  if (validity.rangeUnderflow) return `不能小於 ${el.getAttribute("min")}。`;
  if (validity.rangeOverflow) return `不能大於 ${el.getAttribute("max")}。`;
  if (validity.patternMismatch) return "格式不正確。";
  return "內容不正確。";
}

/**
 * Week 6: every form on the page. Three of them —
 *   1. #routeFilter  live filter for the route cards (`input` event, no submit)
 *   2. #signupForm   three-step sign-up with validation and a live preview
 *   3. #newsForm     one-field newsletter form (HTML5 validation only)
 * Nothing is sent anywhere: submit handlers call preventDefault() and read the
 * values with FormData.
 */
export function initForms({ on, modal, toast, celebrate, swiper }: FormsContext): void {
  // ==================================================================
  // 1. Route filter
  // ==================================================================
  const filterForm = document.getElementById("routeFilter") as HTMLFormElement | null;
  const filterCount = document.getElementById("filterCount");
  const filterDaysOut = document.getElementById("filterDaysOut");
  const routeEmpty = document.getElementById("routeEmpty");
  const swiperEl = document.getElementById("trailSwiper");

  function applyFilter(): void {
    if (!filterForm) return;
    const data = new FormData(filterForm);
    const keyword = String(data.get("keyword") ?? "").trim().toLowerCase();
    const level = String(data.get("level") ?? "");
    const maxDays = Number(data.get("days") ?? 3);
    if (filterDaysOut) filterDaysOut.textContent = String(maxDays);

    let shown = 0;
    document.querySelectorAll<HTMLElement>("#trailSwiper [data-trail]").forEach((slide) => {
      const trail = trailById.get(slide.dataset.trail ?? "");
      if (!trail) return;
      const haystack = `${trail.name}${trail.peak}${trail.region}${trail.trailhead}`.toLowerCase();
      const match =
        (!keyword || haystack.includes(keyword)) &&
        (!level || trail.difficulty === level) &&
        trail.days <= maxDays;
      slide.hidden = !match;
      if (match) shown++;
    });

    if (filterCount) filterCount.textContent = `符合 ${shown} 條路線`;
    if (routeEmpty) routeEmpty.hidden = shown > 0;
    if (swiperEl) swiperEl.hidden = shown === 0;
    // Hidden slides change the slide count, so Swiper has to re-measure.
    swiper.update();
    swiper.slideTo(0, 0);
  }

  on(filterForm, "input", applyFilter);
  on(filterForm, "submit", (event) => event.preventDefault());
  // `reset` fires before the controls go back to their defaults.
  on(filterForm, "reset", () => window.setTimeout(applyFilter));

  // ==================================================================
  // 2. Sign-up wizard
  // ==================================================================
  const form = document.getElementById("signupForm") as HTMLFormElement | null;
  if (form) initSignup(form);

  function initSignup(form: HTMLFormElement): void {
    const steps = [...form.querySelectorAll<HTMLFieldSetElement>(".signup-step")];
    const indicators = [...form.querySelectorAll<HTMLLIElement>("#signupSteps li")];
    const prevBtn = document.getElementById("stepPrev") as HTMLButtonElement | null;
    const nextBtn = document.getElementById("stepNext") as HTMLButtonElement | null;
    const submitBtn = document.getElementById("stepSubmit") as HTMLButtonElement | null;
    const summary = document.getElementById("signupSummary");
    const field = <T extends HTMLElement = HTMLInputElement>(name: string): T =>
      form.elements.namedItem(name) as unknown as T;
    const byId = (id: string): HTMLElement | null => document.getElementById(id);

    const sessionSelect = field<HTMLSelectElement>("session");
    const people = field("people");
    const phone = field("phone");
    const emergencyPhone = field("emergencyPhone");
    const birthday = field("birthday");
    const briefing = field("briefing");
    const nationalId = field("nationalId");
    const password = field("password");
    const confirmPassword = field("confirmPassword");
    const lineId = field("lineId");
    const healthFile = field("healthFile");
    const note = field<HTMLTextAreaElement>("note");
    const notifyBoxes = [...form.querySelectorAll<HTMLInputElement>('input[name="notify"]')];
    const seatsLeft = sessions.map((session) => session.seats);
    let current = 0;
    let previewUrl: string | undefined;
    let previewFile: File | undefined;

    // Date limits depend on "today", so they're set here instead of in the markup.
    const today = new Date();
    const sixteenYearsAgo = new Date(today.getFullYear() - 16, today.getMonth(), today.getDate());
    birthday.max = isoDate(sixteenYearsAgo);
    birthday.min = "1930-01-01";
    briefing.min = isoDate(today);

    /** Reads the whole form once; everything below (preview, summary, dialog) uses this. */
    function read() {
      const data = new FormData(form);
      const index = data.get("session") === null ? -1 : Number(data.get("session"));
      const session = sessions[index];
      const trail = session ? trailById.get(session.trailId) : undefined;
      const count = Math.min(4, Math.max(1, Number(data.get("people")) || 1));
      // getAll(): every checked box that shares a name.
      const rented = data
        .getAll("rentals")
        .map((id) => rentalById.get(String(id)))
        .filter((item) => item !== undefined);
      const fitness = Number(data.get("fitness") ?? 3);
      const fee = session
        ? (session.price + rented.reduce((sum, item) => sum + item.price, 0)) * count
        : null;
      const id = String(data.get("nationalId") ?? "").toUpperCase();
      return {
        index,
        session,
        trail,
        count,
        rented,
        fitness,
        fee,
        fullName: String(data.get("fullName") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        // Only ever shown masked.
        maskedId: id.length === 10 ? `${id.slice(0, 3)}****${id.slice(7)}` : "",
        emergencyName: String(data.get("emergencyName") ?? "").trim(),
        emergencyPhone: String(data.get("emergencyPhone") ?? "").trim(),
        experience: String(data.get("experience") ?? ""),
        notify: data.getAll("notify").map(String),
        lineId: String(data.get("lineId") ?? "").trim(),
        recordUrl: String(data.get("recordUrl") ?? "").trim(),
        file: healthFile.files?.[0],
        briefing: String(data.get("briefing") ?? ""),
        vegetarian: data.get("vegetarian") === "on",
        note: String(data.get("note") ?? "").trim(),
      };
    }

    // ----------------------------------------------------------------
    // Validation
    // ----------------------------------------------------------------

    /** Sets (or clears) a custom error and keeps the field's feedback text in sync. */
    function rule(el: Control, feedbackId: string, error: string, fallback: string): void {
      el.setCustomValidity(error);
      const feedback = byId(feedbackId);
      if (feedback) feedback.textContent = error || fallback;
    }

    /** Rules HTML attributes can't express: cross-field checks, checksums, groups, files. */
    function applyCustomRules(): void {
      rule(
        emergencyPhone,
        "emergencyPhoneFeedback",
        emergencyPhone.value !== "" && emergencyPhone.value === phone.value
          ? "緊急聯絡人的手機不能跟你自己的一樣。"
          : "",
        "請輸入 09 開頭的 10 碼手機號碼。",
      );

      const seats = seatsLeft[Number(sessionSelect.value)];
      rule(
        people,
        "peopleFeedback",
        sessionSelect.value !== "" && Number(people.value) > seats
          ? `這個梯次只剩 ${seats} 個名額。`
          : "",
        "一次可報名 1 – 4 人。",
      );

      // Format is the pattern attribute's job; this only adds the checksum.
      const id = nationalId.value.toUpperCase();
      rule(
        nationalId,
        "nationalIdFeedback",
        /^[A-Z][12]\d{8}$/.test(id) && !isValidNationalId(id) ? "身分證字號的檢查碼不正確。" : "",
        "請輸入 1 個英文字母加 9 個數字。",
      );

      rule(
        confirmPassword,
        "confirmPasswordFeedback",
        confirmPassword.value !== "" && confirmPassword.value !== password.value
          ? "兩次輸入的密碼不一致。"
          : "",
        "請再輸入一次密碼。",
      );

      // "At least one" for a checkbox group: `required` would demand every box.
      const anyNotify = notifyBoxes.some((box) => box.checked);
      notifyBoxes.forEach((box) => {
        box.setCustomValidity(anyNotify ? "" : "請至少選擇一種通知方式。");
      });

      // LINE ID only exists (and is only required) while LINE is ticked. A
      // disabled control is skipped by both validation and FormData.
      const wantsLine = notifyBoxes.some((box) => box.checked && box.value === "LINE");
      lineId.disabled = !wantsLine;
      const lineField = byId("lineIdField");
      if (lineField) lineField.hidden = !wantsLine;

      const file = healthFile.files?.[0];
      let fileError = "";
      if (file && !FILE_TYPES.includes(file.type)) {
        fileError = "只接受 PDF、JPG、PNG 檔。";
      } else if (file && file.size > MAX_FILE_BYTES) {
        fileError = `檔案 ${formatBytes(file.size)}，超過 2 MB 上限。`;
      }
      rule(healthFile, "healthFileFeedback", fileError, "只接受 PDF、JPG、PNG，檔案不能超過 2 MB。");
    }

    // Fields get live valid/invalid styling only after the visitor has left
    // them once (or tried to advance) — nobody wants red borders while typing
    // the first character.
    const touched = new Set<Control>();
    const styled = (el: Element): el is Control =>
      (el instanceof HTMLInputElement &&
        !["checkbox", "radio", "range", "submit", "button", "reset"].includes(el.type)) ||
      el instanceof HTMLSelectElement ||
      el instanceof HTMLTextAreaElement;

    function reflect(el: Control): void {
      const valid = el.checkValidity();
      el.classList.toggle("is-invalid", !valid);
      el.classList.toggle("is-valid", valid && el.value !== "");
      el.setAttribute("aria-invalid", String(!valid));
    }

    function reflectTouched(): void {
      touched.forEach((el) => {
        if (el.disabled) return;
        reflect(el);
      });
    }

    // ---- Required-field completion bar ----
    function updateProgress(): void {
      const groups = new Map<string, boolean>();
      form.querySelectorAll<Control>("input, select, textarea").forEach((el) => {
        if (el.disabled || !el.name) return;
        const isNotify = el.name === "notify";
        if (!el.required && !isNotify) return;
        // Radios/checkboxes that share a name count once.
        groups.set(el.name, (groups.get(el.name) ?? true) && el.checkValidity());
      });
      const done = [...groups.values()].filter(Boolean).length;
      const percent = Math.round((done / groups.size) * 100);
      const bar = byId("requiredBar");
      if (bar) bar.style.width = `${percent}%`;
      byId("requiredProgress")?.setAttribute("aria-valuenow", String(percent));
      const text = byId("requiredText");
      if (text) text.textContent = `必填欄位 ${done} / ${groups.size}`;
    }

    // ---- Password strength ----
    function updatePassword(): void {
      const value = password.value;
      const checks: Record<string, boolean> = {
        length: value.length >= 8,
        letter: /[A-Za-z]/.test(value),
        digit: /\d/.test(value),
        symbol: /[^A-Za-z0-9]/.test(value),
      };
      document.querySelectorAll<HTMLElement>("#pwRules [data-rule]").forEach((item) => {
        item.classList.toggle("met", checks[item.dataset.rule ?? ""]);
      });
      let score = 0;
      if (value !== "") {
        score = 1;
        if (checks.length && checks.letter && checks.digit) score = 2;
        if (score === 2 && (checks.symbol || /[a-z]/.test(value) && /[A-Z]/.test(value))) score = 3;
        if (score === 3 && checks.symbol && value.length >= 12) score = 4;
      }
      byId("pwMeter")?.setAttribute("data-score", String(score));
      const label = byId("pwStrength");
      if (label) label.textContent = `密碼強度：${STRENGTH_LABELS[score]}`;
    }

    on(byId("togglePassword"), "click", (event) => {
      const button = event.currentTarget as HTMLButtonElement;
      const show = password.type === "password";
      password.type = show ? "text" : "password";
      confirmPassword.type = password.type;
      button.setAttribute("aria-pressed", String(show));
      button.setAttribute("aria-label", show ? "隱藏密碼" : "顯示密碼");
      const icon = button.querySelector("i");
      if (icon) icon.className = `bi ${show ? "bi-eye-slash" : "bi-eye"}`;
    });

    // ---- Uploaded file: name, size and a thumbnail for images ----
    function updateFilePreview(): void {
      const box = byId("filePreview");
      const image = byId("filePreviewImage") as HTMLImageElement | null;
      const icon = byId("filePreviewIcon");
      const text = byId("filePreviewText");
      const file = healthFile.files?.[0];
      // refresh() runs on every keystroke; only rebuild when the file itself changed.
      if (file === previewFile) return;
      previewFile = file;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = undefined;
      if (!box || !image || !icon || !text) return;
      box.hidden = !file || !healthFile.checkValidity();
      if (!file || box.hidden) return;

      const isImage = file.type.startsWith("image/");
      image.hidden = !isImage;
      icon.hidden = isImage;
      if (isImage) {
        previewUrl = URL.createObjectURL(file);
        image.src = previewUrl;
      }
      text.textContent = `${file.name}（${formatBytes(file.size)}）`;
    }

    // ----------------------------------------------------------------
    // Live preview (the pass card)
    // ----------------------------------------------------------------
    const pass = {
      card: byId("passCard"),
      photo: byId("passPhoto") as HTMLImageElement | null,
      route: byId("passRoute"),
      name: byId("passName"),
      date: byId("passDate"),
      people: byId("passPeople"),
      experience: byId("passExperience"),
      fitness: byId("passFitness"),
      rentals: byId("passRentals"),
      fee: byId("passFee"),
    };
    const setText = (el: HTMLElement | null, text: string): void => {
      if (!el || el.textContent === text) return;
      el.textContent = text;
      // Restart the highlight animation on the value that just changed.
      el.classList.remove("flash");
      void el.offsetWidth;
      el.classList.add("flash");
    };

    function updatePreview(): void {
      const values = read();
      setText(pass.name, values.fullName || "你的名字");
      setText(pass.route, values.trail ? values.trail.name : "尚未選擇梯次");
      setText(pass.date, values.session ? values.session.date : "—");
      setText(pass.people, `${values.count} 人`);
      setText(pass.experience, values.experience || "—");
      setText(
        pass.rentals,
        values.rented.length ? values.rented.map((item) => item.label).join("、") : "無",
      );
      setText(pass.fee, values.fee === null ? "—" : money(values.fee));
      pass.card?.classList.toggle("ready", values.session !== undefined);

      pass.fitness?.setAttribute("aria-label", `體能 ${values.fitness} / 5`);
      pass.fitness?.querySelectorAll("span").forEach((dot, i) => {
        dot.classList.toggle("on", i < values.fitness);
      });
      const fitnessOut = byId("fitnessOut");
      if (fitnessOut) fitnessOut.textContent = fitnessLabels[values.fitness - 1];

      const photoSrc = commonsUrl(values.trail ? values.trail.photo.file : heroPhoto.file, 960);
      if (pass.photo && pass.photo.src !== photoSrc) pass.photo.src = photoSrc;

      const noteCount = byId("noteCount");
      if (noteCount) noteCount.textContent = String(note.value.length);
    }

    /** Everything that depends on the form's current values, in dependency order. */
    function refresh(): void {
      applyCustomRules();
      reflectTouched();
      updatePassword();
      updateFilePreview();
      updatePreview();
      updateProgress();
    }

    // ---- Summary list, shared by step C and the confirm dialog ----
    function buildSummary(target: HTMLElement): void {
      const values = read();
      const rows: [string, string][] = [
        ["姓名", values.fullName],
        ["電子郵件", values.email],
        ["手機", values.phone],
        ["身分證字號", values.maskedId],
        ["緊急聯絡人", `${values.emergencyName}（${values.emergencyPhone}）`],
        ["查詢密碼", "已設定（不顯示）"],
        ["梯次", values.session ? `${values.session.date}｜${values.trail?.name}` : "—"],
        ["人數", `${values.count} 人`],
        ["登山經驗", values.experience],
        ["體能自評", fitnessLabels[values.fitness - 1]],
        ["租借裝備", values.rented.length ? values.rented.map((item) => item.label).join("、") : "無"],
        [
          "通知方式",
          values.notify.join("、") + (values.lineId ? `（LINE ID：${values.lineId}）` : ""),
        ],
        ["餐點", values.vegetarian ? "素食" : "一般"],
      ];
      if (values.briefing) rows.push(["行前說明會", values.briefing]);
      if (values.recordUrl) rows.push(["登山紀錄", values.recordUrl]);
      if (values.file) rows.push(["健康聲明書", `${values.file.name}（${formatBytes(values.file.size)}）`]);
      if (values.note) rows.push(["備註", values.note]);
      rows.push(["預估費用", values.fee === null ? "—" : `NT$ ${money(values.fee)}`]);

      // textContent, not innerHTML: these are values the visitor typed.
      target.replaceChildren(
        ...rows.map(([label, value]) => {
          const row = document.createElement("div");
          const dt = document.createElement("dt");
          dt.textContent = label;
          const dd = document.createElement("dd");
          dd.textContent = value;
          row.append(dt, dd);
          return row;
        }),
      );
    }

    // ----------------------------------------------------------------
    // Steps
    // ----------------------------------------------------------------
    const errorBox = byId("stepErrors");
    const errorList = byId("stepErrorsList");
    const errorTitle = byId("stepErrorsTitle");

    function labelFor(el: Control): string {
      if (el.name === "experience") return "登山經驗";
      if (el.name === "notify") return "行前通知方式";
      const label = form.querySelector(`label[for="${el.id}"]`);
      return (label?.textContent ?? el.name).replace(/[*＊]/g, "").trim();
    }

    /** Lists every failing field of a step, each a button that jumps to it. */
    function showErrors(invalid: Control[]): void {
      if (!errorBox || !errorList || !errorTitle) return;
      const seen = new Set<string>();
      const unique = invalid.filter((el) => !seen.has(el.name) && seen.add(el.name));
      errorTitle.textContent = `還有 ${unique.length} 個欄位需要修正`;
      errorList.replaceChildren(
        ...unique.map((el) => {
          const item = document.createElement("li");
          const jump = document.createElement("button");
          jump.type = "button";
          jump.textContent = labelFor(el);
          jump.addEventListener("click", () => el.focus());
          item.append(jump, `：${messageFor(el)}`);
          return item;
        }),
      );
      errorBox.hidden = false;
    }

    function showStep(index: number): void {
      current = index;
      steps.forEach((step, i) => step.classList.toggle("active", i === index));
      indicators.forEach((item, i) => {
        item.classList.toggle("active", i === index);
        item.classList.toggle("done", i < index);
        item.querySelector("button")?.toggleAttribute("aria-current", i === index);
      });
      form.style.setProperty("--step", String(index));
      if (prevBtn) prevBtn.hidden = index === 0;
      if (nextBtn) nextBtn.hidden = index === steps.length - 1;
      if (submitBtn) submitBtn.hidden = index !== steps.length - 1;
      if (index === steps.length - 1 && summary) buildSummary(summary);
    }

    /** Validates one step; on failure shows the feedback, the error list, and focuses the first bad field. */
    function validateStep(index: number): boolean {
      const step = steps[index];
      step.querySelectorAll("input, select, textarea").forEach((el) => {
        if (styled(el)) touched.add(el);
      });
      refresh();
      // was-validated covers what reflect() doesn't style: radios, checkboxes, groups.
      step.classList.add("was-validated");

      const invalid = [...step.querySelectorAll<Control>("input, select, textarea")].filter(
        (el) => !el.disabled && !el.checkValidity(),
      );
      if (invalid.length === 0) {
        if (errorBox) errorBox.hidden = true;
        return true;
      }
      showErrors(invalid);
      invalid[0].focus();
      step.classList.remove("shake");
      void step.offsetWidth;
      step.classList.add("shake");
      return false;
    }

    function goTo(target: number): void {
      // Going back is always allowed; going forward needs every step in between to pass.
      for (let i = current; i < target; i++) {
        if (!validateStep(i)) {
          showStep(i);
          return;
        }
      }
      if (errorBox) errorBox.hidden = true;
      showStep(target);
    }

    on(nextBtn, "click", () => goTo(current + 1));
    on(prevBtn, "click", () => goTo(current - 1));
    form.querySelectorAll<HTMLButtonElement>("[data-goto]").forEach((btn) => {
      on(btn, "click", () => goTo(Number(btn.dataset.goto)));
    });

    on(form, "input", (event) => {
      if (event.target === nationalId) nationalId.value = nationalId.value.toUpperCase();
      // A file picker has no meaningful blur, so judge the file as soon as it's chosen.
      if (event.target === healthFile) touched.add(healthFile);
      refresh();
      // Keep the error list honest while the visitor works through it.
      if (errorBox && !errorBox.hidden) {
        const invalid = [...steps[current].querySelectorAll<Control>("input, select, textarea")].filter(
          (el) => !el.disabled && !el.checkValidity(),
        );
        if (invalid.length) showErrors(invalid);
        else errorBox.hidden = true;
      }
    });

    // `blur` doesn't bubble; `focusout` does, so one listener covers every field.
    on(form, "focusout", (event) => {
      const el = event.target;
      if (!(el instanceof Element) || !styled(el)) return;
      touched.add(el);
      refresh();
    });

    on(form, "reset", () => {
      window.setTimeout(() => {
        touched.forEach((el) => {
          el.classList.remove("is-valid", "is-invalid");
          el.removeAttribute("aria-invalid");
        });
        touched.clear();
        steps.forEach((step) => step.classList.remove("was-validated"));
        if (errorBox) errorBox.hidden = true;
        password.type = "password";
        confirmPassword.type = "password";
        refresh();
        showStep(0);
      });
    });

    // ---- "選這梯" buttons in the schedule table prefill the select ----
    function refreshSeats(): void {
      sessions.forEach((session, i) => {
        const trail = trailById.get(session.trailId);
        const option = sessionSelect.querySelector<HTMLOptionElement>(`option[value="${i}"]`);
        if (option) {
          option.disabled = seatsLeft[i] === 0;
          option.textContent = `${session.date}｜${trail?.name}${
            seatsLeft[i] === 0 ? "（額滿）" : `（剩 ${seatsLeft[i]} 位）`
          }`;
        }
        const cell = document.querySelector<HTMLElement>(`[data-seats="${i}"]`);
        const pick = document.querySelector<HTMLButtonElement>(`[data-pick="${i}"]`);
        if (seatsLeft[i] === 0) {
          if (pick) pick.disabled = true;
          if (cell) {
            cell.className = "badge text-bg-secondary";
            cell.textContent = "額滿";
          }
        } else if (cell) {
          cell.textContent = String(seatsLeft[i]);
        }
      });
    }

    document.querySelectorAll<HTMLButtonElement>("[data-pick]").forEach((btn) => {
      on(btn, "click", () => {
        sessionSelect.value = btn.dataset.pick ?? "";
        refresh();
        byId("signup")?.scrollIntoView();
        const trail = trailById.get(sessions[Number(btn.dataset.pick)].trailId);
        void toast.fire({ icon: "info", title: `已帶入梯次：${trail?.name}` });
      });
    });

    // ---- Submit ----
    on(form, "submit", async (event) => {
      event.preventDefault();
      for (let i = 0; i < steps.length; i++) {
        if (!validateStep(i)) {
          showStep(i);
          return;
        }
      }

      const values = read();
      const list = document.createElement("dl");
      list.className = "signup-summary text-start";
      buildSummary(list);

      const result = await modal.fire({
        icon: "question",
        title: "確認送出報名？",
        html: list,
        showCancelButton: true,
        confirmButtonText: "送出",
        cancelButtonText: "再檢查一下",
      });
      if (!result.isConfirmed) return;

      seatsLeft[values.index] -= values.count;
      refreshSeats();
      celebrate();

      const code = `TH-${String(Date.now()).slice(-6)}`;
      const done = document.createElement("p");
      done.className = "mb-0";
      done.textContent = `${values.fullName}，已收到你 ${values.count} 人的「${values.trail?.name}」報名。報名編號 ${code}。這是課程練習頁面，沒有任何資料被傳送出去。`;
      await modal.fire({
        icon: "success",
        title: "報名完成（模擬）",
        html: done,
        confirmButtonText: "好",
      });
      form.reset();
    });

    refresh();
    showStep(0);
  }

  // ==================================================================
  // 3. Newsletter
  // ==================================================================
  const newsForm = document.getElementById("newsForm") as HTMLFormElement | null;
  on(newsForm, "submit", (event) => {
    event.preventDefault();
    if (!newsForm) return;
    newsForm.classList.add("was-validated");
    if (!newsForm.checkValidity()) return;
    const email = String(new FormData(newsForm).get("email"));
    newsForm.reset();
    newsForm.classList.remove("was-validated");
    void toast.fire({ icon: "success", title: `已模擬訂閱：${email}` });
  });
}
