// 「山行 Trailhead」頁面用的全部內容。page.tsx（建置期產生 HTML）跟
// initTrailPage.ts（瀏覽器端的地圖／圖表／對話框）共用同一份，避免兩邊各寫一次。
// 里程、海拔剖面都是課程練習用的概略值，不是可以拿去規劃行程的精確資料。

export type Difficulty = "入門" | "中級" | "進階";

/** 照片都來自 Wikimedia Commons，依授權條款在頁尾標示作者與授權。 */
export interface Photo {
  /** Commons 上的檔名（不含 File: 前綴） */
  file: string;
  author: string;
  license: string;
  alt: string;
}

/** Special:FilePath 會轉址到指定寬度的縮圖，不必自己拼 upload.wikimedia.org 的雜湊路徑。 */
export const commonsUrl = (file: string, width: number): string =>
  `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;

export const commonsPage = (file: string): string =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file)}`;

export const heroPhoto: Photo = {
  file: "YushanSeaCoud4.jpg",
  author: "James Ho",
  license: "CC BY-SA 2.0",
  alt: "",
};

export interface GalleryPhoto extends Photo {
  caption: string;
}

export const gallery: GalleryPhoto[] = [
  { file: "Campsite near Hehuan North Peak.jpg", author: "Moran Tsai", license: "CC0", alt: "合歡北峰附近的草原營地", caption: "合歡北峰・草原營地" },
  { file: "YushanSeaCloud3.jpg", author: "James Ho", license: "CC BY-SA 2.0", alt: "玉山上看見的雲海", caption: "玉山・雲海" },
  { file: "玉山主峰 08.jpg", author: "Dragons70c", license: "CC BY-SA 4.0", alt: "玉山主峰的岩稜", caption: "玉山・岩稜" },
  { file: "Chiaming Lake 20180718 02.jpg", author: "中岑 范姜", license: "CC BY-SA 2.0", alt: "從高處俯瞰嘉明湖", caption: "嘉明湖・俯瞰" },
  { file: "雪山圈谷 - panoramio.jpg", author: "Daniel Guo", license: "CC BY-SA 3.0", alt: "積雪的雪山圈谷", caption: "雪山・雪季圈谷" },
  { file: "DabajianMountain ChunYuanLiu.jpg", author: "Chunyuanliu", license: "CC BY-SA 4.0", alt: "遠望大霸尖山與群峰", caption: "大霸尖山・群峰" },
];

export interface Trail {
  id: string;
  name: string;
  peak: string;
  elevation: number;
  region: string;
  trailhead: string;
  days: number;
  /** 來回里程（公里） */
  distanceKm: number;
  difficulty: Difficulty;
  lat: number;
  lng: number;
  summary: string;
  photo: Photo;
  /** 登山口到最高點的海拔剖面：[距離 km, 海拔 m] */
  profile: [number, number][];
}

