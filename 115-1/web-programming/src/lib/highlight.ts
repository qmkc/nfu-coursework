import { codeToHtml } from "shiki";

/**
 * 在建置期（next build）把程式碼轉成帶語法標色的靜態 HTML，瀏覽器端完全不用載入
 * highlighter 或額外的 JS——跟這個專案「能靜態就靜態」的設計一致。
 * 用 light/dark 雙主題輸出 CSS 變數，配合 globals.css 的 .shiki 規則跟著系統深色模式切換。
 */
export function highlightCode(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: {
      light: "github-light",
      dark: "github-dark",
    },
    defaultColor: false,
  });
}
