<?php
/**
 * 範例共用的步道資料，跟 Week 5／6 的 data.ts（src/app/demo/trailhead/）是同一批路線。
 * 里程、爬升都是課程練習用的概略值；梯次、領隊、費用皆為虛構。
 */

declare(strict_types=1);

const TRAILS = [
  ['id' => 'yushan', 'name' => '玉山主峰線', 'peak' => '玉山主峰', 'elevation' => 3952, 'region' => '南投・嘉義', 'trailhead' => '塔塔加登山口', 'days' => 2, 'distance' => 21.8, 'gain' => 1342, 'difficulty' => '中級'],
  ['id' => 'xueshan', 'name' => '雪山主東峰線', 'peak' => '雪山主峰', 'elevation' => 3886, 'region' => '台中・苗栗', 'trailhead' => '雪山登山口', 'days' => 2, 'distance' => 21.8, 'gain' => 1746, 'difficulty' => '中級'],
  ['id' => 'hehuan', 'name' => '合歡北峰', 'peak' => '合歡山北峰', 'elevation' => 3422, 'region' => '南投・花蓮', 'trailhead' => '台 14 甲 37K 登山口', 'days' => 1, 'distance' => 4.0, 'gain' => 452, 'difficulty' => '入門'],
  ['id' => 'jiaming', 'name' => '嘉明湖', 'peak' => '三叉山', 'elevation' => 3496, 'region' => '台東', 'trailhead' => '向陽登山口', 'days' => 3, 'distance' => 26.0, 'gain' => 1176, 'difficulty' => '中級'],
  ['id' => 'qilai', 'name' => '奇萊南華', 'peak' => '奇萊南峰', 'elevation' => 3358, 'region' => '南投・花蓮', 'trailhead' => '屯原登山口', 'days' => 2, 'distance' => 30.0, 'gain' => 1358, 'difficulty' => '入門'],
  ['id' => 'dabajian', 'name' => '大霸尖山', 'peak' => '大霸尖山', 'elevation' => 3492, 'region' => '新竹・苗栗', 'trailhead' => '大鹿林道東線', 'days' => 3, 'distance' => 60.0, 'gain' => 1742, 'difficulty' => '進階'],
];

const SESSIONS = [
  's1' => ['trail' => 'hehuan', 'start' => '2026-10-24', 'end' => '2026-10-24', 'leader' => '阿凱', 'seats' => 6, 'price' => 1800],
  's2' => ['trail' => 'qilai', 'start' => '2026-10-31', 'end' => '2026-11-01', 'leader' => '小芸', 'seats' => 3, 'price' => 4200],
  's3' => ['trail' => 'yushan', 'start' => '2026-11-07', 'end' => '2026-11-08', 'leader' => '阿凱', 'seats' => 0, 'price' => 5600],
  's4' => ['trail' => 'jiaming', 'start' => '2026-11-20', 'end' => '2026-11-22', 'leader' => '大樹', 'seats' => 4, 'price' => 6800],
];

/** 可租借的裝備：key => [名稱, 每人租金] */
const RENTALS = [
  'poles' => ['登山杖', 100],
  'sleeping-bag' => ['睡袋', 300],
  'headlamp' => ['頭燈', 80],
  'rainwear' => ['雨衣雨褲', 150],
];

const EXPERIENCE = [
  'first' => '第一次上 3000 公尺',
  'some' => '爬過幾座單日百岳',
  'veteran' => '有過夜縱走經驗',
];

function trail_by_id(string $id): ?array
{
  foreach (TRAILS as $trail) {
    if ($trail['id'] === $id) {
      return $trail;
    }
  }
  return null;
}