export const trails: Trail[] = [
  {
    id: "yushan",
    name: "玉山主峰線",
    peak: "玉山主峰",
    elevation: 3952,
    region: "南投・嘉義",
    trailhead: "塔塔加登山口",
    days: 2,
    distanceKm: 21.8,
    difficulty: "中級",
    lat: 23.47,
    lng: 120.9572,
    photo: { file: "玉山主峰.jpg", author: "Kf047423", license: "CC BY-SA 4.0", alt: "從稜線望向玉山主峰" },
    summary: "東北亞最高峰。步道平緩好走，夜宿排雲山莊，隔天清晨摸黑攻頂看日出。",
    profile: [
      [0, 2610],
      [1.7, 2790],
      [4, 3000],
      [6, 3150],
      [8.5, 3402],
      [9.7, 3650],
      [10.9, 3952],
    ],
  },
  {
    id: "xueshan",
    name: "雪山主東峰線",
    peak: "雪山主峰",
    elevation: 3886,
    region: "台中・苗栗",
    trailhead: "雪山登山口",
    days: 2,
    distanceKm: 21.8,
    difficulty: "中級",
    lat: 24.3833,
    lng: 121.2317,
    photo: { file: "雪山圈谷.jpg", author: "Li-Shan Liu", license: "CC BY-SA 4.0", alt: "雪山圈谷的碎石坡與登山者" },
    summary: "一路經過哭坡、東峰、黑森林，最後走進冰河遺跡雪山圈谷，景觀變化最豐富的一條。",
    profile: [
      [0, 2140],
      [2, 2463],
      [4, 2900],
      [5, 3201],
      [7.1, 3100],
      [8.5, 3350],
      [9.8, 3600],
      [10.9, 3886],
    ],
  },
  {
    id: "hehuan",
    name: "合歡北峰",
    peak: "合歡山北峰",
    elevation: 3422,
    region: "南投・花蓮",
    trailhead: "台 14 甲 37K 登山口",
    days: 1,
    distanceKm: 4,
    difficulty: "入門",
    lat: 24.1817,
    lng: 121.2817,
    photo: { file: "View south from Hehuan North Peak.jpg", author: "Moran Tsai", license: "CC0", alt: "從合歡北峰往南看的箭竹草原" },
    summary: "半天就能來回的百岳入門款。前段陡上，過了反射板就是一整片開闊的箭竹草原。",
    profile: [
      [0, 2970],
      [0.5, 3080],
      [1, 3200],
      [1.5, 3320],
      [2, 3422],
    ],
  },
  {
    id: "jiaming",
    name: "嘉明湖",
    peak: "三叉山",
    elevation: 3496,
    region: "台東",
    trailhead: "向陽登山口",
    days: 3,
    distanceKm: 26,
    difficulty: "中級",
    lat: 23.2933,
    lng: 121.0342,
    photo: { file: "嘉明湖 (cropped).jpg", author: "CHU WayNe", license: "CC BY 2.0", alt: "草原環繞的嘉明湖" },
    summary: "被叫做「天使的眼淚」的高山湖泊。稜線上風很大，但沿途的草原跟雲海值得多背一件外套。",
    profile: [
      [0, 2320],
      [4.3, 2850],
      [6.5, 3250],
      [8.4, 3350],
      [10.5, 3450],
      [12.2, 3496],
      [13, 3310],
    ],
  },
  {
    id: "qilai",
    name: "奇萊南華",
    peak: "奇萊南峰",
    elevation: 3358,
    region: "南投・花蓮",
    trailhead: "屯原登山口",
    days: 2,
    distanceKm: 30,
    difficulty: "入門",
    lat: 24.0614,
    lng: 121.2772,
    photo: { file: "ChiLaiSouthPeak.jpg", author: "Peellden", license: "Public domain", alt: "奇萊南峰的草坡與鐵杉" },
    summary: "走能高越嶺古道進天池山莊，隔天輕裝上兩座百岳。里程長但坡度很緩，適合第一次過夜。",
    profile: [
      [0, 2000],
      [4.5, 2360],
      [9, 2700],
      [13.1, 2860],
      [14.5, 3050],
      [16, 3358],
    ],
  },
  {
    id: "dabajian",
    name: "大霸尖山",
    peak: "大霸尖山",
    elevation: 3492,
    region: "新竹・苗栗",
    trailhead: "大鹿林道東線",
    days: 3,
    distanceKm: 60,
    difficulty: "進階",
    lat: 24.4594,
    lng: 121.2578,
    photo: { file: "大霸尖山.jpg", author: "Alan66625", license: "CC BY-SA 4.0", alt: "桶狀的大霸尖山岩峰" },
    summary: "「世紀奇峰」。光是林道就要走 19 公里才到真正的登山口，考驗的是耐力而不是技術。",
    profile: [
      [0, 1750],
      [4, 2699],
      [6.5, 3100],
      [8.5, 3250],
      [10, 3400],
      [11, 3492],
    ],
  },
];

export const difficultyOrder: Difficulty[] = ["入門", "中級", "進階"];

export const typedStrings = [
  "看一次玉山的日出",
  "走進雪山圈谷",
  "在嘉明湖畔醒來",
  "踩上箭竹草原的稜線",
];

export const gear = [
  "頭燈＋備用電池",
  "雨衣雨褲（兩截式）",
  "保暖中層＋羽絨外套",
  "登山鞋與備用襪",
  "行動糧與 2 公升飲水",
  "離線地圖與行動電源",
  "個人藥品與急救包",
  "入山／入園許可證",
];

export interface Session {
  date: string;
  trailId: string;
  leader: string;
  seats: number;
}

export const sessions: Session[] = [
  { date: "10/24（六）", trailId: "hehuan", leader: "阿凱", seats: 6 },
  { date: "10/31（六）– 11/01（日）", trailId: "qilai", leader: "小芸", seats: 3 },
  { date: "11/07（六）– 11/08（日）", trailId: "yushan", leader: "阿凱", seats: 0 },
  { date: "11/20（五）– 11/22（日）", trailId: "jiaming", leader: "大樹", seats: 4 },
];

export const faqs = [
  {
    q: "完全沒爬過高山，可以從哪一條開始？",
    a: "建議從合歡北峰這種單日來回的路線開始，先確認自己在海拔 3000 公尺以上的身體反應，再安排需要過夜的行程。",
  },
  {
    q: "什麼是入山證跟入園證？",
    a: "進入國家公園生態保護區要申請「入園證」，進入山地管制區要申請「入山證」，兩者主管機關不同。熱門路線的山屋床位通常要提前一個月抽籤。",
  },
  {
    q: "高山症怎麼預防？",
    a: "前一晚睡飽、上升速度放慢、多喝水。出現頭痛、噁心、走路不穩等症狀時，唯一有效的處理方式就是下降高度，不要硬撐。",
  },
  {
    q: "這個網站的資料可以直接拿來排行程嗎？",
    a: "不行。這是網頁程式設計課的練習頁面，里程與海拔剖面都是概略值，實際出發前請以各國家公園管理處公告的資訊為準。",
  },
];
